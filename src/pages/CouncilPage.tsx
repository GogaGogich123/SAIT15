import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Shield, 
  Star, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  BookOpen,
  Calendar,
  Trophy,
  Heart,
  Target,
  Award,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getCouncilStructure,
  getCouncilPositions,
  getCouncilStaffs,
  type CouncilMember,
  type CouncilPosition,
  type CouncilStaff
} from '../lib/council';
import { getCadets, type Cadet } from '../lib/supabase';
import CouncilMemberModal from '../components/council/CouncilMemberModal';
import CouncilPositionModal from '../components/council/CouncilPositionModal';
import CouncilStaffModal from '../components/council/CouncilStaffModal';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const CouncilPage: React.FC = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  
  const [councilStructure, setCouncilStructure] = useState<any>(null);
  const [positions, setPositions] = useState<CouncilPosition[]>([]);
  const [staffs, setStaffs] = useState<CouncilStaff[]>([]);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'manage'>('structure');

  // Modal states
  const [memberModal, setMemberModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    member: null as CouncilMember | null 
  });
  const [positionModal, setPositionModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    position: null as CouncilPosition | null 
  });
  const [staffModal, setStaffModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    staff: null as CouncilStaff | null 
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [structure, positionsData, staffsData, cadetsData] = await Promise.all([
          getCouncilStructure(),
          getCouncilPositions(),
          getCouncilStaffs(),
          getCadets()
        ]);
        
        setCouncilStructure(structure);
        setPositions(positionsData);
        setStaffs(staffsData);
        setCadets(cadetsData);
      } catch (err) {
        console.error('Error loading council data:', err);
        setError('Ошибка загрузки данных совета');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Crown, Shield, Star, Users, BookOpen, Calendar, Trophy, Heart, Target, Award
    };
    return icons[iconName] || Star;
  };

  const refreshData = async () => {
    try {
      const structure = await getCouncilStructure();
      setCouncilStructure(structure);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Загрузка структуры совета..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка загрузки</h2>
          <p className="text-blue-200">{error}</p>
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
              Атаманский совет
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full mb-6"></div>
            <p className="text-2xl text-white/90 max-w-3xl mx-auto text-shadow text-balance">
              Структура управления кадетским корпусом
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex justify-center space-x-4 mb-12"
          >
            <button
              onClick={() => setActiveTab('structure')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                activeTab === 'structure'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Структура совета
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                  activeTab === 'manage'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Управление
              </button>
            )}
          </motion.div>

          {/* Structure Tab */}
          {activeTab === 'structure' && councilStructure && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-12"
            >
              {/* Атаман */}
              {councilStructure.ataman && (
                <motion.div variants={staggerItem} className="text-center">
                  <CouncilMemberCard 
                    member={councilStructure.ataman} 
                    isAdmin={isAdmin}
                    onEdit={() => setMemberModal({ isOpen: true, isEditing: true, member: councilStructure.ataman })}
                    onRemove={() => {/* implement remove */}}
                  />
                </motion.div>
              )}

              {/* Заместитель атамана */}
              {councilStructure.deputyAtaman && (
                <motion.div variants={staggerItem} className="text-center">
                  <CouncilMemberCard 
                    member={councilStructure.deputyAtaman} 
                    isAdmin={isAdmin}
                    onEdit={() => setMemberModal({ isOpen: true, isEditing: true, member: councilStructure.deputyAtaman })}
                    onRemove={() => {/* implement remove */}}
                  />
                </motion.div>
              )}

              {/* Штабы */}
              <motion.div variants={staggerItem}>
                <h2 className="text-4xl font-bold text-white text-center mb-8">Штабы</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {staffs.map((staff) => {
                    const commander = councilStructure.staffCommanders.find((c: CouncilMember) => c.staff_id === staff.id);
                    const members = councilStructure.staffMembers[staff.id] || [];
                    const StaffIcon = getIconComponent(staff.icon);
                    
                    return (
                      <motion.div
                        key={staff.id}
                        variants={staggerItem}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`card-gradient ${staff.color} p-8 rounded-3xl shadow-2xl`}
                      >
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-white/20">
                            <StaffIcon className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">{staff.display_name}</h3>
                          <p className="text-white/80">{staff.description}</p>
                        </div>

                        {/* Командир штаба */}
                        {commander ? (
                          <div className="mb-6">
                            <h4 className="text-lg font-bold text-white mb-3 text-center">Командир штаба</h4>
                            <CouncilMemberCard 
                              member={commander} 
                              isAdmin={isAdmin}
                              compact={true}
                              onEdit={() => setMemberModal({ isOpen: true, isEditing: true, member: commander })}
                              onRemove={() => {/* implement remove */}}
                            />
                          </div>
                        ) : (
                          isAdmin && (
                            <div className="mb-6 text-center">
                              <button
                                onClick={() => setMemberModal({ isOpen: true, isEditing: false, member: null })}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                              >
                                Назначить командира
                              </button>
                            </div>
                          )
                        )}

                        {/* Члены штаба */}
                        {members.length > 0 && (
                          <div>
                            <h4 className="text-lg font-bold text-white mb-3 text-center">Состав штаба</h4>
                            <div className="space-y-3">
                              {members.map((member) => (
                                <CouncilMemberCard 
                                  key={member.id}
                                  member={member} 
                                  isAdmin={isAdmin}
                                  compact={true}
                                  onEdit={() => setMemberModal({ isOpen: true, isEditing: true, member })}
                                  onRemove={() => {/* implement remove */}}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {isAdmin && (
                          <div className="text-center mt-6">
                            <button
                              onClick={() => setMemberModal({ isOpen: true, isEditing: false, member: null })}
                              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Добавить в штаб</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Management Tab */}
          {activeTab === 'manage' && isAdmin && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Quick Actions */}
              <motion.div variants={staggerItem} className="card-hover p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Быстрые действия</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setMemberModal({ isOpen: true, isEditing: false, member: null })}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Назначить кадета</span>
                  </button>
                  <button
                    onClick={() => setPositionModal({ isOpen: true, isEditing: false, position: null })}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
                  >
                    <Star className="h-5 w-5" />
                    <span>Создать должность</span>
                  </button>
                  <button
                    onClick={() => setStaffModal({ isOpen: true, isEditing: false, staff: null })}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
                  >
                    <Users className="h-5 w-5" />
                    <span>Создать штаб</span>
                  </button>
                  <button
                    onClick={refreshData}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Обновить</span>
                  </button>
                </div>
              </motion.div>

              {/* Positions Management */}
              <motion.div variants={staggerItem} className="card-hover p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Должности</h3>
                  <button
                    onClick={() => setPositionModal({ isOpen: true, isEditing: false, position: null })}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Добавить должность</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {positions.map((position) => {
                    const PositionIcon = getIconComponent(position.icon);
                    return (
                      <div
                        key={position.id}
                        className={`card-gradient ${position.color} p-6 rounded-xl`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <PositionIcon className="h-6 w-6 text-white" />
                          <h4 className="text-lg font-bold text-white">{position.display_name}</h4>
                        </div>
                        <p className="text-white/80 text-sm mb-4">{position.description}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setPositionModal({ isOpen: true, isEditing: true, position })}
                            className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <Edit className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Staffs Management */}
              <motion.div variants={staggerItem} className="card-hover p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Штабы</h3>
                  <button
                    onClick={() => setStaffModal({ isOpen: true, isEditing: false, staff: null })}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Добавить штаб</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staffs.map((staff) => {
                    const StaffIcon = getIconComponent(staff.icon);
                    const membersCount = councilStructure?.staffMembers[staff.id]?.length || 0;
                    const hasCommander = councilStructure?.staffCommanders.some((c: CouncilMember) => c.staff_id === staff.id);
                    
                    return (
                      <div
                        key={staff.id}
                        className={`card-gradient ${staff.color} p-6 rounded-xl`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <StaffIcon className="h-6 w-6 text-white" />
                          <h4 className="text-lg font-bold text-white">{staff.display_name}</h4>
                        </div>
                        <p className="text-white/80 text-sm mb-4">{staff.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white/70 text-sm">
                            {hasCommander ? 'Есть командир' : 'Нет командира'}
                          </span>
                          <span className="text-white/70 text-sm">
                            {membersCount} членов
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setStaffModal({ isOpen: true, isEditing: true, staff })}
                            className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <Edit className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modals */}
          <CouncilMemberModal
            isOpen={memberModal.isOpen}
            onClose={() => setMemberModal({ isOpen: false, isEditing: false, member: null })}
            member={memberModal.member}
            isEditing={memberModal.isEditing}
            cadets={cadets}
            positions={positions}
            staffs={staffs}
            onSuccess={refreshData}
          />

          <CouncilPositionModal
            isOpen={positionModal.isOpen}
            onClose={() => setPositionModal({ isOpen: false, isEditing: false, position: null })}
            position={positionModal.position}
            isEditing={positionModal.isEditing}
            onSuccess={async () => {
              const positionsData = await getCouncilPositions();
              setPositions(positionsData);
              await refreshData();
            }}
          />

          <CouncilStaffModal
            isOpen={staffModal.isOpen}
            onClose={() => setStaffModal({ isOpen: false, isEditing: false, staff: null })}
            staff={staffModal.staff}
            isEditing={staffModal.isEditing}
            onSuccess={async () => {
              const staffsData = await getCouncilStaffs();
              setStaffs(staffsData);
              await refreshData();
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Компонент карточки члена совета
interface CouncilMemberCardProps {
  member: CouncilMember;
  isAdmin: boolean;
  compact?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

const CouncilMemberCard: React.FC<CouncilMemberCardProps> = ({
  member,
  isAdmin,
  compact = false,
  onEdit,
  onRemove
}) => {
  const PositionIcon = member.position ? 
    [Crown, Shield, Star, Users, BookOpen, Calendar, Trophy, Heart, Target, Award]
      .find(icon => icon.name === member.position?.icon) || Crown : Crown;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className={`card-gradient ${member.position?.color || 'from-gray-600 to-gray-800'} p-6 rounded-2xl shadow-2xl ${
        compact ? 'max-w-sm mx-auto' : 'max-w-md mx-auto'
      }`}
    >
      <div className="text-center">
        <div className="relative mb-4">
          <img
            src={member.cadet?.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
            alt={member.cadet?.name}
            className={`${compact ? 'w-16 h-16' : 'w-24 h-24'} rounded-full object-cover border-4 border-white/30 mx-auto`}
          />
          <div className="absolute -top-2 -right-2 bg-white/20 rounded-full p-2">
            <PositionIcon className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} text-white`} />
          </div>
        </div>
        
        <h4 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-white mb-2`}>
          {member.cadet?.display_name || member.cadet?.name}
        </h4>
        <p className={`text-white/90 font-semibold ${compact ? 'text-sm' : 'text-base'} mb-2`}>
          {member.position?.display_name}
        </p>
        <p className={`text-white/70 ${compact ? 'text-xs' : 'text-sm'} mb-4`}>
          {member.cadet?.platoon} взвод • Рейтинг #{member.cadet?.rank}
        </p>
        
        {member.notes && (
          <p className={`text-white/80 italic ${compact ? 'text-xs' : 'text-sm'} mb-4`}>
            "{member.notes}"
          </p>
        )}

        {isAdmin && (
          <div className="flex space-x-2 justify-center">
            <button
              onClick={onEdit}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onRemove}
              className="bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CouncilPage;