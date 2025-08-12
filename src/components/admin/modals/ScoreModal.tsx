import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Cadet } from '../../../lib/supabase';
import { updateCadetScoresAdmin } from '../../../lib/admin';
import { useToast } from '../../../hooks/useToast';

interface ScoreForm {
  cadetId: string;
  category: 'study' | 'discipline' | 'events';
  points: number;
  description: string;
}

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ScoreForm;
  setForm: (form: ScoreForm) => void;
  cadets: Cadet[];
  onSuccess?: () => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  cadets,
  onSuccess
}) => {
  const { success, error: showError } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!form.cadetId || !form.description.trim()) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      await updateCadetScoresAdmin(form.cadetId, form.category, form.points, form.description.trim());
      success('Баллы успешно начислены');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding score:', error);
      showError('Ошибка начисления баллов');
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
        <h2 className="text-3xl font-bold text-white mb-6">Начислить баллы</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-white font-bold mb-2">Кадет</label>
            <select
              value={form.cadetId}
              onChange={(e) => setForm({...form, cadetId: e.target.value})}
              className="input"
            >
              <option value="">Выберите кадета</option>
              {cadets.map(cadet => (
                <option key={cadet.id} value={cadet.id}>
                  {cadet.name} ({cadet.platoon} взвод)
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-bold mb-2">Категория</label>
              <select
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value as any})}
                className="input"
              >
                <option value="study">Учёба</option>
                <option value="discipline">Дисциплина</option>
                <option value="events">Мероприятия</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white font-bold mb-2">Баллы</label>
              <input
                type="number"
                value={form.points}
                onChange={(e) => setForm({...form, points: parseInt(e.target.value) || 0})}
                className="input"
                placeholder="Количество баллов"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white font-bold mb-2">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="input resize-none"
              rows={3}
              placeholder="За что начисляются баллы"
            />
          </div>
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.cadetId || !form.description.trim()}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Target className="h-5 w-5" />
                <span>Начислить</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
          >
            Отмена
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ScoreModal;