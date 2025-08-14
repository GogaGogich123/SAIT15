import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Sparkles, Crown, Leaf } from 'lucide-react';
import { useTheme, type ThemeType } from '../context/ThemeContext';

const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeIcons = {
    default: Sparkles,
    'black-gold': Crown,
    'emerald-elegance': Leaf
  };

  const handleThemeChange = (themeId: ThemeType) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 text-white hover:bg-white/20 transition-all duration-300"
      >
        <Palette className="h-5 w-5" />
        <span className="hidden sm:inline font-semibold">Тема</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Theme Selector Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl z-50"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Palette className="h-6 w-6 mr-2" />
                Выбор темы
              </h3>
              
              <div className="space-y-3">
                {Object.values(themes).map((theme) => {
                  const Icon = themeIcons[theme.id];
                  const isSelected = currentTheme === theme.id;
                  
                  return (
                    <motion.button
                      key={theme.id}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 ${
                        isSelected
                          ? 'border-white/40 bg-white/20 shadow-lg'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: theme.colors.gradient }}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-white">{theme.name}</div>
                            <div className="text-sm text-white/70">{theme.description}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                          >
                            <Check className="h-4 w-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Theme Preview */}
                      <div className="flex space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white/30"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white/30"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white/30"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-white/60 text-sm text-center">
                  Тема сохраняется автоматически
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSelector;