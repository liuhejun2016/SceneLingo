import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scene } from '../types';
import { Play, Heart, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scenes')
      .then(res => res.json())
      .then(data => {
        setScenes(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading your library...</div>;
  }

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">My Library</h1>
      
      {scenes.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <p className="text-zinc-400 mb-4">You haven't created any scenes yet.</p>
          <Link to="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
            Create Your First Scene
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {scenes.map((scene, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={scene.id} 
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900"
            >
              <img src={scene.image_data} alt={scene.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                <h3 className="font-bold text-white leading-tight mb-1">{scene.title}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <span className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-md">{scene.language}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scene.likes}</span>
                </div>
              </div>
              <Link to={`/play/${scene.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center pl-1 shadow-xl">
                  <Play className="w-6 h-6" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
