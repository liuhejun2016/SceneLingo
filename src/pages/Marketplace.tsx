import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scene } from '../types';
import { Play, Heart, Download, Compass, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Marketplace() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/scenes')
      .then(res => res.json())
      .then(data => {
        setScenes(data);
        setLoading(false);
      });
  }, []);

  const filteredScenes = scenes.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.language.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discover</h1>
        <Compass className="w-6 h-6 text-indigo-400" />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search languages, topics..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredScenes.map((scene, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={scene.id} 
              className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
            >
              <div className="relative aspect-video">
                <img src={scene.image_data} alt={scene.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-xs font-medium text-white">
                  {scene.language}
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-indigo-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{scene.title}</h3>
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>By {scene.author}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scene.likes}</span>
                    <Link to={`/play/${scene.id}`} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium">
                      <Play className="w-4 h-4" /> Play
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredScenes.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              No scenes found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
