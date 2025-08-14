import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'default' | 'black-gold' | 'emerald-elegance';

interface Theme {
  id: ThemeType;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    gradient: string;
    cardGradient: string;
    buttonGradient: string;
    glowColor: string;
  };
}

const themes: Record<ThemeType, Theme> = {
  default: {
    id: 'default',
    name: 'Классическая',
    description: 'Традиционная сине-фиолетовая тема корпуса',
    colors: {
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(251, 191, 36)',
      accent: 'rgb(139, 92, 246)',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)',
      surface: 'rgba(255, 255, 255, 0.05)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(203, 213, 225)',
      border: 'rgba(255, 255, 255, 0.1)',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
      buttonGradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)',
      glowColor: 'rgba(59, 130, 246, 0.5)'
    }
  },
  'black-gold': {
    id: 'black-gold',
    name: 'Чёрное золото',
    description: 'Элегантная чёрно-золотая тема с роскошными акцентами',
    colors: {
      primary: 'rgb(251, 191, 36)',
      secondary: 'rgb(245, 158, 11)',
      accent: 'rgb(217, 119, 6)',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #000000 100%)',
      surface: 'rgba(251, 191, 36, 0.05)',
      text: 'rgb(251, 191, 36)',
      textSecondary: 'rgb(245, 158, 11)',
      border: 'rgba(251, 191, 36, 0.2)',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
      buttonGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
      glowColor: 'rgba(251, 191, 36, 0.6)'
    }
  },
  'emerald-elegance': {
    id: 'emerald-elegance',
    name: 'Изумрудная элегантность',
    description: 'Природная зелёно-изумрудная тема с мятными акцентами',
    colors: {
      primary: 'rgb(16, 185, 129)',
      secondary: 'rgb(52, 211, 153)',
      accent: 'rgb(6, 182, 212)',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #047857 50%, #065f46 75%, #064e3b 100%)',
      surface: 'rgba(16, 185, 129, 0.05)',
      text: 'rgb(209, 250, 229)',
      textSecondary: 'rgb(167, 243, 208)',
      border: 'rgba(16, 185, 129, 0.2)',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #06b6d4 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
      buttonGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #06b6d4 100%)',
      glowColor: 'rgba(16, 185, 129, 0.5)'
    }
  }
};

interface ThemeContextType {
  currentTheme: ThemeType;
  theme: Theme;
  setTheme: (theme: ThemeType) => void;
  themes: Record<ThemeType, Theme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('nkkk-theme');
    return (saved as ThemeType) || 'default';
  });

  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    localStorage.setItem('nkkk-theme', theme);
  };

  // Применяем CSS переменные для текущей темы
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    
    // Устанавливаем CSS переменные
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-gradient', theme.colors.gradient);
    root.style.setProperty('--theme-card-gradient', theme.colors.cardGradient);
    root.style.setProperty('--theme-button-gradient', theme.colors.buttonGradient);
    root.style.setProperty('--theme-glow-color', theme.colors.glowColor);
    
    // Добавляем класс темы к body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      theme: themes[currentTheme], 
      setTheme, 
      themes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};