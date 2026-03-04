import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  wordBgColor: string;
  wordTextColor: string;
  highlightBgColor: string;
  highlightBorderColor: string;
  passedBgColor: string;
  passedBorderColor: string;
}

export const defaultThemes: Theme[] = [
  {
    id: 'default',
    name: 'Default Dark',
    wordBgColor: 'rgba(0, 0, 0, 0.3)',
    wordTextColor: '#ffffff',
    highlightBgColor: 'rgba(99, 102, 241, 0.6)', // indigo-500/60
    highlightBorderColor: 'rgba(165, 180, 252, 0.8)', // indigo-300/80
    passedBgColor: 'rgba(16, 185, 129, 0.6)', // emerald-500/60
    passedBorderColor: 'rgba(110, 231, 183, 0.8)', // emerald-300/80
  },
  {
    id: 'light',
    name: 'Light Glass',
    wordBgColor: 'rgba(255, 255, 255, 0.4)',
    wordTextColor: '#000000',
    highlightBgColor: 'rgba(244, 63, 94, 0.6)', // rose-500/60
    highlightBorderColor: 'rgba(253, 164, 175, 0.8)', // rose-300/80
    passedBgColor: 'rgba(16, 185, 129, 0.6)',
    passedBorderColor: 'rgba(110, 231, 183, 0.8)',
  },
  {
    id: 'neon',
    name: 'Cyber Neon',
    wordBgColor: 'rgba(20, 0, 40, 0.6)',
    wordTextColor: '#00ffcc',
    highlightBgColor: 'rgba(255, 0, 255, 0.6)',
    highlightBorderColor: 'rgba(255, 100, 255, 0.8)',
    passedBgColor: 'rgba(0, 255, 0, 0.6)',
    passedBorderColor: 'rgba(100, 255, 100, 0.8)',
  }
];

interface ThemeContextType {
  themes: Theme[];
  activeThemeId: string;
  activeTheme: Theme;
  addTheme: (theme: Theme) => void;
  updateTheme: (theme: Theme) => void;
  deleteTheme: (id: string) => void;
  setActiveThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<Theme[]>(() => {
    const saved = localStorage.getItem('scenelingo_themes');
    return saved ? JSON.parse(saved) : defaultThemes;
  });
  
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('scenelingo_active_theme') || 'default';
  });

  useEffect(() => {
    localStorage.setItem('scenelingo_themes', JSON.stringify(themes));
  }, [themes]);

  useEffect(() => {
    localStorage.setItem('scenelingo_active_theme', activeThemeId);
  }, [activeThemeId]);

  const activeTheme = themes.find(t => t.id === activeThemeId) || defaultThemes[0];

  const addTheme = (theme: Theme) => setThemes(prev => [...prev, theme]);
  const updateTheme = (theme: Theme) => setThemes(prev => prev.map(t => t.id === theme.id ? theme : t));
  const deleteTheme = (id: string) => {
    setThemes(prev => prev.filter(t => t.id !== id));
    if (activeThemeId === id) setActiveThemeId('default');
  };

  return (
    <ThemeContext.Provider value={{ themes, activeThemeId, activeTheme, addTheme, updateTheme, deleteTheme, setActiveThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
