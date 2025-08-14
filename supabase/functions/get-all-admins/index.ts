import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Функция для проверки прав главного администратора
async function checkSuperAdminRole(authHeader: string | null, supabaseAdmin: any) {
  if (!authHeader) {
    throw new Error('Отсутствует токен авторизации')
  }

  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Недействительный токен авторизации')
  }

  // Проверяем роль пользователя в таблице users
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    throw new Error('Пользователь не найден')
  }

  // Проверяем, является ли пользователь главным админом
  if (userData.role === 'super_admin') {
    return user
  }

  // Проверяем разрешение manage_admins через роли
  const { data: hasPermission, error: permError } = await supabaseAdmin
    .from('user_roles')
    .select(`
      role:admin_roles!inner(
        role_permissions!inner(
          permission:admin_permissions!inner(name)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('role.role_permissions.permission.name', 'manage_admins')
    .limit(1)

  if (permError) {
    console.error('Error checking manage_admins permission:', permError)
  }

  // Проверяем прямые разрешения
  const { data: directPermission, error: directError } = await supabaseAdmin
    .from('user_permissions')
    .select(`
      permission:admin_permissions!inner(name)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('permission.name', 'manage_admins')
    .limit(1)

  if (directError) {
    console.error('Error checking direct manage_admins permission:', directError)
  }

  const hasManageAdminsPermission = (hasPermission && hasPermission.length > 0) || 
                                   (directPermission && directPermission.length > 0)

  if (!hasManageAdminsPermission) {
    throw new Error('Недостаточно прав доступа. Требуются права главного администратора.')
  }

  return user
}

// Функция для получения ролей пользователя
async function getUserRoles(userId: string, supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select(`
      role:admin_roles(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching user roles:', error)
    return []
  }

  return data?.map((item: any) => item.role).filter(Boolean) || []
}

// Функция для получения разрешений пользователя
async function getUserPermissions(userId: string, supabaseAdmin: any) {
  try {
    // Получаем прямые разрешения пользователя
    const { data: directPermissions, error: directError } = await supabaseAdmin
      .from('user_permissions')
      .select(`
        permission:admin_permissions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (directError) {
      console.error('Error fetching direct permissions:', directError)
    }

    // Получаем разрешения через роли
    const { data: rolePermissions, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        role:admin_roles!inner(
          role_permissions(
            permission:admin_permissions(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (roleError) {
      console.error('Error fetching role permissions:', roleError)
    }

    // Объединяем все разрешения
    const allPermissions: any[] = []
    
    // Добавляем прямые разрешения
    if (directPermissions) {
      directPermissions.forEach(item => {
        if (item.permission) {
          allPermissions.push(item.permission)
        }
      })
    }

    // Добавляем разрешения от ролей
    if (rolePermissions) {
      rolePermissions.forEach(userRole => {
        if (userRole.role?.role_permissions) {
          userRole.role.role_permissions.forEach((rp: any) => {
            if (rp.permission) {
              allPermissions.push(rp.permission)
            }
          })
        }
      })
    }

    // Удаляем дубликаты по ID
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    )

    return uniquePermissions
  } catch (error) {
    console.error('Error in getUserPermissions:', error)
    return []
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')
    const currentUser = await checkSuperAdminRole(authHeader, supabaseAdmin)

    console.log('Fetching all admin users...')

    // Получаем всех администраторов из таблицы users
    const { data: adminUsers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching admin users:', fetchError)
      throw new Error(`Ошибка получения администраторов: ${fetchError.message}`)
    }

    console.log(`Found ${adminUsers?.length || 0} admin users`)

    // Получаем роли и разрешения для каждого администратора
    const adminUsersWithRoles = await Promise.all(
      (adminUsers || []).map(async (user) => {
        const roles = await getUserRoles(user.id, supabaseAdmin)
        const permissions = await getUserPermissions(user.id, supabaseAdmin)
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          roles,
          permissions,
          created_at: user.created_at
        }
      })
    )

    console.log('Admin users with roles and permissions loaded successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        admins: adminUsersWithRoles
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
    const statusCode = errorMessage.includes('прав доступа') || errorMessage.includes('токен') ? 403 : 500
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})