import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  name: string;
  type: 'cadet' | 'news' | 'task';
  subtitle?: string;
  url: string;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  results?: SearchResult[];
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Поиск...', 
  onSearch,
  results = [],
  isLoading = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center text-blue-300">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                Поиск...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    to={result.url}
                    onClick={handleResultClick}
                    className="block px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-blue-300 flex-shrink-0" />
                      <div>
                        <div className="text-white font-medium">{result.name}</div>
                        {result.subtitle && (
                          <div className="text-blue-300 text-sm">{result.subtitle}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-blue-300">
                Ничего не найдено
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;