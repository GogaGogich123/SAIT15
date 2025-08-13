import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Crown, 
  Settings,
  Eye,
  UserPlus,
  Key,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { 
  getAdminUsers,
  getAdminRoles,
  getAdminPermissions,
  createAdmin,
  updateAdminRoles,
  deactivateAdmin,
  getRolePermissions,
  getPermissionCategories,
  type AdminUser,
  type AdminRole,
  type AdminPermission
} from '../../lib/admin-roles';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface AdminManagementProps {
  currentUserId: string;
  isSuperAdmin: boolean;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ currentUserId, isSuperAdmin }) => {
  const { success, error: showError } = useToast();
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [createAdminModal, setCreateAdminModal] = useState(false);
  const [editRolesModal, setEditRolesModal] = useState<{ isOpen: boolean; admin: AdminUser | null }>({
    isOpen: false,
    admin: null
  });
  const [viewPermissionsModal, setViewPermissionsModal] = useState<{ isOpen: boolean; admin: AdminUser | null }>({
    isOpen: false,
    admin: null
  });

  // Form states
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    roleIds: [] as string[],
    permissionIds: [] as string[]
  });

  const [editRolesForm, setEditRolesForm] = useState<string[]>([]);
  const [editPermissionsForm, setEditPermissionsForm] = useState<string[]>([]);

  const permissionCategories = getPermissionCategories();

  useEffect(() => {
    if (!isSuperAdmin) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [adminsData, rolesData, permissionsData] = await Promise.all([
          getAdminUsers(),
          getAdminRoles(),
          getAdminPermissions()
        ]);
        
        setAdmins(adminsData);
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
        showError('Ошибка загрузки данных администраторов');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isSuperAdmin]);

  const handleCreateAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password || (adminForm.roleIds.length === 0 && adminForm.permissionIds.length === 0)) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      const newAdmin = await createAdmin(adminForm);
      setAdmins([...admins, newAdmin]);
      setCreateAdminModal(false);
      setAdminForm({ name: '', email: '', password: '', roleIds: [], permissionIds: [] });
      success('Администратор успешно создан');
    } catch (error) {
      console.error('Error creating admin:', error);
      showError('Ошибка создания администратора');
    }
  };

  const handleUpdateRoles = async () => {
    if (!editRolesModal.admin) return;

    try {
      await updateAdminRoles(editRolesModal.admin.id, editRolesForm);
      
      // Обновляем локальные данные
      const updatedAdmins = await getAdminUsers();
      setAdmins(updatedAdmins);
      
      setEditRolesModal({ isOpen: false, admin: null });
      setEditRolesForm([]);
      success('Роли администратора обновлены');
    } catch (error) {
      console.error('Error updating admin roles:', error);
      showError('Ошибка обновления ролей');
    }
  };

  const handleDeactivateAdmin = async (adminId: string) => {
    if (adminId === currentUserId) {
      showError('Нельзя деактивировать самого себя');
      return;
    }

    if (!confirm('Вы уверены, что хотите деактивировать этого администратора?')) return;

    try {
      await deactivateAdmin(adminId);
      setAdmins(admins.filter(admin => admin.id !== adminId));
      success('Администратор деактивирован');
    } catch (error) {
      console.error('Error deactivating admin:', error);
      showError('Ошибка деактивации администратора');
    }
  };

  const openEditRoles = (admin: AdminUser) => {
    setEditRolesForm(admin.roles.map(role => role.id));
    setEditRolesModal({ isOpen: true, admin });
  };

  const openViewPermissions = (admin: AdminUser) => {
    setViewPermissionsModal({ isOpen: true, admin });
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'from-red-600 to-red-800';
      case 'admin': return 'from-blue-600 to-blue-800';
      case 'moderator': return 'from-green-600 to-green-800';
      case 'score_manager': return 'from-purple-600 to-purple-800';
      case 'event_manager': return 'from-yellow-600 to-yellow-800';
      case 'content_manager': return 'from-cyan-600 to-cyan-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return Crown;
      case 'admin': return Shield;
      case 'moderator': return Users;
      case 'score_manager': return Settings;
      case 'event_manager': return Settings;
      case 'content_manager': return Settings;
      default: return Settings;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h3>
        <p className="text-blue-200">Только главные администраторы могут управлять другими администраторами</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-300">Загрузка администраторов...</p>
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
          <h2 className="text-3xl font-bold text-white mb-2">Управление администраторами</h2>
          <p className="text-blue-200">Создавайте и управляйте администраторами с различными правами доступа</p>
        </div>
        <button
          onClick={() => setCreateAdminModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Создать администратора</span>
        </button>
      </motion.div>

      {/* Admins List */}
      <motion.div
        className="glass-effect rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {admins.map((admin) => {
          const primaryRole = admin.roles[0];
          const RoleIcon = primaryRole ? getRoleIcon(primaryRole.name) : Shield;
          
          return (
            <motion.div
              key={admin.id}
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -5 }}
              className="card-hover p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${primaryRole ? getRoleColor(primaryRole.name) : 'from-gray-600 to-gray-800'}`}>
                    <RoleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{admin.name}</h3>
                    <p className="text-blue-300 text-sm">{admin.email}</p>
                  </div>
                </div>
                {admin.id === currentUserId && (
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-bold">
                    ВЫ
                  </span>
                )}
              </div>

              {/* Roles */}
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Роли:</h4>
                <div className="flex flex-wrap gap-2">
                  {admin.roles.map((role) => (
                    <span
                      key={role.id}
                      className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getRoleColor(role.name)} text-white`}
                    >
                      {role.display_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Permissions Count */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 text-blue-300">
                  <Key className="h-4 w-4" />
                  <span className="font-semibold">{admin.permissions.length} разрешений</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openViewPermissions(admin)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Права</span>
                </button>
                
                {admin.id !== currentUserId && (
                  <>
                    <button
                      onClick={() => openEditRoles(admin)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeactivateAdmin(admin.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create Admin Modal */}
      {createAdminModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCreateAdminModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-effect rounded-3xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-white mb-6">Создать администратора</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">
                    Имя <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                    className="input"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-bold mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                    className="input"
                    placeholder="admin@nkkk.ru"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-2">
                  Пароль <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  className="input"
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-4">
                  Роли
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((role) => {
                    const RoleIcon = getRoleIcon(role.name);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                          adminForm.roleIds.includes(role.id)
                            ? `bg-gradient-to-r ${getRoleColor(role.name)} text-white`
                            : 'bg-white/5 hover:bg-white/10 text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={adminForm.roleIds.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdminForm({
                                ...adminForm,
                                roleIds: [...adminForm.roleIds, role.id]
                              });
                            } else {
                              setAdminForm({
                                ...adminForm,
                                roleIds: adminForm.roleIds.filter(id => id !== role.id)
                              });
                            }
                          }}
                          className="sr-only"
                        />
                        <RoleIcon className="h-5 w-5" />
                        <div>
                          <div className="font-bold">{role.display_name}</div>
                          <div className="text-sm opacity-80">{role.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-4">
                  Дополнительные разрешения
                </label>
                <div className="space-y-4">
                  {Object.entries(permissionCategories).map(([category, categoryName]) => {
                    const categoryPermissions = permissions.filter(p => p.category === category);
                    
                    if (categoryPermissions.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="text-lg font-semibold text-white mb-3">{categoryName}:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                                adminForm.permissionIds.includes(permission.id)
                                  ? 'bg-blue-600/30 border border-blue-400/50 text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={adminForm.permissionIds.includes(permission.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAdminForm({
                                      ...adminForm,
                                      permissionIds: [...adminForm.permissionIds, permission.id]
                                    });
                                  } else {
                                    setAdminForm({
                                      ...adminForm,
                                      permissionIds: adminForm.permissionIds.filter(id => id !== permission.id)
                                    });
                                  }
                                }}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-semibold">{permission.display_name}</div>
                                <div className="text-sm opacity-80">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleCreateAdmin}
                disabled={!adminForm.name || !adminForm.email || !adminForm.password || (adminForm.roleIds.length === 0 && adminForm.permissionIds.length === 0)}
                className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <UserPlus className="h-5 w-5" />
                <span>Создать администратора</span>
              </button>
              <button
                onClick={() => setCreateAdminModal(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Roles Modal */}
      {editRolesModal.isOpen && editRolesModal.admin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditRolesModal({ isOpen: false, admin: null })}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-effect rounded-3xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Редактировать роли: {editRolesModal.admin.name}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const RoleIcon = getRoleIcon(role.name);
                  return (
                    <label
                      key={role.id}
                      className={`flex items-center space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        editRolesForm.includes(role.id)
                          ? `bg-gradient-to-r ${getRoleColor(role.name)} text-white`
                          : 'bg-white/5 hover:bg-white/10 text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editRolesForm.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditRolesForm([...editRolesForm, role.id]);
                          } else {
                            setEditRolesForm(editRolesForm.filter(id => id !== role.id));
                          }
                        }}
                        className="sr-only"
                      />
                      <RoleIcon className="h-5 w-5" />
                      <div>
                        <div className="font-bold">{role.display_name}</div>
                        <div className="text-sm opacity-80">{role.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleUpdateRoles}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <Edit className="h-5 w-5" />
                <span>Обновить роли</span>
              </button>
              <button
                onClick={() => setEditRolesModal({ isOpen: false, admin: null })}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Permissions Modal */}
      {viewPermissionsModal.isOpen && viewPermissionsModal.admin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewPermissionsModal({ isOpen: false, admin: null })}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-effect rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Разрешения: {viewPermissionsModal.admin.name}
            </h2>
            
            {/* Roles */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Роли:</h3>
              <div className="flex flex-wrap gap-3">
                {viewPermissionsModal.admin.roles.map((role) => {
                  const RoleIcon = getRoleIcon(role.name);
                  return (
                    <div
                      key={role.id}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r ${getRoleColor(role.name)} text-white`}
                    >
                      <RoleIcon className="h-4 w-4" />
                      <span className="font-bold">{role.display_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Permissions by Category */}
            <div className="space-y-6">
              {Object.entries(permissionCategories).map(([category, categoryName]) => {
                const categoryPermissions = viewPermissionsModal.admin!.permissions.filter(
                  p => p.category === category
                );
                
                if (categoryPermissions.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h4 className="text-lg font-bold text-white mb-3">{categoryName}:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <div>
                            <div className="text-white font-semibold">{permission.display_name}</div>
                            <div className="text-blue-300 text-sm">{permission.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-end mt-8">
              <button
                onClick={() => setViewPermissionsModal({ isOpen: false, admin: null })}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminManagement;