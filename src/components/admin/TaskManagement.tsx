import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Clock, 
  Star,
  AlertTriangle,
  Calendar,
  Target,
  BookOpen,
  Trophy,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getTasks, 
  getAllTaskSubmissions,
  createTask,
  updateTask,
  deleteTask,
  reviewTaskSubmission,
  type Task,
  type TaskSubmission
} from '../../lib/tasks';
import TaskModal from './modals/TaskModal';
import TaskReviewModal from './modals/TaskReviewModal';
import { staggerContainer, staggerItem } from '../../utils/animations';

const TaskManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks');
  
  // Modal states
  const [taskModal, setTaskModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    task: null as Task | null 
  });
  const [reviewModal, setReviewModal] = useState({ 
    isOpen: false, 
    submission: null as TaskSubmission | null 
  });

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'study' as 'study' | 'discipline' | 'events',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    points: 10,
    deadline: '',
    max_participants: 0,
    abandon_penalty: 5,
    status: 'active' as 'active' | 'inactive',
    is_active: true
  });

  useEffect(() => {
    if (!hasPermission('manage_tasks')) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [tasksData, submissionsData] = await Promise.all([
          getTasks(),
          getAllTaskSubmissions()
        ]);
        
        setTasks(tasksData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error loading task data:', error);
        alert('Ошибка загрузки данных заданий');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hasPermission]);

  const refreshSubmissions = async () => {
    try {
      const submissionsData = await getAllTaskSubmissions();
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error refreshing submissions:', error);
    }
  };
  const handleCreateTask = () => {
    setTaskForm({
      title: '',
      description: '',
      category: 'study',
      difficulty: 'medium',
      points: 10,
      deadline: '',
      max_participants: 0,
      abandon_penalty: 5,
      status: 'active',
      is_active: true
    });
    setTaskModal({ isOpen: true, isEditing: false, task: null });
  };

  const handleEditTask = (task: Task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      category: task.category,
      difficulty: task.difficulty,
      points: task.points,
      deadline: task.deadline,
      max_participants: task.max_participants,
      abandon_penalty: task.abandon_penalty,
      status: task.status,
      is_active: task.is_active
    });
    setTaskModal({ isOpen: true, isEditing: true, task });
  };

  const handleSubmitTask = async () => {
    try {
      if (taskModal.isEditing && taskModal.task) {
        await updateTask(taskModal.task.id, taskForm);
        setTasks(tasks.map(t => 
          t.id === taskModal.task!.id ? { ...t, ...taskForm } : t
        ));
        alert('Задание обновлено');
      } else {
        const newTask = await createTask(taskForm);
        setTasks([...tasks, newTask]);
        alert('Задание создано');
      }
      setTaskModal({ isOpen: false, isEditing: false, task: null });
      // Обновляем список отправок после создания/обновления задания
      await refreshSubmissions();
    } catch (error) {
      console.error('Error with task:', error);
      alert('Ошибка при работе с заданием');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это задание?')) return;
    
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      alert('Задание удалено');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Ошибка удаления задания');
    }
  };

  const handleReviewSubmission = (submission: TaskSubmission) => {
    setReviewModal({ isOpen: true, submission });
  };

  const handleSubmitReview = async (
    submissionId: string, 
    status: 'completed' | 'rejected', 
    feedback: string,
    pointsAwarded: number
  ) => {
    try {
      await reviewTaskSubmission(submissionId, status, feedback, pointsAwarded, user?.id || '');
      
      // Обновляем локальные данные
      setSubmissions(submissions.map(s => 
        s.id === submissionId 
          ? { 
              ...s, 
              status, 
              feedback, 
              points_awarded: pointsAwarded,
              reviewed_by: user?.id,
              reviewed_at: new Date().toISOString()
            } 
          : s
      ));
      
      setReviewModal({ isOpen: false, submission: null });
      // Обновляем список отправок после проверки
      await refreshSubmissions();
      alert(`Задание ${status === 'completed' ? 'принято' : 'отклонено'}`);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Ошибка проверки задания');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'from-blue-500 to-blue-700';
      case 'discipline': return 'from-red-500 to-red-700';
      case 'events': return 'from-green-500 to-green-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return BookOpen;
      case 'discipline': return Target;
      case 'events': return Users;
      default: return CheckSquare;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'study': return 'Учёба';
      case 'discipline': return 'Дисциплина';
      case 'events': return 'Мероприятия';
      default: return category;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'text-blue-400 bg-blue-400/20';
      case 'submitted': return 'text-yellow-400 bg-yellow-400/20';
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'abandoned': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken': return 'Взято';
      case 'submitted': return 'На проверке';
      case 'completed': return 'Выполнено';
      case 'rejected': return 'Отклонено';
      case 'abandoned': return 'Отказ';
      default: return status;
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');

  if (!hasPermission('manage_tasks')) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h3>
        <p className="text-blue-200">У вас нет прав для управления заданиями</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-300">Загрузка заданий...</p>
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
          <h2 className="text-3xl font-bold text-white mb-2">Управление заданиями</h2>
          <p className="text-blue-200">Создавайте задания и проверяйте выполнение</p>
        </div>
        <div className="flex items-center space-x-4">
          {pendingSubmissions.length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl px-4 py-2">
              <span className="text-yellow-300 font-bold">
                {pendingSubmissions.length} на проверке
              </span>
            </div>
          )}
          <button
            onClick={handleCreateTask}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Создать задание</span>
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem} className="flex space-x-4">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'tasks'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Задания ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
            activeTab === 'submissions'
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Сдачи ({submissions.length})
          {pendingSubmissions.length > 0 && (
            <span className="ml-2 bg-yellow-500 text-black rounded-full px-2 py-1 text-xs font-bold">
              {pendingSubmissions.length}
            </span>
          )}
        </button>
      </motion.div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tasks.map((task) => {
            const CategoryIcon = getCategoryIcon(task.category);
            
            return (
              <motion.div
                key={task.id}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -5 }}
                className="card-hover p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(task.category)}`}>
                      <CategoryIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty === 'easy' ? 'Легко' : 
                       task.difficulty === 'medium' ? 'Средне' : 'Сложно'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Star className="h-5 w-5" />
                    <span className="font-bold">{task.points}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">{task.title}</h3>
                <p className="text-blue-200 mb-4 line-clamp-3">{task.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-blue-300">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дн.
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-blue-300">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {task.current_participants}
                        {task.max_participants > 0 && ` / ${task.max_participants}`}
                      </span>
                    </div>
                    {task.abandon_penalty > 0 && (
                      <div className="flex items-center space-x-1 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Штраф: {task.abandon_penalty}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Изменить</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Pending Reviews */}
          {pendingSubmissions.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <AlertTriangle className="h-6 w-6 text-yellow-400 mr-2" />
                Требуют проверки ({pendingSubmissions.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {pendingSubmissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    variants={staggerItem}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="card-hover p-6 border-2 border-yellow-400/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">
                          {submission.task?.title}
                        </h4>
                        <p className="text-blue-300">
                          {submission.cadet?.name} ({submission.cadet?.platoon})
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="h-5 w-5" />
                        <span className="font-bold">{submission.task?.points}</span>
                      </div>
                    </div>

                    <p className="text-blue-200 mb-4 line-clamp-3">
                      {submission.submission_text}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-400 text-sm">
                        Сдано: {submission.submitted_at && 
                          new Date(submission.submitted_at).toLocaleDateString('ru-RU')}
                      </span>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleReviewSubmission(submission)}
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-5 w-5" />
                      <span>Проверить</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Submissions */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Все сдачи</h3>
            <div className="space-y-4">
              {submissions.map((submission) => {
                const CategoryIcon = getCategoryIcon(submission.task?.category || '');
                
                return (
                  <motion.div
                    key={submission.id}
                    variants={staggerItem}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="card-hover p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-grow">
                        <div className="flex-shrink-0">
                          <img
                            src={submission.cadet?.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                            alt={submission.cadet?.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-bold text-white">
                              {submission.task?.title}
                            </h4>
                            <div className={`p-1 rounded bg-gradient-to-r ${getCategoryColor(submission.task?.category || '')}`}>
                              <CategoryIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          
                          <p className="text-blue-300 mb-2">
                            {submission.cadet?.name} • {submission.cadet?.platoon} взвод
                          </p>
                          
                          {submission.submission_text && (
                            <p className="text-blue-200 mb-2 line-clamp-2">
                              {submission.submission_text}
                            </p>
                          )}
                          
                          {submission.feedback && (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
                              <p className="text-blue-100 text-sm">
                                <strong>Отзыв:</strong> {submission.feedback}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-blue-400">
                            <span>
                              Создано: {new Date(submission.created_at).toLocaleDateString('ru-RU')}
                            </span>
                            {submission.submitted_at && (
                              <span>
                                Сдано: {new Date(submission.submitted_at).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                            {submission.reviewed_at && (
                              <span>
                                Проверено: {new Date(submission.reviewed_at).toLocaleDateString('ru-RU')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </div>
                        
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Star className="h-4 w-4" />
                          <span className="font-bold">
                            {submission.points_awarded || submission.task?.points || 0}
                          </span>
                        </div>
                        
                        {submission.status === 'submitted' && (
                          <button
                            onClick={() => handleReviewSubmission(submission)}
                            className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Проверить</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {submissions.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-blue-300 text-lg">Пока нет сдач заданий</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={() => setTaskModal({ isOpen: false, isEditing: false, task: null })}
        onSubmit={handleSubmitTask}
        form={taskForm}
        setForm={setTaskForm}
        isEditing={taskModal.isEditing}
      />

      {/* Review Modal */}
      <TaskReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, submission: null })}
        onSubmit={handleSubmitReview}
        submission={reviewModal.submission}
      />
    </motion.div>
  );
};

export default TaskManagement;