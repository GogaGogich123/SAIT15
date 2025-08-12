import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, Trophy, Medal, Target, Users, TrendingUp, TrendingDown } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import ModernBackground from '../components/ModernBackground';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCadets, getCadetScores, type Cadet, type Score } from '../lib/supabase';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

interface CadetWithScores extends Cadet {
  scores: {
    study: number;
    discipline: number;
    events: number;
    total: number;
  };
}

const RatingPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'total' | 'study' | 'discipline' | 'events'>('total');
  const [selectedPlatoon, setSelectedPlatoon] = useState<string>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cadets, setCadets] = useState<CadetWithScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const platoons = ['7-1', '7-2', '8-1', '8-2', '9-1', '9-2', '10-1', '10-2', '11-1', '11-2'];
  const squads = [1, 2, 3];

  useEffect(() => {
    const fetchCadets = async () => {
      try {
        setLoading(true);
        const cadetsData = await getCadets();
        
        // Получаем баллы для каждого кадета
        const cadetsWithScores = await Promise.all(
          cadetsData.map(async (cadet) => {
            try {
              const scores = await getCadetScores(cadet.id);
              return {
                ...cadet,
                scores: {
                  study: scores?.study_score || 0,
                  discipline: scores?.discipline_score || 0,
                  events: scores?.events_score || 0,
                  total: cadet.total_score
                }
              };
            } catch (error) {
              console.error(`Error fetching scores for cadet ${cadet.id}:`, error);
              return {
                ...cadet,
                scores: {
                  study: 0,
                  discipline: 0,
                  events: 0,
                  total: cadet.total_score
                }
              };
            }
          })
        );
        
        setCadets(cadetsWithScores);
      } catch (err) {
        console.error('Error fetching cadets:', err);
        setError('Ошибка загрузки данных кадетов');
      } finally {
        setLoading(false);
      }
    };

    fetchCadets();
  }, []);

  const categories = [
    { key: 'total', name: 'Общий рейтинг', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { key: 'study', name: 'Учёба', icon: Medal, color: 'from-blue-500 to-cyan-500' },
    { key: 'discipline', name: 'Дисциплина', icon: Target, color: 'from-red-500 to-pink-500' },
    { key: 'events', name: 'Мероприятия', icon: Users, color: 'from-green-500 to-emerald-500' },
  ];

  const filteredCadets = cadets.filter(cadet => {
    const matchesSearch = cadet.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatoon = selectedPlatoon === 'all' || cadet.platoon === selectedPlatoon;
    const matchesSquad = selectedSquad === 'all' || cadet.squad.toString() === selectedSquad;
    return matchesSearch && matchesPlatoon && matchesSquad;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-500 to-blue-700';
  };

  const getScoreChange = (cadet: CadetWithScores) => {
    // Mock data for score changes
    const changes = [5, -2, 8, 3, -1, 12, 0, 4, -3, 7];
    return changes[parseInt(cadet.id.slice(-1)) % changes.length] || 0;
  };

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
            Рейтинг кадетов
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
            Следите за успехами и достижениями лучших кадетов корпуса
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div>
            <LoadingSpinner message="Загрузка данных кадетов..." />
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
              onClick={() => setSelectedCategory(key as any)}
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

        {/* Filters */}
        {!loading && !error && (
          <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-effect rounded-2xl p-8 mb-12 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-4 w-4" />
              <input
                type="text"
                placeholder="Поиск кадета..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Platoon Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-4 w-4" />
              <select
                value={selectedPlatoon}
                onChange={(e) => setSelectedPlatoon(e.target.value)}
                className="input pl-10"
              >
                <option value="all">Все взводы</option>
                {platoons.map(platoon => (
                  <option key={platoon} value={platoon}>{platoon} взвод</option>
                ))}
              </select>
            </div>

            {/* Squad Filter */}
            <div>
              <select
                value={selectedSquad}
                onChange={(e) => setSelectedSquad(e.target.value)}
                className="input"
              >
                <option value="all">Все отделения</option>
                {squads.map(squad => (
                  <option key={squad} value={squad.toString()}>{squad} отделение</option>
                ))}
              </select>
            </div>

            <div className="text-white font-bold text-lg flex items-center justify-center">
              Найдено: {filteredCadets.length}
            </div>
          </div>
        </motion.div>
        )}

        {/* Rating List */}
        {!loading && !error && (
          <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {filteredCadets.map((cadet, index) => (
            <motion.div
              key={cadet.id}
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group hover-lift"
            >
              <Link to={`/cadet/${cadet.id}`}>
                <div className="card-hover p-8 shadow-2xl border border-white/20 hover:border-yellow-400/50 transition-all duration-500">
                  <div className="flex items-center space-x-6">
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br ${getRankColor(cadet.rank)} flex items-center justify-center font-bold text-white text-xl shadow-2xl hover-glow`}>
                      {getRankIcon(cadet.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                        alt={cadet.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white/30 group-hover:border-yellow-400/70 transition-all duration-500 shadow-lg"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-grow">
                      <h3 className="text-2xl font-bold text-white group-hover:text-yellow-300 transition-colors text-shadow">
                        {cadet.name}
                      </h3>
                      <p className="text-blue-300 text-lg">
                        {cadet.platoon} взвод, {cadet.squad} отделение
                      </p>
                    </div>

                    {/* Scores */}
                    <div className="flex-shrink-0 grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-3xl font-black text-white text-glow">{cadet.scores.total}</span>
                          {(() => {
                            const change = getScoreChange(cadet);
                            if (change > 0) {
                              return <TrendingUp className="h-5 w-5 text-green-400" />;
                            } else if (change < 0) {
                              return <TrendingDown className="h-5 w-5 text-red-400" />;
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-sm text-blue-300 font-semibold">Общий</div>
                        {(() => {
                          const change = getScoreChange(cadet);
                          if (change !== 0) {
                            return (
                              <div className={`text-sm font-bold ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {change > 0 ? '+' : ''}{change}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-300">{cadet.scores.study}</div>
                        <div className="text-sm text-blue-400 font-semibold">Учёба</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-300">{cadet.scores.discipline}</div>
                        <div className="text-sm text-red-400 font-semibold">Дисциплина</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-300">{cadet.scores.events}</div>
                        <div className="text-sm text-green-400 font-semibold">Мероприятия</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default RatingPage;