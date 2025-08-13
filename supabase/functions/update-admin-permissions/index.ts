import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    throw new Error('Пользователь не найден')
  }

  // Проверяем роль super_admin или разрешение manage_admins
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

    const { userId, permissionIds } = await req.json()

    if (!userId || !permissionIds || !Array.isArray(permissionIds)) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Updating admin permissions:', { userId, permissionIds })

    // Проверяем, что пользователь существует и является админом
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .in('role', ['admin', 'super_admin'])
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Администратор не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Деактивируем все текущие прямые разрешения пользователя
    const { error: deactivateError } = await supabaseAdmin
      .from('user_permissions')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) {
      console.error('Error deactivating current permissions:', deactivateError)
      throw new Error(`Ошибка деактивации текущих разрешений: ${deactivateError.message}`)
    }

    // Назначаем новые разрешения
    if (permissionIds.length > 0) {
      const userPermissionInserts = permissionIds.map(permissionId => ({
        user_id: userId,
        permission_id: permissionId,
        assigned_by: currentUser.id,
        is_active: true
      }))

      const { error: insertError } = await supabaseAdmin
        .from('user_permissions')
        .upsert(userPermissionInserts, { 
          onConflict: 'user_id,permission_id',
          ignoreDuplicates: false 
        })

      if (insertError) {
        console.error('Error inserting new permissions:', insertError)
        throw new Error(`Ошибка назначения новых разрешений: ${insertError.message}`)
      }
    }

    console.log('Admin permissions updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Разрешения администратора успешно обновлены'
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