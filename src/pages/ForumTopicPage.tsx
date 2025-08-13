import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  User, 
  Clock, 
  Pin, 
  Lock, 
  Eye,
  Send,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedSVGBackground from '../components/AnimatedSVGBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getTopicById, 
  getPostsByTopic, 
  createPost,
  incrementTopicViews,
  updatePost,
  deletePost,
  type ForumTopic,
  type ForumPost
} from '../lib/forum';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const ForumTopicPage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopicData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Получаем тему
        const topicData = await getTopicById(id);
        if (!topicData) {
          setError('Тема не найдена');
          return;
        }
        setTopic(topicData);
        
        // Увеличиваем счетчик просмотров
        await incrementTopicViews(id);
        
        // Получаем посты
        const postsData = await getPostsByTopic(id);
        setPosts(postsData);
        
      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError('Ошибка загрузки темы');
      } finally {
        setLoading(false);
      }
    };

    fetchTopicData();
  }, [id]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.cadetId || !id || !newPostContent.trim()) return;

    try {
      setSubmitting(true);
      const newPost = await createPost(id, newPostContent.trim(), user.cadetId);
      setPosts([...posts, newPost]);
      setNewPostContent('');
      alert('Ответ добавлен');
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Ошибка создания ответа');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      await updatePost(postId, editContent.trim());
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, content: editContent.trim(), is_edited: true, edited_at: new Date().toISOString() }
          : post
      ));
      setEditingPost(null);
      setEditContent('');
      alert('Сообщение обновлено');
    } catch (err) {
      console.error('Error updating post:', err);
      alert('Ошибка обновления сообщения');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return;

    try {
      await deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
      alert('Сообщение удалено');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Ошибка удаления сообщения');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Загрузка темы..." size="lg" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка</h2>
          <p className="text-blue-200 mb-4">{error || 'Тема не найдена'}</p>
          <Link to="/forum" className="btn-primary">
            Вернуться к форуму
          </Link>
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
        <div className="container-custom max-w-4xl">
          {/* Back Button */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <Link 
              to="/forum"
              className="inline-flex items-center space-x-2 text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Вернуться к форуму</span>
            </Link>
          </motion.div>

          {/* Topic Header */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="card-hover p-8 mb-8"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {topic.is_pinned && <Pin className="h-5 w-5 text-yellow-400" />}
                {topic.is_locked && <Lock className="h-5 w-5 text-red-400" />}
              </div>
              <div className="flex items-center space-x-4 text-blue-300">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{topic.views_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{posts.length}</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-display font-black text-white mb-6 text-shadow">
              {topic.title}
            </h1>
            
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-blue-100 text-lg leading-relaxed">{topic.content}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-blue-300">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{topic.author?.name}</span>
                <span className="text-blue-400">({topic.author?.platoon})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{formatDate(topic.created_at)}</span>
              </div>
            </div>
          </motion.div>

          {/* Posts */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 mb-8"
          >
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                variants={staggerItem}
                className="card-hover p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={post.author?.avatar_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200'}
                      alt={post.author?.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-white">{post.author?.name}</span>
                        <span className="text-blue-400 text-sm">
                          {post.author?.platoon} взвод, {post.author?.squad} отделение
                        </span>
                      </div>
                      
                      {user?.cadetId === post.author_id && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingPost(post.id);
                              setEditContent(post.content);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingPost === post.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="input resize-none"
                          rows={4}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="btn-primary"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => {
                              setEditingPost(null);
                              setEditContent('');
                            }}
                            className="btn-ghost"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-invert max-w-none mb-3">
                          <p className="text-blue-100">{post.content}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-blue-400">
                          <span>{formatDate(post.created_at)}</span>
                          {post.is_edited && post.edited_at && (
                            <span className="italic">
                              (изменено {formatDate(post.edited_at)})
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Reply Form */}
          {user && !topic.is_locked && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="card-hover p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Ответить</h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Напишите ваш ответ..."
                  rows={6}
                  className="input resize-none"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newPostContent.trim()}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Отправить</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {topic.is_locked && (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300 text-lg">Тема заблокирована для новых ответов</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ForumTopicPage;