import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import ModernBackground from '../components/ModernBackground';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import { useToast } from '../hooks/useToast';
import { fadeInUp, scaleIn } from '../utils/animations';

const LoginPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Неверный email или пароль');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuperAdmin = async () => {
    if (!confirm('Создать главного администратора с данными:\nEmail: superadmin@nkkk.ru\nПароль: superadmin123')) {
      return;
    }

    try {
      setCreatingAdmin(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-super-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'superadmin@nkkk.ru',
          password: 'superadmin123',
          name: 'Главный администратор'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания администратора');
      }

      success('Главный администратор создан! Теперь можете войти в систему.');
      setEmail('superadmin@nkkk.ru');
      setPassword('superadmin123');
    } catch (error) {
      console.error('Error creating super admin:', error);
      showError(error instanceof Error ? error.message : 'Ошибка создания администратора');
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <AnimatedSVGBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-800/95 z-10"></div>
      
      <div className="relative z-20 max-w-lg w-full mx-4">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="mx-auto h-24 w-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-8 shadow-2xl hover-glow"
          >
            <Shield className="h-14 w-14 text-white" />
          </motion.div>
          <h2 className="text-5xl font-display font-black text-white mb-4 text-shadow text-glow">Вход в систему</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full mb-4"></div>
          <p className="text-xl text-blue-200 font-semibold">Новороссийский казачий кадетский корпус</p>
        </motion.div>

        <motion.form
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-effect rounded-3xl p-12 shadow-2xl border border-white/20 hover-lift"
          onSubmit={handleSubmit}
        >
          <div className="space-y-8">
            <div>
              <label htmlFor="email" className="block text-lg font-bold text-white mb-3">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-lg"
                placeholder="Введите ваш email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-bold text-white mb-3">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input text-lg"
                placeholder="Введите ваш пароль"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4"
              >
                <AlertCircle className="h-6 w-6" />
                <span className="text-base font-semibold">{error}</span>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: isLoading ? 1 : 0.95 }}
              className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-blue-900 font-black text-xl rounded-xl transition-all duration-500 shadow-2xl hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900"></div>
              ) : (
                <>
                  <LogIn className="h-6 w-6 mr-3" />
                  Войти
                </>
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default LoginPage;