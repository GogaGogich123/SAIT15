import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Users, 
  Search, 
  Plus,
  Trophy,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { 
  getCadets, 
  addScoreHistory,
  type Cadet 
} from '../../lib/supabase';
import { updateCadetScoresAdmin } from '../../lib/admin';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface ScoreForm {
  cadetId: string;
  points: number;
  description: string;
}

const ScoreManagement: React.FC = () => {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'study' | 'discipline' | 'events'>('study');
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [filteredCadets, setFilteredCadets] = useState<Cadet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatoon, setSelectedPlatoon] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [forms, setForms] = useState<Record<string, ScoreForm>>({
    study: { cadetId: '', points: 0, description: '' },
    discipline: { cadetId: '', points: 0, description: '' },
    events: { cadetId: '', points: 0, description: '' }
  });

  const platoons = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2', '10-1', '10-2', '11-1', '11-2'];

  const tabs = [
    {
      key: 'study' as const,
      name: 'Учёба',
      icon: BookOpen,
      color: 'from-blue-600 to-blue-800',
      description: 'Начисление баллов за академические успехи'
    },
    {
      key: 'discipline' as const,
      name: 'Дисциплина',
      icon: Target,
      color: 'from-red-600 to-red-800',
      description: 'Начисление баллов за дисциплину и поведение'
    },
    {
      key: 'events' as const,
      name: 'Мероприятия',
      icon: Users,
      color: 'from-green-600 to-green-800',
      description: 'Начисление баллов за участие в мероприятиях'
    }
  ];

  useEffect(() => {
    const fetchCadets = async () => {
      try {
        setLoading(true);
        const cadetsData = await getCadets();
        setCadets(cadetsData);
        setFilteredCadets(cadetsData);
      } catch (error) {
        console.error('Error fetching cadets:', error);
        showError('Ошибка загрузки кадетов');
      } finally {
        setLoading(false);
      }
    };

    fetchCadets();
  }, []);

  useEffect(() => {
    let filtered = cadets;

    // Фильтр по поиску
    if (searchTerm) {
      filtered = filtered.filter(cadet =>
        cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cadet.platoon.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по взводу
    if (selectedPlatoon !== 'all') {
      filtered = filtered.filter(cadet => cadet.platoon === selectedPlatoon);
    }

    setFilteredCadets(filtered);
  }, [cadets, searchTerm, selectedPlatoon]);

  const updateForm = (category: string, field: keyof ScoreForm, value: any) => {
    setForms(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSubmitScore = async (category: 'study' | 'discipline' | 'events') => {
    const form = forms[category];
    
    if (!form.cadetId || !form.description.trim()) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      
      // Используем Edge Function для обновления баллов с правами администратора
      await updateCadetScoresAdmin(form.cadetId, category, form.points, form.description.trim());
      
      // Обновляем список кадетов
      await fetchCadets();
      
      // Очищаем форму
      setForms(prev => ({
        ...prev,
        [category]: { cadetId: '', points: 0, description: '' }
      }));
      
      success(`Баллы по категории "${tabs.find(t => t.key === category)?.name}" успешно начислены`);
    } catch (error) {
      console.error('Error adding score:', error);
      showError('Ошибка начисления баллов');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchCadets = async () => {
    try {
      const cadetsData = await getCadets();
      setCadets(cadetsData);
      setFilteredCadets(cadetsData);
    } catch (error) {
      console.error('Error fetching cadets:', error);
      showError('Ошибка загрузки кадетов');
    }
  };
  const getSelectedCadet = (category: string) => {
    const form = forms[category];
    return cadets.find(c => c.id === form.cadetId);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-300">Загрузка кадетов...</p>
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
      <motion.div variants={staggerItem} className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Управление баллами</h2>
        <p className="text-blue-200 text-lg">Начисляйте баллы кадетам по разным категориям</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={staggerItem}
        className="flex flex-wrap justify-center gap-4 mb-8"
      >
        {tabs.map(({ key, name, icon: Icon, color }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(key)}
            className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
              activeTab === key
                ? `bg-gradient-to-r ${color} text-white shadow-lg`
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-lg">{name}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Active Tab Content */}
      <div className="space-y-8">
        {/* Tab Header */}
        <div className={`card-gradient ${tabs.find(t => t.key === activeTab)?.color} p-8 text-center`}>
          <div className="flex items-center justify-center space-x-4 mb-4">
            {React.createElement(tabs.find(t => t.key === activeTab)?.icon || BookOpen, {
              className: "h-12 w-12 text-white"
            })}
            <h3 className="text-3xl font-bold text-white">
              {tabs.find(t => t.key === activeTab)?.name}
            </h3>
          </div>
          <p className="text-white/90 text-lg">
            {tabs.find(t => t.key === activeTab)?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search and Filters */}
          <motion.div
            variants={staggerItem}
            className="card-hover p-8"
          >
            <h4 className="text-2xl font-bold text-white mb-6">Поиск кадета</h4>
            
            <div className="space-y-6">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Поиск по имени или взводу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12 text-lg"
                />
              </div>

              {/* Platoon Filter */}
              <div>
                <label className="block text-white font-bold mb-3">Фильтр по взводу</label>
                <select
                  value={selectedPlatoon}
                  onChange={(e) => setSelectedPlatoon(e.target.value)}
                  className="input text-lg"
                >
                  <option value="all">Все взводы</option>
                  {platoons.map(platoon => (
                    <option key={platoon} value={platoon}>{platoon} взвод</option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="text-blue-300 font-semibold text-lg">
                Найдено кадетов: {filteredCadets.length}
              </div>

              {/* Cadets List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredCadets.map((cadet) => (
                  <motion.div
                    key={cadet.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => updateForm(activeTab, 'cadetId', cadet.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      forms[activeTab].cadetId === cadet.id
                        ? `bg-gradient-to-r ${tabs.find(t => t.key === activeTab)?.color} text-white shadow-lg`
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                        alt={cadet.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                      />
                      <div className="flex-grow">
                        <h5 className="font-bold text-lg">{cadet.name}</h5>
                        <p className="opacity-80">{cadet.platoon} взвод, {cadet.squad} отделение</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{cadet.total_score}</div>
                        <div className="text-sm opacity-80">баллов</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {filteredCadets.length === 0 && (
                  <div className="text-center py-8 text-blue-300">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Кадеты не найдены</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Score Form */}
          <motion.div
            variants={staggerItem}
            className="card-hover p-8"
          >
            <h4 className="text-2xl font-bold text-white mb-6">
              Начисление баллов - {tabs.find(t => t.key === activeTab)?.name}
            </h4>

            <div className="space-y-6">
              {/* Selected Cadet Preview */}
              {forms[activeTab].cadetId && (
                <div className={`p-6 rounded-xl bg-gradient-to-r ${tabs.find(t => t.key === activeTab)?.color}`}>
                  <h5 className="text-white font-bold text-lg mb-2">Выбранный кадет:</h5>
                  <div className="flex items-center space-x-4">
                    <img
                      src={getSelectedCadet(activeTab)?.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                      alt={getSelectedCadet(activeTab)?.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/50"
                    />
                    <div>
                      <div className="text-white font-bold text-xl">{getSelectedCadet(activeTab)?.name}</div>
                      <div className="text-white/80">{getSelectedCadet(activeTab)?.platoon} взвод, {getSelectedCadet(activeTab)?.squad} отделение</div>
                      <div className="text-white/80">Текущий балл: {getSelectedCadet(activeTab)?.total_score}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Points Input */}
              <div>
                <label className="block text-white font-bold mb-3 text-lg">
                  Количество баллов <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400 h-5 w-5" />
                  <input
                    type="number"
                    value={forms[activeTab].points}
                    onChange={(e) => updateForm(activeTab, 'points', parseInt(e.target.value) || 0)}
                    className="input pl-12 text-lg"
                    placeholder="Введите количество баллов"
                    min="-100"
                    max="100"
                  />
                </div>
                <div className="text-blue-300 text-sm mt-2">
                  Можно указать отрицательное значение для снятия баллов
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-bold mb-3 text-lg">
                  Описание <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={forms[activeTab].description}
                  onChange={(e) => updateForm(activeTab, 'description', e.target.value)}
                  className="input resize-none text-lg"
                  rows={4}
                  placeholder={`За что начисляются баллы по категории "${tabs.find(t => t.key === activeTab)?.name}"...`}
                />
                <div className="text-right text-blue-300 text-sm mt-2">
                  {forms[activeTab].description.length}/500
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-white font-bold mb-3 text-lg">Быстрые действия</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { points: 5, desc: 'Отличная работа' },
                    { points: 10, desc: 'Выдающиеся результаты' },
                    { points: -2, desc: 'Нарушение дисциплины' },
                    { points: -5, desc: 'Серьезное нарушение' }
                  ].map(({ points, desc }) => (
                    <button
                      key={`${points}-${desc}`}
                      onClick={() => {
                        updateForm(activeTab, 'points', points);
                        updateForm(activeTab, 'description', desc);
                      }}
                      className={`p-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        points > 0 
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                          : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      }`}
                    >
                      <div className="font-bold">{points > 0 ? '+' : ''}{points} баллов</div>
                      <div className="text-xs opacity-80">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleSubmitScore(activeTab)}
                disabled={submitting || !forms[activeTab].cadetId || !forms[activeTab].description.trim()}
                className={`w-full bg-gradient-to-r ${tabs.find(t => t.key === activeTab)?.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg`}
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-6 w-6" />
                    <span>Начислить баллы</span>
                  </>
                )}
              </button>

              {/* Preview */}
              {forms[activeTab].cadetId && forms[activeTab].description && (
                <div className="border-t border-white/20 pt-6">
                  <h5 className="text-white font-bold mb-4 text-lg">Предварительный просмотр:</h5>
                  <div className="glass-effect p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-white font-bold text-xl">{getSelectedCadet(activeTab)?.name}</div>
                        <div className="text-blue-300">{getSelectedCadet(activeTab)?.platoon} взвод</div>
                      </div>
                      <div className={`text-3xl font-black ${forms[activeTab].points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {forms[activeTab].points >= 0 ? '+' : ''}{forms[activeTab].points}
                      </div>
                    </div>
                    <div className="text-blue-100">
                      <strong>Категория:</strong> {tabs.find(t => t.key === activeTab)?.name}
                    </div>
                    <div className="text-blue-100 mt-2">
                      <strong>Описание:</strong> {forms[activeTab].description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Statistics */}
        <motion.div
          variants={staggerItem}
          className="card-hover p-8"
        >
          <h4 className="text-2xl font-bold text-white mb-6">Статистика по категории</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-2">
                {filteredCadets.length}
              </div>
              <div className="text-blue-300 font-semibold">Кадетов найдено</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-black text-green-400 mb-2">
                {Math.round(filteredCadets.reduce((sum, cadet) => sum + cadet.total_score, 0) / filteredCadets.length) || 0}
              </div>
              <div className="text-blue-300 font-semibold">Средний балл</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-400 mb-2">
                {Math.max(...filteredCadets.map(c => c.total_score), 0)}
              </div>
              <div className="text-blue-300 font-semibold">Максимум</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-black text-blue-400 mb-2">
                {Math.min(...filteredCadets.map(c => c.total_score), 0)}
              </div>
              <div className="text-blue-300 font-semibold">Минимум</div>
            </div>
          </div>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          variants={staggerItem}
          className="card-hover p-8"
        >
          <h4 className="text-2xl font-bold text-white mb-6">Топ кадетов в категории</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCadets
              .sort((a, b) => b.total_score - a.total_score)
              .slice(0, 3)
              .map((cadet, index) => (
                <motion.div
                  key={cadet.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`p-6 rounded-xl bg-gradient-to-r ${
                    index === 0 ? 'from-yellow-500 to-yellow-700' :
                    index === 1 ? 'from-gray-400 to-gray-600' :
                    'from-orange-500 to-orange-700'
                  } text-center shadow-lg`}
                >
                  <div className="text-4xl mb-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <img
                    src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                    alt={cadet.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-white/50"
                  />
                  <h5 className="text-white font-bold text-lg mb-1">{cadet.name}</h5>
                  <p className="text-white/80 text-sm mb-2">{cadet.platoon} взвод</p>
                  <div className="text-white font-black text-2xl">{cadet.total_score}</div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ScoreManagement;