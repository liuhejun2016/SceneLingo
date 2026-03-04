import { useState } from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { Plus, Trash2, Check } from 'lucide-react';

export default function Settings() {
  const { themes, activeThemeId, setActiveThemeId, addTheme, updateTheme, deleteTheme } = useTheme();
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const handleCreateNew = () => {
    const newTheme: Theme = {
      id: `theme_${Date.now()}`,
      name: 'New Theme',
      wordBgColor: 'rgba(0, 0, 0, 0.3)',
      wordTextColor: '#ffffff',
      highlightBgColor: 'rgba(99, 102, 241, 0.6)',
      highlightBorderColor: 'rgba(165, 180, 252, 0.8)',
      passedBgColor: 'rgba(16, 185, 129, 0.6)',
      passedBorderColor: 'rgba(110, 231, 183, 0.8)',
    };
    addTheme(newTheme);
    setActiveThemeId(newTheme.id);
    setEditingTheme(newTheme);
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6">Theme Settings</h1>
      
      {!editingTheme ? (
        <div className="space-y-6">
          <div className="grid gap-4">
            {themes.map(theme => (
              <div 
                key={theme.id}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  activeThemeId === theme.id 
                    ? 'bg-zinc-900 border-indigo-500' 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => setActiveThemeId(theme.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border ${activeThemeId === theme.id ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`}>
                      {activeThemeId === theme.id && <Check className="w-3 h-3 text-white m-auto mt-0.5" />}
                    </div>
                    <h3 className="font-medium text-lg">{theme.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveThemeId(theme.id);
                        setEditingTheme(theme);
                      }}
                      className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {theme.id !== 'default' && theme.id !== 'light' && theme.id !== 'neon' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTheme(theme.id);
                        }}
                        className="text-xs px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Preview */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <div 
                    className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
                    style={{ backgroundColor: theme.wordBgColor, color: theme.wordTextColor, borderColor: 'transparent' }}
                  >
                    Normal Word
                  </div>
                  <div 
                    className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
                    style={{ backgroundColor: theme.highlightBgColor, color: theme.wordTextColor, borderColor: theme.highlightBorderColor }}
                  >
                    Highlighted
                  </div>
                  <div 
                    className="px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap"
                    style={{ backgroundColor: theme.passedBgColor, color: theme.wordTextColor, borderColor: theme.passedBorderColor }}
                  >
                    Passed
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleCreateNew}
            className="w-full py-4 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Custom Theme</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Edit Theme</h2>
            <button 
              onClick={() => setEditingTheme(null)}
              className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
          
          <div className="space-y-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Theme Name</label>
              <input 
                type="text" 
                value={editingTheme.name}
                onChange={e => {
                  const updated = { ...editingTheme, name: e.target.value };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker 
                label="Word Background" 
                value={editingTheme.wordBgColor} 
                onChange={val => {
                  const updated = { ...editingTheme, wordBgColor: val };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }} 
              />
              <ColorPicker 
                label="Text Color" 
                value={editingTheme.wordTextColor} 
                allowAlpha={false}
                onChange={val => {
                  const updated = { ...editingTheme, wordTextColor: val };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }} 
              />
              <ColorPicker 
                label="Highlight Background" 
                value={editingTheme.highlightBgColor} 
                onChange={val => {
                  const updated = { ...editingTheme, highlightBgColor: val };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }} 
              />
              <ColorPicker 
                label="Highlight Border" 
                value={editingTheme.highlightBorderColor} 
                onChange={val => {
                  const updated = { ...editingTheme, highlightBorderColor: val };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }} 
              />
              <ColorPicker 
                label="Passed Background" 
                value={editingTheme.passedBgColor} 
                onChange={val => {
                  const updated = { ...editingTheme, passedBgColor: val };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }} 
              />
              <ColorPicker 
                label="Passed Border" 
                value={editingTheme.passedBorderColor} 
                onChange={val => {
                  const updated = { ...editingTheme, passedBorderColor: val };
                  setEditingTheme(updated);
                  updateTheme(updated);
                }} 
              />
            </div>
            
            <div className="mt-6 p-6 rounded-xl bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center relative overflow-hidden h-72 flex flex-col">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="text-center mb-4 text-white/70 text-sm font-medium uppercase tracking-wider">Live Preview</div>
                <div className="flex justify-center items-center gap-6 flex-1">
                  
                  {/* Normal Card */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] mb-2" />
                    <div 
                      className="px-3 py-2 rounded-xl backdrop-blur-md shadow-lg border transition-colors flex flex-col items-center min-w-[100px]"
                      style={{ backgroundColor: editingTheme.wordBgColor, color: editingTheme.wordTextColor, borderColor: 'rgba(255,255,255,0.2)' }}
                    >
                      <span className="font-bold text-lg leading-none mb-1">Apple</span>
                      <span className="text-xs font-medium mb-1" style={{ opacity: 0.8 }}>りんご (Ringo)</span>
                      <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full" style={{ opacity: 0.9 }}>Manzana</span>
                    </div>
                  </div>

                  {/* Highlighted Card */}
                  <div className="relative flex flex-col items-center -mt-4">
                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] mb-2" />
                    <div 
                      className="px-3 py-2 rounded-xl backdrop-blur-md shadow-lg border transition-colors flex flex-col items-center min-w-[100px] scale-110"
                      style={{ backgroundColor: editingTheme.highlightBgColor, color: editingTheme.wordTextColor, borderColor: editingTheme.highlightBorderColor }}
                    >
                      <span className="font-bold text-lg leading-none mb-1">Cat</span>
                      <span className="text-xs font-medium mb-1" style={{ opacity: 0.8 }}>ねこ (Neko)</span>
                      <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full" style={{ opacity: 0.9 }}>Gato</span>
                    </div>
                  </div>

                  {/* Passed Card */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] mb-2" />
                    <div 
                      className="px-3 py-2 rounded-xl backdrop-blur-md shadow-lg border transition-colors flex flex-col items-center min-w-[100px]"
                      style={{ backgroundColor: editingTheme.passedBgColor, color: editingTheme.wordTextColor, borderColor: editingTheme.passedBorderColor }}
                    >
                      <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg" style={{ backgroundColor: editingTheme.passedBorderColor }}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-lg leading-none mb-1">Sun</span>
                      <span className="text-xs font-medium mb-1" style={{ opacity: 0.8 }}>たいよう (Taiyō)</span>
                      <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full" style={{ opacity: 0.9 }}>Sol</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for color conversion
function rgbaToHex(rgba: string): string {
  if (rgba.startsWith('#')) return rgba.slice(0, 7);
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function rgbaToAlpha(rgba: string): number {
  if (rgba.startsWith('#')) {
    if (rgba.length === 9) {
      return parseInt(rgba.slice(7, 9), 16) / 255;
    }
    return 1;
  }
  const match = rgba.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 1;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ColorPicker({ 
  label, 
  value, 
  onChange,
  allowAlpha = true
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  allowAlpha?: boolean;
}) {
  const hex = rgbaToHex(value);
  const alpha = rgbaToAlpha(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400">{label}</label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input 
            type="color" 
            value={hex}
            onChange={e => {
              if (allowAlpha) {
                onChange(hexToRgba(e.target.value, alpha));
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-10 h-10 rounded cursor-pointer bg-transparent"
          />
          <input 
            type="text" 
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        {allowAlpha && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-12">Opacity</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={alpha}
              onChange={e => {
                onChange(hexToRgba(hex, parseFloat(e.target.value)));
              }}
              className="flex-1 accent-indigo-500"
            />
            <span className="text-xs text-zinc-500 w-8 text-right">{Math.round(alpha * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
