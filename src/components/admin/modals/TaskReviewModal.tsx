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
        className="glass-effect rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="h-8 w-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">Проверка задания</h2>
        </div>

        {/* Task Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">{submission.task?.title}</h3>
          <p className="text-blue-300 mb-4">
            Кадет: {submission.cadet?.name} ({submission.cadet?.platoon} взвод)
          </p>
          <p className="text-blue-200 mb-4">{submission.task?.description}</p>
          <div className="flex items-center space-x-4 text-blue-300">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>Максимум баллов: {submission.task?.points}</span>
            </div>
            <span>
              Сдано: {submission.submitted_at && 
                new Date(submission.submitted_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
            </span>
          </div>
        </div>

        {/* Submission Text */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h4 className="text-xl font-bold text-white mb-4">Отчет кадета:</h4>
          <div className="prose prose-invert max-w-none">
            <p className="text-blue-100 whitespace-pre-wrap">{submission.submission_text}</p>
          </div>
        </div>

        {/* Review Form */}
        <div className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-white font-bold text-lg mb-4">
              Результат проверки <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.label
                whileHover={{ scale: 1.02, y: -2 }}
                className={`flex items-center space-x-3 p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                  status === 'completed'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 border-transparent text-white shadow-lg'
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
                <div>
                  <div className="font-bold text-lg">Принять</div>
                  <div className="text-sm opacity-80">Задание выполнено успешно</div>
                </div>
              </motion.label>

              <motion.label
                whileHover={{ scale: 1.02, y: -2 }}
                className={`flex items-center space-x-3 p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                  status === 'rejected'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 border-transparent text-white shadow-lg'
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
                <div>
                  <div className="font-bold text-lg">Отклонить</div>
                  <div className="text-sm opacity-80">Задание выполнено неудовлетворительно</div>
                </div>
              </motion.label>
            </div>
          </div>

          {/* Points Awarded */}
          <div>
            <label className="block text-white font-bold text-lg mb-4">
              Начислить баллов <span className="text-red-400">*</span>
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                value={pointsAwarded}
                onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                className="input text-center text-lg"
                min="0"
                max={submission.task?.points || 100}
              />
              <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex justify-between mt-2 max-w-xs">
              <button
                type="button"
                onClick={() => setPointsAwarded(0)}
                className="text-red-400 hover:text-red-300 text-sm font-semibold"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPointsAwarded(Math.floor((submission.task?.points || 0) * 0.5))}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setPointsAwarded(Math.floor((submission.task?.points || 0) * 0.75))}
                className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setPointsAwarded(submission.task?.points || 0)}
                className="text-green-400 hover:text-green-300 text-sm font-semibold"
              >
                100%
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-white font-bold text-lg mb-4">
              Обратная связь <span className="text-red-400">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Оставьте комментарий о выполнении задания..."
              rows={6}
              className="input resize-none text-lg"
              maxLength={1000}
              required
            />
            <div className="text-right text-blue-300 text-sm mt-2">
              {feedback.length}/1000
            </div>
          </div>

          {/* Preview */}
          {feedback.trim() && (
            <div className="border-t border-white/20 pt-6">
              <h4 className="text-xl font-bold text-white mb-4">Предварительный просмотр</h4>
              <div className={`glass-effect p-6 rounded-xl border-2 ${
                status === 'completed' ? 'border-green-400/30' : 'border-red-400/30'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {status === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <span className={`font-bold text-lg ${
                      status === 'completed' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {status === 'completed' ? 'Задание принято' : 'Задание отклонено'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Star className="h-5 w-5" />
                    <span className="font-bold text-lg">{pointsAwarded}</span>
                  </div>
                </div>
                <p className="text-blue-100">{feedback}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            className={`flex-1 font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 px-8 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              status === 'completed'
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
            }`}
          >
            <Save className="h-6 w-6" />
            <span>{status === 'completed' ? 'Принять задание' : 'Отклонить задание'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center space-x-2"
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