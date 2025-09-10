import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Crown, Users } from 'lucide-react';
import {
  appointCouncilMember,
  updateCouncilMember,
  removeCouncilMember,
  type CouncilMember,
  type CouncilPosition,
  type CouncilStaff
} from '../../lib/council';
import { Cadet } from '../../lib/supabase';

interface CouncilMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: CouncilMember | null;
  isEditing: boolean;
  cadets: Cadet[];
  positions: CouncilPosition[];
  staffs: CouncilStaff[];
  onSuccess: () => void;
}

const CouncilMemberModal: React.FC<CouncilMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  isEditing,
  cadets,
  positions,
  staffs,
  onSuccess
}) => {
  const [form, setForm] = useState({
    cadet_id: '',
    position_id: '',
    staff_id: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (member && isEditing) {
      setForm({
        cadet_id: member.cadet_id,
        position_id: member.position_id,
        staff_id: member.staff_id || '',
        notes: member.notes || ''
      });
    } else {
      setForm({
        cadet_id: '',
        position_id: '',
        staff_id: '',
        notes: ''
      });
    }
  }, [member, isEditing, isOpen]);

  const selectedPosition = positions.find(p => p.id === form.position_id);
  const selectedCadet = cadets.find(c => c.id === form.cadet_id);
  const selectedStaff = staffs.find(s => s.id === form.staff_id);

  // Определяем, нужен ли штаб для выбранной должности
  const requiresStaff = selectedPosition && selectedPosition.level >= 2; // командир штаба и члены штаба

  const handleSubmit = async () => {
    if (!form.cadet_id || !form.position_id) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (requiresStaff && !form.staff_id) {
      alert('Для этой должности необходимо выбрать штаб');
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditing && member) {
        await updateCouncilMember(member.id, {
          position_id: form.position_id,
          staff_id: form.staff_id || undefined,
          notes: form.notes || undefined
        });
        alert('Член совета обновлен');
      } else {
        await appointCouncilMember({
          cadet_id: form.cadet_id,
          position_id: form.position_id,
          staff_id: form.staff_id || undefined,
          notes: form.notes || undefined
        });
        alert('Кадет назначен в совет');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error with council member:', error);
      alert('Ошибка при работе с членом совета');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!member || !confirm('Вы уверены, что хотите исключить этого кадета из совета?')) return;

    try {
      setSubmitting(true);
      await removeCouncilMember(member.id);
      alert('Кадет исключен из совета');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error removing council member:', error);
      alert('Ошибка исключения из совета');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
        className="glass-effect rounded-3xl max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <Crown className="h-8 w-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white">
            {isEditing ? 'Редактировать назначение' : 'Назначить в совет'}
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Выбор кадета */}
          <div>
            <label className="block text-white font-bold mb-2">
              Кадет <span className="text-red-400">*</span>
            </label>
            <select
              value={form.cadet_id}
              onChange={(e) => setForm({...form, cadet_id: e.target.value})}
              className="input"
              disabled={isEditing} // Нельзя менять кадета при редактировании
            >
              <option value="">Выберите кадета</option>
              {cadets.map(cadet => (
                <option key={cadet.id} value={cadet.id}>
                  {cadet.display_name || cadet.name} ({cadet.platoon} взвод) - #{cadet.rank}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор должности */}
          <div>
            <label className="block text-white font-bold mb-2">
              Должность <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions.map((position) => {
                const PositionIcon = [Crown, Shield, Star, Users].find(icon => 
                  icon.name === position.icon
                ) || Crown;
                
                return (
                  <motion.label
                    key={position.id}
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                      form.position_id === position.id
                        ? `bg-gradient-to-r ${position.color} border-transparent text-white shadow-lg`
                        : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="position"
                      value={position.id}
                      checked={form.position_id === position.id}
                      onChange={(e) => setForm({...form, position_id: e.target.value, staff_id: ''})}
                      className="sr-only"
                    />
                    <PositionIcon className="h-6 w-6" />
                    <div>
                      <div className="font-bold">{position.display_name}</div>
                      <div className="text-sm opacity-80">{position.description}</div>
                    </div>
                  </motion.label>
                );
              })}
            </div>
          </div>

          {/* Выбор штаба (если нужен) */}
          {requiresStaff && (
            <div>
              <label className="block text-white font-bold mb-2">
                Штаб <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffs.map((staff) => {
                  const StaffIcon = [BookOpen, Calendar, Trophy, Heart, Target].find(icon => 
                    icon.name === staff.icon
                  ) || Users;
                  
                  return (
                    <motion.label
                      key={staff.id}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                        form.staff_id === staff.id
                          ? `bg-gradient-to-r ${staff.color} border-transparent text-white shadow-lg`
                          : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staff"
                        value={staff.id}
                        checked={form.staff_id === staff.id}
                        onChange={(e) => setForm({...form, staff_id: e.target.value})}
                        className="sr-only"
                      />
                      <StaffIcon className="h-6 w-6" />
                      <div>
                        <div className="font-bold">{staff.display_name}</div>
                        <div className="text-sm opacity-80">{staff.description}</div>
                      </div>
                    </motion.label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Заметки */}
          <div>
            <label className="block text-white font-bold mb-2">Заметки</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="Дополнительная информация о назначении..."
            />
          </div>

          {/* Предварительный просмотр */}
          {selectedCadet && selectedPosition && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-white/20 pt-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h3>
              <div className={`glass-effect p-6 rounded-xl bg-gradient-to-r ${selectedPosition.color}`}>
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedCadet.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                    alt={selectedCadet.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {selectedCadet.display_name || selectedCadet.name}
                    </h4>
                    <p className="text-white/90 font-semibold">{selectedPosition.display_name}</p>
                    {selectedStaff && (
                      <p className="text-white/80">Штаб: {selectedStaff.display_name}</p>
                    )}
                    <p className="text-white/70 text-sm">
                      {selectedCadet.platoon} взвод • Рейтинг #{selectedCadet.rank}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.cadet_id || !form.position_id || (requiresStaff && !form.staff_id)}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>{isEditing ? 'Обновить' : 'Назначить'}</span>
              </>
            )}
          </button>
          
          {isEditing && (
            <button
              onClick={handleRemove}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5" />
              <span>Исключить</span>
            </button>
          )}
          
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
            <span>Отмена</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CouncilMemberModal;