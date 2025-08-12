import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, User, Calendar, Eye, ThumbsUp, Edit, Trash2, Pin, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { getTopicById, getPostsByTopic, createPost, updatePost, deletePost, castTopicVote, removeTopicVote } from '../lib/forum';
import { formatDistanceToNow } from 'date-fns';

interface Topic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  posts_count: number;
  votes_count: number;
  voting_enabled: boolean;
  created_at: string;
  updated_at: string;
  author: {
    name: string;
    avatar_url?: string;
    platoon: string;
    rank: number;
  };
}

interface Post {
  id: string;
  content: string;
  author_id: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  author: {
    name: string;
    avatar_url?: string;
    platoon: string;
    rank: number;
  };
}

export default function ForumTopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, cadet } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTopicData();
    }
  }, [id]);

  const loadTopicData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [topicData, postsData] = await Promise.all([
        getTopicById(id),
        getPostsByTopic(id)
      ]);
      
      setTopic(topicData);
      setPosts(postsData);
      
      // Check if user has voted (this would need to be implemented in the forum lib)
      // setHasVoted(await checkUserVote(id, cadet?.id));
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !cadet || !id) return;

    try {
      setSubmitting(true);
      await createPost(id, cadet.id, newPostContent);
      setNewPostContent('');
      await loadTopicData();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      await updatePost(postId, editContent);
      setEditingPost(null);
      setEditContent('');
      await loadTopicData();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(postId);
      await loadTopicData();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleVote = async () => {
    if (!cadet || !id) return;

    try {
      if (hasVoted) {
        await removeTopicVote(id, cadet.id);
        setHasVoted(false);
      } else {
        await castTopicVote(id, cadet.id);
        setHasVoted(true);
      }
      await loadTopicData();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const startEdit = (post: Post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Topic not found</h2>
          <Button onClick={() => navigate('/forum')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/forum')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forum
          </Button>
        </div>

        {/* Topic Header */}
        <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {topic.is_pinned && <Pin className="w-4 h-4 text-yellow-400" />}
                  {topic.is_locked && <Lock className="w-4 h-4 text-red-400" />}
                  <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{topic.author.name}</span>
                    <span className="text-blue-400">({topic.author.platoon})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{topic.views_count} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{topic.posts_count} replies</span>
                  </div>
                </div>
              </div>

              {topic.voting_enabled && (
                <Button
                  onClick={handleVote}
                  variant={hasVoted ? "default" : "outline"}
                  className={hasVoted ? "bg-blue-600 hover:bg-blue-700" : "border-white/20 hover:bg-white/10"}
                  disabled={!cadet}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {topic.votes_count}
                </Button>
              )}
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-200 whitespace-pre-wrap">{topic.content}</p>
            </div>
          </div>
        </Card>

        {/* Posts */}
        <div className="space-y-4 mb-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white/5 backdrop-blur-sm border-white/10">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{post.author.name}</div>
                      <div className="text-sm text-gray-400">{post.author.platoon}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      {post.is_edited && post.edited_at && (
                        <span className="ml-2 text-xs">(edited)</span>
                      )}
                    </span>
                    
                    {cadet && cadet.id === post.author_id && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(post)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {editingPost === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                      rows={4}
                      placeholder="Edit your post..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditPost(post.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="border-white/20 hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* New Post Form */}
        {cadet && !topic.is_locked && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Reply to Topic</h3>
              <div className="space-y-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
                  rows={4}
                  placeholder="Write your reply..."
                />
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!cadet && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6 text-center">
              <p className="text-gray-300 mb-4">You need to be logged in to reply to this topic.</p>
              <Link to="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Login to Reply
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}