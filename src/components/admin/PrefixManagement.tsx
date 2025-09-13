import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Plus, 
  Edit, 
  Trash2, 
  Award, 
  Users, 
  Target,
  Shield,
  Star,
  Search
} from 'lucide-react';
import { 
  getCadetPrefixes,
  getCadetAssignedPrefixes,
  assignPrefixToCadet,
  removePrefixFromCadet,
  createCadetPrefix,
  updateCadetPrefix,
  deleteCadetPrefix,
  type CadetPrefix,
  type CadetAssignedPrefix
} from '../../lib/prefixes';
import { getCadets, type Cadet } from '../../lib/supabase';
import { staggerContainer, staggerItem } from '../../utils/animations';
import PrefixModal from './modals/PrefixModal';
import AssignPrefixModal from './modals/AssignPrefixModal';

const PrefixManagement: React.FC = () => {
  const [prefixes, setPrefixes] = useState<CadetPrefix[]>([]);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [prefixModal, setPrefixModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    prefix: null as CadetPrefix | null 
  });
  const [assignModal, setAssignModal] = useState({ 
    isOpen: false, 
    cadet: null as Cadet | null 
  });

  // Form state
  const [prefixForm, setPrefixForm] = useState({
    name: '',
    display_name: '',
    description: '',
    color: 'from-blue-500 to-blue-700',
    sort_order: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prefixesData, cadetsData] = await Promise.all([
          getCadetPrefixes(),
          getCadets()
        ]);
        
        setPrefixes(prefixesData);
        setCadets(cadetsData);
      } catch (error) {
        console.error('Error loading prefix data:', error);
        alert('Ошибка загрузки данных префиксов');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreatePrefix = () => {
    setPrefixForm({
      name: '',
      display_name: '',
      description: '',
      color: 'from-blue-500 to-blue-700',
      sort_order: prefixes.length + 1
    });
    setPrefixModal({ isOpen: true, isEditing: false, prefix: null });
  };

  const handleEditPrefix = (prefix: CadetPrefix) => {
    setPrefixForm({
      name: prefix.name,
      display_name: prefix.display_name,
      description: prefix.description || '',
      color: prefix.color,
      sort_order: prefix.sort_order
    });
    setPrefixModal({ isOpen: true, isEditing: true, prefix });
  };

  const handleSubmitPrefix = async () => {
    try {
      if (prefixModal.isEditing && prefixModal.prefix) {
        await updateCadetPrefix(prefixModal.prefix.id, prefixForm);
        setPrefixes(prefixes.map(p => 
          p.id === prefixModal.prefix!.id ? { ...p, ...prefixForm } : p
        ));
        alert('Префикс обновлен');
      } else {
        const newPrefix = await createCadetPrefix(prefixForm);
        setPrefixes([...prefixes, newPrefix]);
        alert('Префикс создан');
      }
      setPrefixModal({ isOpen: false, isEditing: false, prefix: null });
    } catch (error) {
      console.error('Error with prefix:', error);
      alert('Ошибка при работе с префиксом');
    }
  };

  const handleDeletePrefix = async (prefixId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот префикс?')) return;
    
    try {
      await deleteCadetPrefix(prefixId);
      setPrefixes(prefixes.filter(p => p.id !== prefixId));
      alert('Префикс удален');
    } catch (error) {
      console.error('Error deleting prefix:', error);
      alert('Ошибка удаления префикса');
    }
  };

  const handleAssignPrefix = (cadet: Cadet) => {
    setAssignModal({ isOpen: true, cadet });
  };

  const handleSubmitAssignment = async (cadetId: string, prefixId: string) => {
    try {
      await assignPrefixToCadet(cadetId, prefixId);
      
      // Обновляем данные кадетов
      const updatedCadets = await getCadets();
      setCadets(updatedCadets);
      
      setAssignModal({ isOpen: false, cadet: null });
      alert('Префикс успешно назначен');
    } catch (error) {
      console.error('Error assigning prefix:', error);
      alert('Ошибка назначения префикса');
    }
  };

  const handleRemovePrefix = async (cadetId: string, prefixId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот префикс у кадета?')) return;
    
    try {
      await removePrefixFromCadet(cadetId, prefixId);
      
      // Обновляем данные кадетов
      const updatedCadets = await getCadets();
      setCadets(updatedCadets);
      
      alert('Префикс удален у кадета');
    } catch (error) {
      console.error('Error removing prefix:', error);
      alert('Ошибка удаления префикса');
    }
  };

  const filteredCadets = cadets.filter(cadet =>
    cadet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.platoon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-300">Загрузка данных префиксов...</p>
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
          <h2 className="text-3xl font-bold text-white mb-2">Управление префиксами</h2>
          <p className="text-blue-200">Назначайте почетные звания и префиксы кадетам</p>
        </div>
        <button
          onClick={handleCreatePrefix}
          className="btn-primary flex items-center space-x-2"
                    <div className="mb-3">
                      {/* Префиксы */}
                      {loadingPrefixes ? (
                        <div className="text-blue-400 text-sm mb-2">Загрузка префиксов...</div>
                      ) : assignedPrefixes.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {assignedPrefixes.map((assignment) => {
                            const prefix = assignment.prefix;
                            if (!prefix) return null;
                            
                            return (
                              <div
                                key={assignment.id}
                                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${prefix.color} text-white text-sm font-bold shadow-lg border border-white/20 group relative overflow-hidden`}
                              >
                                <Crown className="h-3 w-3" />
                                <span>{prefix.display_name}</span>
                                <button
                                  onClick={() => onRemovePrefix(cadet.id, prefix.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-full p-1 transition-all ml-1"
                                  title="Удалить префикс"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                {/* Блеск эффект */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      
                      {/* Имя кадета */}
                      <h4 className="text-xl font-bold text-white">
                        {cadet.name}
                      </h4>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Prefixes List */}
        <motion.div variants={staggerItem} className="xl:col-span-1">
          <div className="card-hover p-6">
            <div className="flex items-center space-x-3 mb-6">
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cadets List */}
        <motion.div variants={staggerItem} className="xl:col-span-2">
          <div className="card-hover p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Кадеты</h3>
                <span className="text-blue-300 font-semibold">({filteredCadets.length})</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск кадетов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {filteredCadets.map((cadet) => (
                <CadetPrefixCard
                  key={cadet.id}
                  cadet={cadet}
                  prefixes={prefixes}
                  onAssignPrefix={handleAssignPrefix}
                  onRemovePrefix={handleRemovePrefix}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <PrefixModal
        isOpen={prefixModal.isOpen}
        onClose={() => setPrefixModal({ isOpen: false, isEditing: false, prefix: null })}
        onSubmit={handleSubmitPrefix}
        form={prefixForm}
        setForm={setPrefixForm}
        isEditing={prefixModal.isEditing}
      />

      <AssignPrefixModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, cadet: null })}
        onSubmit={handleSubmitAssignment}
        cadet={assignModal.cadet}
        prefixes={prefixes}
      />
    </motion.div>
  );
};

// Компонент карточки кадета с префиксами
interface CadetPrefixCardProps {
  cadet: Cadet;
  prefixes: CadetPrefix[];
  onAssignPrefix: (cadet: Cadet) => void;
  onRemovePrefix: (cadetId: string, prefixId: string) => void;
}

const CadetPrefixCard: React.FC<CadetPrefixCardProps> = ({
  cadet,
  prefixes,
  onAssignPrefix,
  onRemovePrefix
}) => {
  const [assignedPrefixes, setAssignedPrefixes] = useState<CadetAssignedPrefix[]>([]);
  const [loadingPrefixes, setLoadingPrefixes] = useState(true);

  useEffect(() => {
    const fetchAssignedPrefixes = async () => {
      try {
        setLoadingPrefixes(true);
        const data = await getCadetAssignedPrefixes(cadet.id);
        setAssignedPrefixes(data);
      } catch (error) {
        console.error('Error fetching assigned prefixes:', error);
      } finally {
        setLoadingPrefixes(false);
      }
    };

    fetchAssignedPrefixes();
  }, [cadet.id]);

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 5 }}
      className="glass-effect p-6 rounded-xl border border-white/10 hover:border-blue-400/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4 flex-grow">
          <img
            src={cadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
            alt={cadet.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
          />
          <div className="flex-grow">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-xl font-bold text-white">
                {cadet.display_name || cadet.name}
              </h4>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-blue-900 rounded-full px-3 py-1 text-sm font-bold">
                #{cadet.rank}
              </div>
            </div>
            <p className="text-blue-300 font-semibold mb-3">
              {cadet.platoon} взвод, {cadet.squad} отделение
            </p>
            
            {/* Assigned Prefixes */}
            <div className="flex flex-wrap gap-2 mb-3">
              {loadingPrefixes ? (
                <div className="text-blue-400 text-sm">Загрузка префиксов...</div>
              ) : assignedPrefixes.length > 0 ? (
                assignedPrefixes.map((assignment) => {
                  const prefix = assignment.prefix;
                  if (!prefix) return null;
                  
                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${prefix.color} text-white text-sm font-bold group`}
                    >
                      <span>{prefix.display_name}</span>
                      <button
                        onClick={() => onRemovePrefix(cadet.id, prefix.id)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-full p-1 transition-all"
                        title="Удалить префикс"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="text-blue-400 text-sm italic">Нет префиксов</span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onAssignPrefix(cadet)}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
        >
          <Award className="w-4 h-4" />
          <span>Назначить</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PrefixManagement;