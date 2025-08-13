import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Trash2, 
  AlertTriangle, 
  Target, 
  Trophy, 
  FileText, 
  Calendar, 
  CheckSquare, 
  MessageSquare,
  RefreshCw,
  Shield,
  Users,
  UserX
} from 'lucide-react';
import { 
  resetScores, 
  resetAchievements, 
  resetNews, 
  resetEvents, 
  resetTasks, 
  resetForum, 
  fullReset,
  resetCadets,
  resetCadetsByPlatoon
} from '../../lib/admin-resets';
import { staggerContainer, staggerItem } from '../../utils/animations';

const AdminResetMenu: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlatoon, setSelectedPlatoon] = useState<string>('');

  const platoons = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2', '10-1', '10-2', '11-1', '11-2'];

  const handleResetScores = async () => {
    if (!window.confirm('Вы уверены, что хотите сбросить ВСЕ баллы кадетов? Это действие нельзя отменить!')) {
      return;
    }

    try {
      setLoading('scores');
      await resetScores();
      alert('Все баллы успешно сброшены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting scores:', error);
      alert('Ошибка сброса баллов');
    } finally {
      setLoading(null);
    }
  };

  const handleResetAchievements = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ВСЕ достижения? Это действие нельзя отменить!')) {
      return;
    }

    try {
      setLoading('achievements');
      await resetAchievements();
      alert('Все достижения успешно удалены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting achievements:', error);
      alert('Ошибка сброса достижений');
    } finally {
      setLoading(null);
    }
  };

  const handleResetNews = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ВСЕ новости? Это действие нельзя отменить!')) {
      return;
    }

    try {
      setLoading('news');
      await resetNews();
      alert('Все новости успешно удалены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting news:', error);
      alert('Ошибка сброса новостей');
    } finally {
      setLoading(null);
    }
  };

  const handleResetEvents = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ВСЕ события? Это действие нельзя отменить!')) {
      return;
    }

    try {
      setLoading('events');
      await resetEvents();
      alert('Все события успешно удалены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting events:', error);
      alert('Ошибка сброса событий');
    } finally {
      setLoading(null);
    }
  };

  const handleResetTasks = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ВСЕ задания? Это действие нельзя отменить!')) {
      return;
    }

    try {
      setLoading('tasks');
      await resetTasks();
      alert('Все задания успешно удалены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting tasks:', error);
      alert('Ошибка сброса заданий');
    } finally {
      setLoading(null);
    }
  };

  const handleResetForum = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ВСЕ данные форума? Это действие нельзя отменить!')) {
      return;
    }

    try {
      setLoading('forum');
      await resetForum();
      alert('Все данные форума успешно удалены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting forum:', error);
      alert('Ошибка сброса форума');
    } finally {
      setLoading(null);
    }
  };

  const handleResetCadets = async () => {
    if (!window.confirm('⚠️ ВНИМАНИЕ! Вы собираетесь удалить ВСЕХ кадетов и их учетные записи. Это действие НЕЛЬЗЯ ОТМЕНИТЬ!')) {
      return;
    }

    const confirmation = window.prompt(
      'Для подтверждения удаления всех кадетов введите "УДАЛИТЬ КАДЕТОВ" (заглавными буквами):'
    );

    if (confirmation !== 'УДАЛИТЬ КАДЕТОВ') {
      alert('Неверное подтверждение. Операция отменена.');
      return;
    }

    try {
      setLoading('cadets');
      await resetCadets();
      alert('Все кадеты успешно удалены');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting cadets:', error);
      alert('Ошибка удаления кадетов');
    } finally {
      setLoading(null);
    }
  };

  const handleResetCadetsByPlatoon = async () => {
    if (!selectedPlatoon) {
      alert('Выберите взвод для удаления');
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите удалить ВСЕХ кадетов из ${selectedPlatoon} взвода? Это действие нельзя отменить!`)) {
      return;
    }

    try {
      setLoading('platoon');
      await resetCadetsByPlatoon(selectedPlatoon);
      alert(`Все кадеты из ${selectedPlatoon} взвода успешно удалены`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error resetting cadets by platoon:', error);
      alert('Ошибка удаления кадетов взвода');
    } finally {
      setLoading(null);
    }
  };

  const handleFullReset = async () => {
    if (!window.confirm('⚠️ ВНИМАНИЕ! Вы собираетесь ПОЛНОСТЬЮ ОЧИСТИТЬ ВСЕ ДАННЫЕ системы, включая всех кадетов, пользователей, баллы, достижения, новости, события, задания и форум. Это действие НЕЛЬЗЯ ОТМЕНИТЬ!')) {
      return;
    }

    const confirmation = window.prompt(
      'Для подтверждения полного сброса введите "ПОДТВЕРДИТЬ" (заглавными буквами):'
    );

    if (confirmation !== 'ПОДТВЕРДИТЬ') {
      alert('Неверное подтверждение. Операция отменена.');
      return;
    }

    try {
      setLoading('full');
      await fullReset();
      alert('Полный сброс данных выполнен успешно');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      console.error('Error performing full reset:', error);
      alert('Ошибка полного сброса данных');
    } finally {
      setLoading(null);
    }
  };

  const resetActions = [
    {
      key: 'scores',
      title: 'Сбросить баллы',
      description: 'Удалить все баллы кадетов и историю начислений',
      icon: Target,
      color: 'from-blue-600 to-blue-800',
      action: handleResetScores
    },
    {
      key: 'achievements',
      title: 'Сбросить достижения',
      description: 'Удалить все достижения и награды кадетов',
      icon: Trophy,
      color: 'from-yellow-600 to-yellow-800',
      action: handleResetAchievements
    },
    {
      key: 'news',
      title: 'Сбросить новости',
      description: 'Удалить все новости и статьи',
      icon: FileText,
      color: 'from-green-600 to-green-800',
      action: handleResetNews
    },
    {
      key: 'events',
      title: 'Сбросить события',
      description: 'Удалить все события и регистрации',
      icon: Calendar,
      color: 'from-purple-600 to-purple-800',
      action: handleResetEvents
    },
    {
      key: 'tasks',
      title: 'Сбросить задания',
      description: 'Удалить все задания и сдачи',
      icon: CheckSquare,
      color: 'from-indigo-600 to-indigo-800',
      action: handleResetTasks
    },
    {
      key: 'forum',
      title: 'Сбросить форум',
      description: 'Удалить все темы, сообщения и категории форума',
      icon: MessageSquare,
      color: 'from-cyan-600 to-cyan-800',
      action: handleResetForum
    }
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Warning Header */}
      <motion.div
        variants={staggerItem}
        className="card-gradient from-red-600 to-red-800 p-8 border-2 border-red-400/50"
      >
        <div className="flex items-center space-x-4 mb-4">
          <AlertTriangle className="h-12 w-12 text-white" />
          <div>
            <h2 className="text-3xl font-bold text-white">Управление данными</h2>
            <p className="text-red-100">Опасная зона - все операции необратимы!</p>
          </div>
        </div>
        <div className="bg-red-900/30 rounded-xl p-6 border border-red-400/30">
          <p className="text-white font-semibold text-lg">
            ⚠️ Внимание! Все операции сброса данных являются необратимыми. 
            Убедитесь, что у вас есть резервная копия данных перед выполнением любых операций.
          </p>
        </div>
      </motion.div>

      {/* Cadet Management Section */}
      <motion.div variants={staggerItem}>
        <h3 className="text-2xl font-bold text-white mb-6">Управление кадетами</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reset All Cadets */}
          <motion.div
            variants={staggerItem}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card-gradient from-red-700 to-red-900 p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 mb-4">
              <UserX className="h-8 w-8 text-white" />
              <h4 className="text-xl font-bold text-white">Удалить всех кадетов</h4>
            </div>
            <p className="text-white/90 mb-6 text-sm">
              Удалить всех кадетов и их учетные записи из системы
            </p>
            <button
              onClick={handleResetCadets}
              disabled={loading === 'cadets'}
              className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
            >
              {loading === 'cadets' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
                  <span>Удалить всех</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Reset Cadets by Platoon */}
          <motion.div
            variants={staggerItem}
            whileHover={{ scale: 1.05, y: -5 }}
            className="card-gradient from-orange-600 to-orange-800 p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-white" />
              <h4 className="text-xl font-bold text-white">Удалить взвод</h4>
            </div>
            <p className="text-white/90 mb-4 text-sm">
              Удалить всех кадетов из выбранного взвода
            </p>
            <div className="space-y-4">
              <select
                value={selectedPlatoon}
                onChange={(e) => setSelectedPlatoon(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Выберите взвод</option>
                {platoons.map(platoon => (
                  <option key={platoon} value={platoon} className="bg-gray-800">
                    {platoon} взвод
                  </option>
                ))}
              </select>
              <button
                onClick={handleResetCadetsByPlatoon}
                disabled={loading === 'platoon' || !selectedPlatoon}
                className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
              >
                {loading === 'platoon' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Удалить взвод</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Individual Reset Actions */}
      <motion.div variants={staggerItem}>
        <h3 className="text-2xl font-bold text-white mb-6">Частичный сброс данных</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resetActions.map(({ key, title, description, icon: Icon, color, action }) => (
            <motion.div
              key={key}
              variants={staggerItem}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`card-gradient ${color} p-6 border border-white/20 hover:border-white/40 transition-all duration-300`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Icon className="h-8 w-8 text-white" />
                <h4 className="text-xl font-bold text-white">{title}</h4>
              </div>
              <p className="text-white/90 mb-6 text-sm">{description}</p>
              <button
                onClick={action}
                disabled={loading === key}
                className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
              >
                {loading === key ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Сбросить</span>
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Full Reset Section */}
      <motion.div
        variants={staggerItem}
        className="card-gradient from-red-800 to-red-900 p-8 border-2 border-red-400/50"
      >
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Shield className="h-16 w-16 text-white" />
            <div>
              <h3 className="text-4xl font-bold text-white">Полный сброс системы</h3>
              <p className="text-red-100 text-lg">Удаление ВСЕХ данных включая пользователей</p>
            </div>
          </div>
          
          <div className="bg-red-900/50 rounded-xl p-8 border border-red-400/30 mb-8">
            <h4 className="text-2xl font-bold text-white mb-4">Что будет удалено:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <ul className="space-y-2 text-white">
                <li>• Все кадеты и их профили</li>
                <li>• Все пользователи из auth.users</li>
                <li>• Все баллы и история начислений</li>
                <li>• Все достижения и награды</li>
              </ul>
              <ul className="space-y-2 text-white">
                <li>• Все новости и статьи</li>
                <li>• Все события и регистрации</li>
                <li>• Все задания и сдачи</li>
                <li>• Весь форум (темы, сообщения, категории)</li>
              </ul>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFullReset}
            disabled={loading === 'full'}
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-xl font-bold text-xl transition-all duration-300 flex items-center space-x-3 mx-auto shadow-2xl disabled:cursor-not-allowed"
          >
            {loading === 'full' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Database className="h-6 w-6" />
                <span>ПОЛНЫЙ СБРОС СИСТЕМЫ</span>
                <AlertTriangle className="h-6 w-6" />
              </>
            )}
          </motion.button>
          
          <p className="text-red-200 text-sm mt-4 font-semibold">
            После полного сброса вы будете перенаправлены на главную страницу
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminResetMenu;