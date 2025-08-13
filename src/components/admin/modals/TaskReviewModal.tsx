import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Star, MessageSquare, Save, X } from 'lucide-react';
import { TaskSubmission } from '../../../lib/tasks';

interface TaskReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submissionId: string, status: 'completed' | 'rejected', feedback: string, pointsAwarded: number) => void;
  submission: TaskSubmission | null;
}

const TaskReviewModal: React.FC<TaskReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submission
}) => {
  const [status, setStatus] = useState<'completed' | 'rejected'>('completed');
  const [feedback, setFeedback] = useState('');
  const [pointsAwarded, setPointsAwarded] = useState(0);

  React.useEffect(() => {
    if (submission) {
      setPointsAwarded(submission.task?.points || 0);
      setFeedback('');
      setStatus('completed');
    }
  }, [submission]);

  const handleSubmit = () => {
    if (!submission || !feedback.trim()) return;
    onSubmit(submission.id, status, feedback.trim(), pointsAwarded);
  };

  if (!isOpen || !submission) return null;

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
        className="glass-effect rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-white mb-6">Проверка задания</h2>
        
        {/* Task Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{submission.task?.title}</h3>
          <p className="text-blue-300 mb-4">
            Кадет: {submission.cadet?.name} ({submission.cadet?.platoon} взвод)
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Ответ кадета:</h4>
            <p className="text-blue-100">{submission.submission_text}</p>
          </div>
        </div>

        {/* Review Form */}
        <div className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-white font-bold mb-4">Результат проверки</label>
            <div className="grid grid-cols-2 gap-4">
              <motion.label
                whileHover={{ scale: 1.02 }}
                className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                  status === 'completed'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 border-transparent text-white'
                    : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={status === 'completed'}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="sr-only"
                />
                <CheckCircle className="h-6 w-6" />
                <span className="font-bold text-lg">Принять</span>
              </motion.label>

              <motion.label
                whileHover={{ scale: 1.02 }}
                className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                  status === 'rejected'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 border-transparent text-white'
                    : 'bg-white/5 border-white/20 hover:bg-white/10 text-white hover:border-white/40'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="rejected"
                  checked={status === 'rejected'}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="sr-only"
                />
                <XCircle className="h-6 w-6" />
                <span className="font-bold text-lg">Отклонить</span>
              </motion.label>
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="block text-white font-bold mb-2">
              Баллы к начислению
            </label>
            <div className="relative">
              <input
                type="number"
                value={pointsAwarded}
                onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                className="input text-center"
                min="0"
                max={submission.task?.points || 100}
                disabled={status === 'rejected'}
              />
              <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-blue-300 text-sm">
                Максимум: {submission.task?.points || 0}
              </span>
              {status === 'rejected' && (
                <span className="text-red-400 text-sm">
                  При отклонении баллы не начисляются
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-white font-bold mb-2">
              Отзыв <span className="text-red-400">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="input resize-none"
              rows={4}
              placeholder={status === 'completed' 
                ? "Отличная работа! Задание выполнено качественно..." 
                : "Задание не соответствует требованиям. Необходимо доработать..."}
            />
          </div>
        </div>
        
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{status === 'completed' ? 'Принять задание' : 'Отклонить задание'}</span>
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

export default TaskReviewModal;