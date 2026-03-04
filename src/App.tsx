import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Create from './pages/Create';
import Marketplace from './pages/Marketplace';
import Play from './pages/Play';
import Settings from './pages/Settings';
import { Compass, PlusCircle, Library, Settings as SettingsIcon } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
          <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
              <Link to="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                SceneLingo
              </Link>
              <div className="flex gap-4">
                <Link to="/marketplace" className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors">
                  <Compass className="w-6 h-6" />
                </Link>
                <Link to="/create" className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors">
                  <PlusCircle className="w-6 h-6" />
                </Link>
                <Link to="/" className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors">
                  <Library className="w-6 h-6" />
                </Link>
                <Link to="/settings" className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors">
                  <SettingsIcon className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </nav>
          
          <main className="flex-1 max-w-md w-full mx-auto relative overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/play/:id" element={<Play />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
