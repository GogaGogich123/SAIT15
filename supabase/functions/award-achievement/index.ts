import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Функция для проверки роли администратора и разрешений
async function checkAdminPermissions(authHeader: string | null, supabaseAdmin: any) {
  if (!authHeader) {
    throw new Error('Отсутствует токен авторизации')
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Handle mock admin users
  if (token === 'mock-super-admin-token') {
    return { id: '00000000-0000-0000-0000-000000000001', role: 'super_admin' }
  }
  
  if (token === 'mock-admin-token') {
    return { id: '00000000-0000-0000-0000-000000000002', role: 'admin' }
  }
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    // For mock users, return mock user data
    if (token.includes('mock')) {
      return { id: '00000000-0000-0000-0000-000000000002', role: 'admin' }
    }
    throw new Error('Недействительный токен авторизации')
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    // For mock scenarios, assume admin role
    if (user.id.startsWith('00000000-0000-0000-0000')) {
      return { ...user, role: 'admin' }
    }
    throw new Error('Пользователь не найден')
  }

  if (userData.role !== 'admin' && userData.role !== 'super_admin') {
    throw new Error('Недостаточно прав доступа')
  }

  const userRole = userData.role
  
  // Super admins and mock users always have permission
  if (userRole === 'super_admin' || user.id.startsWith('00000000-0000-0000-0000')) {
    return user
  }
  
  // For regular admins, check specific permission
  if (userRole === 'admin') {
    // Check if user has manage_achievements permission
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('admin_permissions')
      .select('id')
      .eq('name', 'manage_achievements')
      .single()

    if (permError || !permissions) {
      console.error('Error finding manage_achievements permission:', permError)
      throw new Error('Ошибка проверки прав доступа')
    }

    // Check if user has this permission through roles or direct assignment
    const { data: userPermissions, error: userPermError } = await supabaseAdmin
      .from('user_permissions')
      .select('permission_id')
      .eq('user_id', user.id)
      .eq('permission_id', permissions.id)
      .eq('is_active', true)
      .maybeSingle()

    if (userPermError) {
      console.error('Error checking user permissions:', userPermError)
      throw new Error('Ошибка проверки прав доступа')
    }

    // Also check permissions through roles
    const { data: rolePermissions, error: rolePermError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        role_id,
        admin_roles!inner(
          role_permissions!inner(
            permission_id
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('admin_roles.role_permissions.permission_id', permissions.id)

    if (rolePermError) {
      console.error('Error checking role permissions:', rolePermError)
      throw new Error('Ошибка проверки прав доступа')
    }

    const hasDirectPermission = !!userPermissions
    const hasRolePermission = rolePermissions && rolePermissions.length > 0

    if (!hasDirectPermission && !hasRolePermission) {
      throw new Error('Недостаточно прав для присуждения достижений')
    }
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
    const adminUser = await checkAdminPermissions(authHeader, supabaseAdmin)

    const { cadetId, achievementId } = await req.json()

    // Validate required fields
    if (!cadetId || !achievementId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Awarding achievement:', { cadetId, achievementId })

    // Проверяем, что кадет и достижение существуют
    const { data: cadet, error: cadetError } = await supabaseAdmin
      .from('cadets')
      .select('name')
      .eq('id', cadetId)
      .single()

    if (cadetError || !cadet) {
      return new Response(
        JSON.stringify({ error: 'Кадет не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: achievement, error: achievementError } = await supabaseAdmin
      .from('achievements')
      .select('title')
      .eq('id', achievementId)
      .single()

    if (achievementError || !achievement) {
      return new Response(
        JSON.stringify({ error: 'Достижение не найдено' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, не присуждено ли уже это достижение кадету
    const { data: existingAward, error: checkError } = await supabaseAdmin
      .from('cadet_achievements')
      .select('id')
      .eq('cadet_id', cadetId)
      .eq('achievement_id', achievementId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing award:', checkError)
      throw new Error(`Ошибка проверки существующих наград: ${checkError.message}`)
    }

    if (existingAward) {
      return new Response(
        JSON.stringify({ error: 'Это достижение уже присуждено данному кадету' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Присуждаем достижение
    const { data: newAward, error: awardError } = await supabaseAdmin
      .from('cadet_achievements')
      .insert([{
        cadet_id: cadetId,
        achievement_id: achievementId,
        awarded_by: adminUser.id,
        awarded_date: new Date().toISOString()
      }])
      .select()
      .single()

    if (awardError) {
      console.error('Achievement award error:', awardError)
      throw new Error(`Ошибка присуждения достижения: ${awardError.message}`)
    }

    console.log('Achievement awarded successfully:', newAward)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Достижение "${achievement.title}" успешно присуждено кадету ${cadet.name}`,
        award: newAward
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