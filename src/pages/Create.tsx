import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateSceneImage, analyzeScene } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Wand2, Image as ImageIcon, Languages, Type } from 'lucide-react';
import { motion } from 'motion/react';

const STYLES = [
  { id: 'anime', name: 'Anime', desc: 'Japanese animation style' },
  { id: 'realistic', name: 'Realistic', desc: 'Photorealistic photography' },
  { id: '3d', name: '3D Render', desc: 'Pixar/Disney 3D style' },
  { id: 'watercolor', name: 'Watercolor', desc: 'Soft painted style' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Neon futuristic' },
];

const LANGUAGES = [
  { id: 'Japanese', name: 'Japanese' },
  { id: 'Spanish', name: 'Spanish' },
  { id: 'French', name: 'French' },
  { id: 'German', name: 'German' },
  { id: 'Korean', name: 'Korean' },
  { id: 'English', name: 'English' },
];

export default function Create() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('anime');
  const [language, setLanguage] = useState('Japanese');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setLoading(true);
    try {
      setStatus('Generating scene image (this takes a few seconds)...');
      const imageData = await generateSceneImage(prompt, style);
      
      setStatus('Analyzing scene and extracting vocabulary...');
      const wordsData = await analyzeScene(imageData, language);
      
      setStatus('Saving your new interactive scene...');
      const sceneId = uuidv4();
      
      const newScene = {
        id: sceneId,
        title: prompt,
        image_data: imageData,
        style,
        language,
        author: 'Me',
        words: wordsData.map(w => ({ ...w, id: uuidv4(), scene_id: sceneId }))
      };

      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScene)
      });

      if (res.ok) {
        navigate(`/play/${sceneId}`);
      } else {
        throw new Error('Failed to save scene');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate scene. Please try again.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Scene</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <Type className="w-4 h-4" /> What do you want to learn?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cozy coffee shop in Tokyo, A busy train station, A futuristic kitchen..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-32"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <Languages className="w-4 h-4" /> Target Language
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${language === lang.id ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Visual Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`p-3 rounded-xl text-left transition-colors ${style === s.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'} border`}
              >
                <div className={`font-medium ${style === s.id ? 'text-indigo-400' : 'text-zinc-200'}`}>{s.name}</div>
                <div className="text-xs text-zinc-500 mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt || loading}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Scene
            </>
          )}
        </button>

        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-indigo-400 font-medium"
          >
            {status}
          </motion.div>
        )}
      </div>
    </div>
  );
}
