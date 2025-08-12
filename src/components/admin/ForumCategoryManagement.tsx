import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { 
  getForumCategories, 
  createForumCategory, 
  updateForumCategory, 
  deleteForumCategory,
  type ForumCategory
} from '../../lib/forum';
import ForumCategoryModal from './modals/ForumCategoryModal';
import { staggerContainer, staggerItem } from '../../utils/animations';

const ForumCategoryManagement: React.FC = () => {
  const { success, error: showError } = useToast();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    isEditing: false, 
    category: null as ForumCategory | null 
  });
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: 'MessageSquare',
    color: 'from-blue-500 to-blue-700',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await getForumCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setForm({
      name: '',
      description: '',
      icon: 'MessageSquare',
      color: 'from-blue-500 to-blue-700',
      sort_order: categories.length,
      is_active: true
    });
    setModal({ isOpen: true, isEditing: false, category: null });
  };

  const handleEditCategory = (category: ForumCategory) => {
    setForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setModal({ isOpen: true, isEditing: true, category });
  };

  const handleSubmitCategory = async () => {
    try {
      if (modal.isEditing && modal.category) {
        await updateForumCategory(modal.category.id, form);
        setCategories(categories.map(c => 
          c.id === modal.category!.id ? { ...c, ...form } : c
        ));
        success('Категория обновлена');
      } else {
        const newCategory = await createForumCategory(form);
        setCategories([...categories, newCategory]);
        success('Категория создана');
      }
      setModal({ isOpen: false, isEditing: false, category: null });
    } catch (error) {
      console.error('Error with category:', error);
      showError('Ошибка при работе с категорией');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Все темы в ней также будут удалены.')) return;
    
    try {
      await deleteForumCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      success('Категория удалена');
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Ошибка удаления категории');
    }
  };

  const handleToggleActive = async (category: ForumCategory) => {
    try {
      await updateForumCategory(category.id, { is_active: !category.is_active });
      setCategories(categories.map(c => 
        c.id === category.id ? { ...c, is_active: !c.is_active } : c
      ));
      success(`Категория ${!category.is_active ? 'активирована' : 'деактивирована'}`);
    } catch (error) {
      console.error('Error toggling category:', error);
      showError('Ошибка изменения статуса категории');
    }
  };

  const moveCategoryUp = async (category: ForumCategory) => {
    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
    
    if (currentIndex > 0) {
      const prevCategory = sortedCategories[currentIndex - 1];
      
      try {
        await updateForumCategory(category.id, { sort_order: prevCategory.sort_order });
        await updateForumCategory(prevCategory.id, { sort_order: category.sort_order });
        
        setCategories(categories.map(c => {
          if (c.id === category.id) return { ...c, sort_order: prevCategory.sort_order };
          if (c.id === prevCategory.id) return { ...c, sort_order: category.sort_order };
          return c;
        }));
        
        success('Порядок категорий изменен');
      } catch (error) {
        console.error('Error moving category:', error);
        showError('Ошибка изменения порядка');
      }
    }
  };

  const moveCategoryDown = async (category: ForumCategory) => {
    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
    
    if (currentIndex < sortedCategories.length - 1) {
      const nextCategory = sortedCategories[currentIndex + 1];
      
      try {
        await updateForumCategory(category.id, { sort_order: nextCategory.sort_order });
        await updateForumCategory(nextCategory.id, { sort_order: category.sort_order });
        
        setCategories(categories.map(c => {
          if (c.id === category.id) return { ...c, sort_order: nextCategory.sort_order };
          if (c.id === nextCategory.id) return { ...c, sort_order: category.sort_order };
          return c;
        }));
        
        success('Порядок категорий изменен');
      } catch (error) {
        console.error('Error moving category:', error);
        showError('Ошибка изменения порядка');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-300">Загрузка категорий...</p>
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
        <h2 className="text-3xl font-bold text-white">Управление категориями форума</h2>
        <button onClick={handleCreateCategory} className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Создать категорию
        </button>
      </motion.div>

      {/* Categories List */}
      <motion.div
        variants={staggerContainer}
        className="space-y-4"
      >
        {categories
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((category) => (
            <motion.div
              key={category.id}
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`card-hover p-6 border transition-all duration-300 ${
                category.is_active 
                  ? 'border-white/20 hover:border-blue-400/50' 
                  : 'border-gray-600/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    <p className="text-blue-300">{category.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-blue-400 mt-2">
                      <span>Порядок: {category.sort_order}</span>
                      <span>Иконка: {category.icon}</span>
                      <span className={category.is_active ? 'text-green-400' : 'text-red-400'}>
                        {category.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Move buttons */}
                  <button
                    onClick={() => moveCategoryUp(category)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Переместить вверх"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveCategoryDown(category)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Переместить вниз"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  
                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`p-2 rounded-lg transition-colors ${
                      category.is_active 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                    title={category.is_active ? 'Деактивировать' : 'Активировать'}
                  >
                    {category.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  
                  {/* Edit button */}
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </motion.div>

      {categories.length === 0 && (
        <motion.div
          variants={staggerItem}
          className="text-center py-12"
        >
          <MessageSquare className="h-16 w-16 text-blue-400 mx-auto mb-4 opacity-50" />
          <p className="text-blue-300 text-lg">Пока нет категорий форума</p>
          <button onClick={handleCreateCategory} className="btn-primary mt-4">
            Создать первую категорию
          </button>
        </motion.div>
      )}

      {/* Modal */}
      <ForumCategoryModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, isEditing: false, category: null })}
        onSubmit={handleSubmitCategory}
        form={form}
        setForm={setForm}
        isEditing={modal.isEditing}
      />
    </motion.div>
  );
};

export default ForumCategoryManagement;