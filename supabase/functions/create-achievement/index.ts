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

  if (userData.role !== 'admin' && userData.role !== 'super_admin') {
    throw new Error('Недостаточно прав доступа')
  }

  // Проверяем разрешение manage_achievements
  const { data: hasPermission, error: permError } = await supabaseAdmin
    .rpc('user_has_permission', { 
      user_id: user.id, 
      permission_name: 'manage_achievements' 
    })

  if (permError) {
    console.error('Error checking manage_achievements permission:', permError)
    // Если функция не существует, проверяем роль
    if (userData.role === 'admin' || userData.role === 'super_admin') {
      return user
    }
    throw new Error('Ошибка проверки прав доступа')
  }

  if (!hasPermission && userData.role !== 'super_admin') {
    throw new Error('Недостаточно прав для управления достижениями')
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

    const { title, description, category, icon, color } = await req.json()

    // Validate required fields
    if (!title || !description || !category || !icon || !color) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating achievement:', { title, category, icon, color })

    const { data: newAchievement, error: createError } = await supabaseAdmin
      .from('achievements')
      .insert([{
        title,
        description,
        category,
        icon,
        color
      }])
      .select()
      .single()

    if (createError) {
      console.error('Achievement creation error:', createError)
      throw new Error(`Ошибка создания достижения: ${createError.message}`)
    }

    console.log('Achievement created successfully:', newAchievement)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Достижение успешно создано',
        achievement: newAchievement
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