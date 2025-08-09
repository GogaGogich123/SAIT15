import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
  Home, 
  Award, 
  User, 
  Newspaper, 
  CheckSquare, 
  LogIn, 
  LogOut,
  Settings,
  Shield,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import Button from './ui/Button';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/', name: 'Главная', icon: Home },
    { path: '/rating', name: 'Рейтинг', icon: Award },
    { path: '/news', name: 'Новости', icon: Newspaper },
    { path: '/tasks', name: 'Задания', icon: CheckSquare },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 shadow-2xl border-b border-secondary-400/20 sticky top-0 z-50 backdrop-blur-sm"
    >
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-10 w-10 text-secondary-400" />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-400 to-secondary-600 blur-sm opacity-60"></div>
            </div>
            <div className="text-white">
              <div className="font-display font-bold text-lg">НККК</div>
              <div className="text-xs text-primary-200 hidden sm:block">Новороссийский казачий кадетский корпус</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map(({ path, name, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`nav-link ${
                  location.pathname === path
                    ? 'nav-link-active'
                    : 'nav-link-inactive'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{name}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Search Bar */}
                <div className="hidden lg:block">
                  <SearchBar placeholder="Поиск кадетов..." />
                </div>
                
                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className="btn-icon"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </motion.button>
                
                {user.role === 'cadet' && (
                  <Link
                    to={`/cadet/${user.id}`}
                    className="nav-link-inactive"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="nav-link-inactive"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Админ</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-error-600 hover:bg-error-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Выход</span>
                </button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" icon={LogIn}>
                  Вход
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden btn-icon"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/20 py-4"
            >
              <nav className="flex flex-col space-y-2">
                {navItems.map(({ path, name, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`nav-link ${
                      location.pathname === path
                        ? 'nav-link-active'
                        : 'nav-link-inactive'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{name}</span>
                  </Link>
                ))}
                
                {/* Mobile Search */}
                <div className="pt-4 border-t border-white/20">
                  <SearchBar placeholder="Поиск кадетов..." />
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;