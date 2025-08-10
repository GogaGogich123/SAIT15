import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { 
  getEvents, 
  registerForEvent, 
  cancelEventRegistration,
  isRegisteredForEvent,
  type Event
} from '../lib/events';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [registrations, setRegistrations] = useState<{ [eventId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await getEvents();
        setEvents(eventsData);
        
        // Проверяем регистрации пользователя
        if (user?.cadetId) {
          const registrationChecks = await Promise.all(
            eventsData.map(async (event) => {
              const isRegistered = await isRegisteredForEvent(event.id, user.cadetId!);
              return { eventId: event.id, isRegistered };
            })
          );
          
          const registrationMap: { [eventId: string]: boolean } = {};
          registrationChecks.forEach(({ eventId, isRegistered }) => {
            registrationMap[eventId] = isRegistered;
          });
          setRegistrations(registrationMap);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Ошибка загрузки событий');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user?.cadetId]);

  const handleRegister = async (eventId: string) => {
    if (!user?.cadetId) {
      showError('Необходимо войти в систему');
      return;
    }

    // Проверяем, не зарегистрирован ли уже кадет на это мероприятие
    try {
      const alreadyRegistered = await isRegisteredForEvent(eventId, user.cadetId);
      if (alreadyRegistered) {
        showError('Вы уже зарегистрированы на это событие');
        return;
      }
    } catch (err) {
      console.error('Error checking registration status:', err);
      showError('Ошибка проверки статуса регистрации');
      return;
    }

    try {
      await registerForEvent(eventId, user.cadetId);
      setRegistrations({ ...registrations, [eventId]: true });
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, participants_count: event.participants_count + 1 }
          : event
      ));
      
      // Обновляем выбранное событие, если оно открыто
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          participants_count: selectedEvent.participants_count + 1
        });
      }
      
      success('Вы успешно зарегистрированы на событие!');
    } catch (err) {
      console.error('Error registering for event:', err);
      showError('Ошибка регистрации на событие');
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!user?.cadetId) return;

    try {
      await cancelEventRegistration(eventId, user.cadetId);
      setRegistrations({ ...registrations, [eventId]: false });
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, participants_count: Math.max(0, event.participants_count - 1) }
          : event
      ));
      
      // Обновляем выбранное событие, если оно открыто
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          participants_count: Math.max(0, selectedEvent.participants_count - 1)
        });
      }
      
      success('Регистрация отменена');
    } catch (err) {
      console.error('Error canceling registration:', err);
      showError('Ошибка отмены регистрации');
    }
  };

  const openEventModal = (event: Event) => {
    setSelectedEvent(event);
    setCurrentImageIndex(0);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedEvent && currentImageIndex < selectedEvent.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  const isEventFull = (event: Event) => {
    return event.max_participants && event.participants_count >= event.max_participants;
  };

  const isRegistrationClosed = (event: Event) => {
    if (!event.registration_deadline) return false;
    return new Date(event.registration_deadline) < new Date();
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
              События
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Участвуйте в мероприятиях и развивайтесь вместе с корпусом
            </p>
          </motion.div>

          {loading && <LoadingSpinner message="Загрузка событий..." />}

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

          {!loading && !error && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {events.map((event) => {
                const isRegistered = registrations[event.id];
                const isFull = isEventFull(event);
                const isRegClosed = isRegistrationClosed(event);
                
                return (
                  <motion.div
                    key={event.id}
                    variants={staggerItem}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className="card-hover overflow-hidden shadow-2xl cursor-pointer group"
                    onClick={() => openEventModal(event)}
                  >
                    {event.background_image_url && (
                      <div className="relative overflow-hidden h-48">
                        <img
                          src={event.background_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            event.category === 'sport' ? 'bg-green-500/80 text-white' :
                            event.category === 'education' ? 'bg-blue-500/80 text-white' :
                            event.category === 'culture' ? 'bg-purple-500/80 text-white' :
                            'bg-gray-500/80 text-white'
                          }`}>
                            {event.category === 'sport' ? 'Спорт' :
                             event.category === 'education' ? 'Образование' :
                             event.category === 'culture' ? 'Культура' : 'Общее'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      
                      <p className="text-blue-200 mb-4 line-clamp-3">{event.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center space-x-2 text-blue-300">
                          <Calendar className="h-4 w-4" />
                          <span className="font-semibold">{formatDate(event.event_date)}</span>
                          {event.event_time && (
                            <>
                              <Clock className="h-4 w-4 ml-2" />
                              <span>{formatTime(event.event_time)}</span>
                            </>
                          )}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center space-x-2 text-blue-300">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-blue-300">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.participants_count}
                            {event.max_participants && ` / ${event.max_participants}`} участников
                          </span>
                        </div>
                      </div>
                      
                      {user && (
                        <div className="flex space-x-2">
                          {isRegistered ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRegistration(event.id);
                              }}
                              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                              <CheckCircle className="h-5 w-5" />
                              <span>Отменить участие</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegister(event.id);
                              }}
                              disabled={isFull || isRegClosed}
                              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                              {isFull ? (
                                <>
                                  <AlertCircle className="h-5 w-5" />
                                  <span>Мест нет</span>
                                </>
                              ) : isRegClosed ? (
                                <>
                                  <AlertCircle className="h-5 w-5" />
                                  <span>Регистрация закрыта</span>
                                </>
                              ) : (
                                <>
                                  <User className="h-5 w-5" />
                                  <span>Принять участие</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Event Modal */}
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeEventModal}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="glass-effect rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-4xl font-display font-black text-white text-shadow">
                      {selectedEvent.title}
                    </h2>
                    <button
                      onClick={closeEventModal}
                      className="text-white hover:text-yellow-400 text-3xl font-bold transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2">
                      <div className="prose prose-invert max-w-none mb-6">
                        <p className="text-blue-100 text-lg leading-relaxed">
                          {selectedEvent.content || selectedEvent.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="glass-effect p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Детали события</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-blue-200">
                            <Calendar className="h-5 w-5" />
                            <span>{formatDate(selectedEvent.event_date)}</span>
                          </div>
                          
                          {selectedEvent.event_time && (
                            <div className="flex items-center space-x-3 text-blue-200">
                              <Clock className="h-5 w-5" />
                              <span>{formatTime(selectedEvent.event_time)}</span>
                            </div>
                          )}
                          
                          {selectedEvent.location && (
                            <div className="flex items-center space-x-3 text-blue-200">
                              <MapPin className="h-5 w-5" />
                              <span>{selectedEvent.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 text-blue-200">
                            <Users className="h-5 w-5" />
                            <span>
                              {selectedEvent.participants_count}
                              {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`} участников
                            </span>
                          </div>
                          
                          {selectedEvent.registration_deadline && (
                            <div className="flex items-center space-x-3 text-yellow-300">
                              <AlertCircle className="h-5 w-5" />
                              <span>Регистрация до {formatDate(selectedEvent.registration_deadline)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  {selectedEvent.images && selectedEvent.images.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <ImageIcon className="h-6 w-6 mr-2" />
                        Фотографии
                      </h3>
                      <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                          <img
                            src={selectedEvent.images[currentImageIndex]}
                            alt={`${selectedEvent.title} ${currentImageIndex + 1}`}
                            className="w-full h-[400px] object-cover"
                          />
                          {selectedEvent.images.length > 1 && (
                            <>
                              <button
                                onClick={prevImage}
                                disabled={currentImageIndex === 0}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </button>
                              <button
                                onClick={nextImage}
                                disabled={currentImageIndex === selectedEvent.images.length - 1}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                <ChevronRight className="h-6 w-6" />
                              </button>
                            </>
                          )}
                        </div>
                        {selectedEvent.images.length > 1 && (
                          <div className="flex justify-center space-x-2 mt-4">
                            {selectedEvent.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-3 h-3 rounded-full transition-colors ${
                                  index === currentImageIndex ? 'bg-yellow-400' : 'bg-white/30'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Registration Button */}
                  {user && (
                    <div className="flex justify-center">
                      {registrations[selectedEvent.id] ? (
                        <button
                          onClick={() => handleCancelRegistration(selectedEvent.id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-2"
                        >
                          <CheckCircle className="h-6 w-6" />
                          <span>Отменить участие</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(selectedEvent.id)}
                          disabled={isEventFull(selectedEvent) || isRegistrationClosed(selectedEvent)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-2"
                        >
                          <User className="h-6 w-6" />
                          <span>
                            {isEventFull(selectedEvent) ? 'Мест нет' :
                             isRegistrationClosed(selectedEvent) ? 'Регистрация закрыта' :
                             'Принять участие'}
                          </span>
                        </button>
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

export default EventsPage;