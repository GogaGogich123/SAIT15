import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Проверяем, является ли пользователь главным админом
  const { data: isSuperAdmin, error: checkError } = await supabaseAdmin
    .rpc('user_has_permission', { 
      user_id: user.id, 
      permission_name: 'manage_admins' 
    })

  if (checkError) {
    throw new Error('Ошибка проверки прав доступа')
  }

  if (!isSuperAdmin) {
    throw new Error('Недостаточно прав доступа. Требуются права главного администратора.')
  }

  return user
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

    const { name, email, password, roleIds, permissionIds = [] } = await req.json()

    // Validate required fields
    if (!name || !email || !password || (!roleIds?.length && !permissionIds?.length)) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating admin:', { name, email, roleIds, permissionIds })

    // 1. Создаем пользователя в Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: `Ошибка создания пользователя: ${authError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = authData.user.id
    console.log('Admin user created with ID:', userId)

    try {
      // 2. Создаем запись в таблице users
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          email,
          name,
          role: 'admin'
        }])

      if (userError) {
        console.error('Users table error:', userError)
        throw userError
      }

      console.log('Admin record created in users table')

      // 3. Назначаем роли администратору
      if (roleIds && roleIds.length > 0) {
        const userRoleInserts = roleIds.map(roleId => ({
          user_id: userId,
          role_id: roleId,
          assigned_by: currentUser.id,
          is_active: true
        }))

        const { error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .insert(userRoleInserts)

        if (rolesError) {
          console.error('User roles error:', rolesError)
          throw rolesError
        }

        console.log('Admin roles assigned successfully')
      }

      // 4. Назначаем дополнительные разрешения администратору
      if (permissionIds && permissionIds.length > 0) {
        const userPermissionInserts = permissionIds.map(permissionId => ({
          user_id: userId,
          permission_id: permissionId,
          assigned_by: currentUser.id,
          is_active: true
        }))

        const { error: permissionsError } = await supabaseAdmin
          .from('user_permissions')
          .insert(userPermissionInserts)

        if (permissionsError) {
          console.error('User permissions error:', permissionsError)
          throw permissionsError
        }

        console.log('Admin permissions assigned successfully')
      }

      // 5. Получаем полные данные созданного администратора
      const { data: adminData, error: fetchError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          user_roles!inner(
            role:admin_roles(*)
          )
        `)
        .eq('id', userId)
        .eq('user_roles.is_active', true)
        .single()

      if (fetchError) {
        console.error('Error fetching created admin:', fetchError)
        throw fetchError
      }

      // Получаем разрешения пользователя
      const { data: permissions, error: permissionsError } = await supabaseAdmin
        .rpc('get_user_permissions', { user_id: userId })

      if (permissionsError) {
        console.error('Error fetching user permissions:', permissionsError)
        throw permissionsError
      }

      const admin: AdminUser = {
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        roles: adminData.user_roles?.map((ur: any) => ur.role).filter(Boolean) || [],
        permissions: permissions || [],
        created_at: adminData.created_at
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Администратор успешно создан',
          admin
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (error) {
      // Очищаем пользователя из Auth если что-то пошло не так
      console.error('Error during admin creation, cleaning up auth user:', error)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка при создании администратора'
      console.error('Detailed error:', error)
      return new Response(
        JSON.stringify({ error: `Ошибка при создании администратора: ${errorMessage}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
    console.error('Full error details:', error)
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