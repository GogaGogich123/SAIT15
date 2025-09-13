import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Award, 
  Users, 
  Target,
  TrendingUp,
  Calendar,
  Star,
  Trophy,
  Medal
} from 'lucide-react';
import { getCadets, getScoreHistory, type Cadet, type ScoreHistory } from '../../lib/supabase';
import ScoreModal from './modals/ScoreModal';
import { staggerContainer, staggerItem } from '../../utils/animations';

export function ScoreManagement() {
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [scoreForm, setScoreForm] = useState({
    cadetId: '',
    category: 'study' as 'study' | 'discipline' | 'events',
    points: 0,
    description: ''
  });

  useEffect(() => {
    fetchCadets();
    fetchScoreHistory();
  }, []);

  const fetchCadets = async () => {
    try {
      const data = await getCadets();
      setCadets(data || []);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      alert('Ошибка загрузки кадетов');
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreHistory = async () => {
    try {
      // Получаем историю баллов для всех кадетов
      const allHistory: ScoreHistory[] = [];
      for (const cadet of cadets) {
        try {
          const history = await getScoreHistory(cadet.id);
          allHistory.push(...history);
        } catch (error) {
          console.error(`Error fetching history for cadet ${cadet.id}:`, error);
        }
      }
      
      // Сортируем по дате создания (новые сначала)
      allHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setScoreHistory(allHistory.slice(0, 20)); // Показываем последние 20 записей
    } catch (error) {
      console.error('Error fetching score history:', error);
    }
  };

  const handleAddScore = (cadet: Cadet) => {
    setSelectedCadet(cadet);
    setScoreForm({
      cadetId: cadet.id,
      category: 'study',
      points: 0,
      description: ''
    });
    setIsScoreModalOpen(true);
  };

  const handleScoreAdded = () => {
    fetchCadets();
    fetchScoreHistory();
    setIsScoreModalOpen(false);
    setSelectedCadet(null);
    setScoreForm({
      cadetId: '',
      category: 'study',
      points: 0,
      description: ''
    });
  };

  const filteredCadets = cadets.filter(cadet =>
    cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.platoon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'from-blue-500 to-blue-700';
      case 'discipline': return 'from-red-500 to-red-700';
      case 'events': return 'from-green-500 to-green-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return Trophy;
      case 'discipline': return Target;
      case 'events': return Users;
      default: return Star;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'study': return 'Учёба';
      case 'discipline': return 'Дисциплина';
      case 'events': return 'Мероприятия';
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-300">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">Управление баллами</h2>
          <p className="text-blue-200 text-lg">Начисляйте и отслеживайте баллы кадетов</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск кадетов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 w-80"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Cadets List */}
        <motion.div variants={staggerItem} className="xl:col-span-2">
          <div className="card-hover p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">Кадеты</h3>
              <span className="text-blue-300 font-semibold">({filteredCadets.length})</span>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {filteredCadets.map((cadet) => (
                <motion.div
                  key={cadet.id}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="glass-effect p-6 rounded-xl border border-white/10 hover:border-blue-400/30 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                          alt={cadet.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/50 group-hover:border-yellow-400/70 transition-colors"
                        />
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                          #{cadet.rank}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">
                          {cadet.name}
                        </h4>
                        <p className="text-blue-300 font-semibold">
                          {cadet.platoon} взвод
                        </p>
                        <p className="text-blue-400 text-sm">
                          Общий балл: <span className="font-bold text-yellow-400">{cadet.total_score}</span>
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddScore(cadet)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-green-500/25"
                    >
                      <Award className="w-5 h-5" />
                      <span>Начислить</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Score History */}
        <motion.div variants={staggerItem}>
          <div className="card-hover p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold text-white">Последние начисления</h3>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {scoreHistory.map((entry) => {
                const CategoryIcon = getCategoryIcon(entry.category);
                const cadet = cadets.find(c => c.id === entry.cadet_id);
                
                return (
                  <motion.div
                    key={entry.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="glass-effect p-4 rounded-xl border border-white/10 hover:border-blue-400/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(entry.category)}`}>
                          <CategoryIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{cadet?.name || 'Неизвестный кадет'}</div>
                          <div className="text-blue-300 text-sm">{getCategoryName(entry.category)}</div>
                        </div>
                      </div>
                      <div className={`text-xl font-black ${entry.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.points >= 0 ? '+' : ''}{entry.points}
                      </div>
                    </div>
                    <p className="text-blue-200 text-sm mb-2">{entry.description}</p>
                    <p className="text-blue-400 text-xs">
                      {new Date(entry.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </motion.div>
                );
              })}
              
              {scoreHistory.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-blue-300 text-lg">Пока нет записей о начислении баллов</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Score Modal */}
      <ScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => {
          setIsScoreModalOpen(false);
          setSelectedCadet(null);
        }}
        form={scoreForm}
        setForm={setScoreForm}
        cadets={cadets}
        onSuccess={handleScoreAdded}
      />
    </motion.div>
  );
}