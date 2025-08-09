import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Clock, 
  Star, 
  AlertCircle, 
  Trophy,
  BookOpen,
  Users,
  Target,
  Calendar,
  Filter,
  SortAsc
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import ModernBackground from '../components/ModernBackground';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getTasks, 
  getTaskSubmissions, 
  takeTask, 
  submitTask, 
  abandonTask,
  type Task,
  type TaskSubmission
} from '../lib/supabase';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

interface TaskWithSubmission extends Task {
  submission?: TaskSubmission;
  userStatus: 'available' | 'taken' | 'submitted' | 'completed' | 'rejected';
}

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'points' | 'difficulty'>('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [tasks, setTasks] = useState<TaskWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.cadetId) return;
      
      try {
        setLoading(true);
        
        // Получаем все активные задания
        const tasksData = await getTasks();
        
        // Получаем сдачи заданий текущего кадета
        const submissionsData = await getTaskSubmissions(user.cadetId);
        
        // Объединяем данные
        const tasksWithSubmissions: TaskWithSubmission[] = tasksData.map(task => {
          const submission = submissionsData.find(s => s.task_id === task.id);
          return {
            ...task,
            submission,
            userStatus: submission ? submission.status : 'available'
          };
        });
        
        setTasks(tasksWithSubmissions);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Ошибка загрузки заданий');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user?.cadetId]);

  const categories = [
    { key: 'all', name: 'Все задания', icon: CheckSquare, color: 'from-gray-600 to-gray-800' },
    { key: 'study', name: 'Учёба', icon: BookOpen, color: 'from-blue-600 to-blue-800' },
    { key: 'discipline', name: 'Дисциплина', icon: Target, color: 'from-red-600 to-red-800' },
    { key: 'events', name: 'Мероприятия', icon: Users, color: 'from-green-600 to-green-800' },
  ];

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'points':
        return b.points - a.points;
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
      default:
        return 0;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-blue-400 bg-blue-400/20';
      case 'taken': return 'text-yellow-400 bg-yellow-400/20';
      case 'submitted': return 'text-orange-400 bg-orange-400/20';
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (userStatus: string) => {
    switch (userStatus) {
      case 'available': return 'Доступно';
      case 'taken': return 'Взято';
      case 'submitted': return 'На проверке';
      case 'completed': return 'Выполнено';
      case 'rejected': return 'Отклонено';
      default: return userStatus;
    }
  };

  const handleTakeTask = async (taskId: string) => {
    if (!user?.cadetId) return;
    
    try {
      await takeTask(taskId, user.cadetId);
      // Обновляем список заданий
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, userStatus: 'taken' }
          : task
      ));
    } catch (error) {
      console.error('Error taking task:', error);
      alert('Ошибка при взятии задания');
    }
  };

  const handleSubmitTask = async (taskId: string) => {
    if (!user?.cadetId) return;
    
    try {
      await submitTask(taskId, user.cadetId, submissionText);
      // Обновляем список заданий
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, userStatus: 'submitted' }
          : task
      ));
      setSelectedTask(null);
      setSubmissionText('');
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Ошибка при сдаче задания');
    }
  };

  const handleAbandonTask = async (taskId: string) => {
    if (!user?.cadetId) return;
    
    try {
      await abandonTask(taskId, user.cadetId);
      // Обновляем список заданий
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, userStatus: 'available' }
          : task
      ));
    } catch (error) {
      console.error('Error abandoning task:', error);
      alert('Ошибка при отказе от задания');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Требуется авторизация</h2>
          <p className="text-blue-200">Войдите в систему, чтобы просматривать и выполнять задания</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <AnimatedSVGBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-800/95 z-10"></div>
      
      <div className="relative z-20 section-padding">
        <div className="container-custom">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-7xl font-display font-black mb-6 text-gradient text-glow">
            Задания
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
            Выполняйте задания и получайте баллы рейтинга
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div>
            <LoadingSpinner message="Загрузка заданий..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Categories */}
        {!loading && !error && (
          <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {categories.map(({ key, name, icon: Icon, color }) => (
            <motion.button
              key={key}
              variants={staggerItem}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(key)}
              className={`relative overflow-hidden p-6 rounded-2xl transition-all duration-500 shadow-2xl ${
                selectedCategory === key
                  ? 'scale-105 shadow-blue-500/25'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} ${
                selectedCategory === key ? 'opacity-100' : 'opacity-60'
              }`}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col items-center text-white">
                <Icon className="h-10 w-10 mb-3" />
                <span className="font-bold text-base">{name}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
        )}

        {/* Filters and Sort */}
        {!loading && !error && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="glass-effect rounded-2xl p-8 mb-12 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-6 w-6 text-blue-300" />
                <span className="text-white font-bold text-lg">Фильтры:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-200 text-base font-semibold">Всего заданий: {filteredTasks.length}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <SortAsc className="h-6 w-6 text-blue-300" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input px-4 py-2 text-base"
                >
                  <option value="deadline">По дедлайну</option>
                  <option value="points">По баллам</option>
                  <option value="difficulty">По сложности</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tasks Grid */}
        {!loading && !error && (
          <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {sortedTasks.map((task, index) => (
            <motion.div
              key={task.id}
              variants={staggerItem}
              whileHover={{ scale: 1.05, y: -10 }}
              className={`card-hover p-8 border transition-all duration-500 shadow-2xl ${
                task.userStatus === 'completed' 
                  ? 'border-green-400/50 bg-green-400/5' 
                  : task.userStatus === 'taken'
                  ? 'border-yellow-400/50 bg-yellow-400/5'
                  : 'border-white/20 hover:border-yellow-400/50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-2 rounded-full text-sm font-bold ${getStatusColor(task.userStatus)}`}>
                    {getStatusText(task.userStatus)}
                  </div>
                  <div className={`px-3 py-2 rounded-full text-sm font-bold ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty === 'easy' ? 'Легко' : task.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Star className="h-6 w-6" />
                  <span className="font-black text-lg">{task.points}</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 text-shadow">{task.title}</h3>
              <p className="text-blue-200 mb-6 line-clamp-3 text-base">{task.description}</p>

              <div className="flex items-center justify-between text-blue-300 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">До {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">
                    {Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дн.
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {task.userStatus === 'available' && (
                  <button
                    onClick={() => handleTakeTask(task.id)}
                    className="flex-1 btn-primary"
                  >
                    Взять задание
                  </button>
                )}
                {task.userStatus === 'taken' && (
                  <>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-500 hover:scale-105 shadow-lg"
                    >
                      Сдать
                    </button>
                    <button
                      onClick={() => handleAbandonTask(task.id)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-500 hover:scale-105 shadow-lg"
                    >
                      Отказаться
                    </button>
                  </>
                )}
                {task.userStatus === 'completed' && (
                  <div className="flex-1 flex items-center justify-center text-green-400 font-bold text-lg">
                    <Trophy className="h-6 w-6 mr-2" />
                    Выполнено
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
        )}

        {/* Submit Task Modal */}
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-effect rounded-3xl max-w-3xl w-full p-12 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-4xl font-display font-black text-white mb-6 text-shadow">Сдача задания</h2>
              <h3 className="text-2xl text-blue-200 mb-8 font-semibold">{selectedTask.title}</h3>
              
              <div className="mb-8">
                <label className="block text-white font-bold text-lg mb-4">
                  Отчет о выполнении:
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Опишите, как вы выполнили задание..."
                  rows={8}
                  className="input resize-none text-lg"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleSubmitTask(selectedTask.id)}
                  disabled={!submissionText.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 shadow-lg"
                >
                  Отправить на проверку
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 shadow-lg"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default TasksPage;