import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Save, X, Crown } from 'lucide-react';
import { getCadetAssignedPrefixes, type CadetPrefix, type CadetAssignedPrefix } from '../../../lib/prefixes';
import { Cadet } from '../../../lib/supabase';

interface AssignPrefixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cadetId: string, prefixId: string) => void;
  cadet: Cadet | null;
  prefixes: CadetPrefix[];
}

const AssignPrefixModal: React.FC<AssignPrefixModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cadet,
  prefixes
}) => {
  const [selectedPrefixId, setSelectedPrefixId] = useState('');
  const [assignedPrefixes, setAssignedPrefixes] = useState<CadetAssignedPrefix[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && cadet) {
      const fetchAssignedPrefixes = async () => {
        try {
          setLoading(true);
          const data = await getCadetAssignedPrefixes(cadet.id);
          setAssignedPrefixes(data);
        } catch (error) {
          console.error('Error fetching assigned prefixes:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAssignedPrefixes();
      setSelectedPrefixId('');
    }
  }, [isOpen, cadet]);

  const assignedPrefixIds = assignedPrefixes.map(ap => ap.prefix_id);
  const availablePrefixes = prefixes.filter(p => !assignedPrefixIds.includes(p.id));

  const handleSubmit = () => {
    if (cadet && selectedPrefixId) {
      onSubmit(cadet.id, selectedPrefixId);
      setSelectedPrefixId('');
    }
  };

  if (!isOpen || !cadet) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-effect rounded-3xl max-w-3xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Award className="h-8 w-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">Назначить префикс</h2>
        </div>
        
        {/* Cadet Info */}
        <div className="glass-effect p-6 rounded-xl border border-blue-400/30 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
              alt={cadet.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
            />
            <div>
              <h3 className="text-2xl font-bold text-white">{cadet.display_name || cadet.name}</h3>
              <p className="text-blue-300">{cadet.platoon} взвод, {cadet.squad} отделение</p>
              <p className="text-yellow-400 font-bold">Рейтинг: #{cadet.rank}</p>
            </div>
          </div>
        </div>

        {/* Current Prefixes */}
        {assignedPrefixes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Текущие префиксы:</h3>
            <div className="flex flex-wrap gap-3">
              {assignedPrefixes.map((assignment) => {
                const prefix = assignment.prefix;
                if (!prefix) return null;
                
                return (
                  <div
                    key={assignment.id}
                    className={`px-4 py-2 rounded-full bg-gradient-to-r ${prefix.color} text-white font-bold`}
                  >
                    {prefix.display_name}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Prefixes */}
        <div className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-4">
              Выберите префикс для назначения:
            </label>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-blue-300">Загрузка...</p>
              </div>
            ) : availablePrefixes.length === 0 ? (
              <div className="text-center py-8">
                <Crown className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                <p className="text-blue-300">Все доступные префиксы уже назначены этому кадету</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePrefixes.map((prefix) => (
                  <motion.label
                    key={prefix.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`flex items-start space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                      selectedPrefixId === prefix.id
                        ? `bg-gradient-to-r ${prefix.color} border-transparent text-white shadow-lg`
                        : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="prefix"
                      value={prefix.id}
                      checked={selectedPrefixId === prefix.id}
                      onChange={(e) => setSelectedPrefixId(e.target.value)}
                      className="sr-only"
                    />
                    <Crown className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold text-lg">{prefix.display_name}</div>
                      <div className="text-sm opacity-80">{prefix.description}</div>
                    </div>
                  </motion.label>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedPrefixId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/20 pt-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className="glass-effect p-6 rounded-xl">
                <div className="space-y-4">
                  {/* Текущие префиксы + новый */}
                  <div className="flex flex-wrap gap-2">
                    {assignedPrefixes.map(ap => {
                      const prefix = ap.prefix;
                      if (!prefix) return null;
                      return (
                        <div
                          key={ap.id}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${prefix.color} text-white text-sm font-bold shadow-lg border border-white/20`}
                        >
                          <Crown className="h-3 w-3" />
                          <span>{prefix.display_name}</span>
                        </div>
                      );
                    })}
                    {/* Новый префикс */}
                    {selectedPrefixId && (
                      <div
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${availablePrefixes.find(p => p.id === selectedPrefixId)?.color} text-white text-sm font-bold shadow-lg border border-white/20 animate-pulse`}
                      >
                        <Crown className="h-3 w-3" />
                        <span>{availablePrefixes.find(p => p.id === selectedPrefixId)?.display_name}</span>
                        <span className="text-xs bg-white/20 px-1 rounded">НОВЫЙ</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Имя кадета */}
                  <div className="text-2xl font-bold text-white">
                    {cadet.name}
                  </div>
                </div>
                <p className="text-blue-300 mt-2">{cadet.platoon} взвод, {cadet.squad} отделение</p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!selectedPrefixId}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>Назначить префикс</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors flex items-center space-x-2"
          >
            <X className="h-5 w-5" />
            <span>Отмена</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssignPrefixModal;