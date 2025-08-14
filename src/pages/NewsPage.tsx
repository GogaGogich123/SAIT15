import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ChevronLeft, ChevronRight, Star, Share2, Heart, MessageCircle } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import ModernBackground from '../components/ModernBackground';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { getNews, type News } from '../lib/supabase';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const NewsPage: React.FC = () => {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const newsData = await getNews();
        setNews(newsData);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Ошибка загрузки новостей');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const mainNews = news.find(item => item.is_main);
  const regularNews = news.filter(item => !item.is_main);

  const openNewsModal = (newsItem: News) => {
    setSelectedNews(newsItem);
    setCurrentImageIndex(0);
  };

  const closeNewsModal = () => {
    setSelectedNews(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedNews && currentImageIndex < selectedNews.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
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
            Новости корпуса
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
            Актуальные события и достижения кадетов
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div>
            <LoadingSpinner message="Загрузка новостей..." />
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

        {/* Main News */}
        {!loading && !error && mainNews && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            <div 
              className="relative overflow-hidden rounded-3xl shadow-2xl cursor-pointer group hover-lift"
              onClick={() => openNewsModal(mainNews)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10"></div>
              {mainNews.background_image_url && (
                <img
                  src={mainNews.background_image_url}
                  alt={mainNews.title}
                  className="w-full h-[500px] object-cover group-hover:scale-110 transition-transform duration-700"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-12 z-20">
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="h-6 w-6 text-yellow-400" />
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    ГЛАВНАЯ НОВОСТЬ
                  </span>
                </div>
                <h2 className="text-5xl font-display font-black text-white mb-6 group-hover:text-yellow-400 transition-colors text-shadow">
                  {mainNews.title}
                </h2>
                <p className="text-blue-100 mb-6 line-clamp-3 text-lg text-shadow">{mainNews.content}</p>
                <div className="flex items-center space-x-6 text-blue-200">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span className="text-base font-semibold">{mainNews.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-base font-semibold">{new Date(mainNews.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular News */}
        {!loading && !error && (
          <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {regularNews.map((news, index) => (
            <motion.div
              key={news.id}
              variants={staggerItem}
              whileHover={{ scale: 1.05, y: -10 }}
              className="card-hover overflow-hidden shadow-2xl cursor-pointer group"
              onClick={() => openNewsModal(news)}
            >
              {news.images[0] && (
                <div className="relative overflow-hidden">
                  <img
                    src={news.images[0]}
                    alt={news.title}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors line-clamp-2 text-shadow">
                  {news.title}
                </h3>
                <p className="text-blue-200 mb-6 line-clamp-3 text-base">{news.content}</p>
                <div className="flex items-center justify-between text-blue-300 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">{news.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-semibold">{new Date(news.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 pt-6 border-t border-white/20">
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center space-x-2 text-blue-300 hover:text-yellow-400 transition-colors font-semibold"
                  >
                    <Heart className="h-5 w-5" />
                    <span>12</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center space-x-2 text-blue-300 hover:text-yellow-400 transition-colors font-semibold"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>5</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-blue-300 hover:text-yellow-400 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        )}

        {/* News Modal */}
        {selectedNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeNewsModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-effect rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {selectedNews.is_main && (
                      <div className="flex items-center space-x-2">
                        <Star className="h-6 w-6 text-yellow-400" />
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          ГЛАВНАЯ НОВОСТЬ
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeNewsModal}
                    className="text-white hover:text-yellow-400 text-3xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>

                <h2 className="text-5xl font-display font-black text-white mb-8 text-shadow">{selectedNews.title}</h2>

                <div className="flex items-center space-x-8 text-blue-200 mb-12">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span className="text-lg font-semibold">{selectedNews.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-lg font-semibold">{new Date(selectedNews.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none mb-12">
                  <p className="text-blue-100 text-xl leading-relaxed text-shadow">{selectedNews.content}</p>
                </div>

                {/* Image Carousel */}
                {selectedNews.images && selectedNews.images.length > 0 && (
                  <div className="relative">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                      <img
                        src={selectedNews.images[currentImageIndex]}
                        alt={`${selectedNews.title} ${currentImageIndex + 1}`}
                        className="w-full h-[500px] object-cover"
                      />
                      {selectedNews.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            disabled={currentImageIndex === 0}
                            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                          >
                            <ChevronLeft className="h-8 w-8" />
                          </button>
                          <button
                            onClick={nextImage}
                            disabled={currentImageIndex === selectedNews.images.length - 1}
                            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                          >
                            <ChevronRight className="h-8 w-8" />
                          </button>
                        </>
                      )}
                    </div>
                    {selectedNews.images && selectedNews.images.length > 1 && (
                      <div className="flex justify-center space-x-3 mt-6">
                        {selectedNews.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-4 h-4 rounded-full transition-colors shadow-lg ${
                              index === currentImageIndex ? 'bg-yellow-400' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default NewsPage;