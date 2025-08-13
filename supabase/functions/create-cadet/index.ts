import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Функция для проверки роли администратора
async function checkAdminRole(authHeader: string | null, supabaseAdmin: any) {
  if (!authHeader) {
    throw new Error('Отсутствует токен авторизации')
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Проверяем токен и получаем пользователя
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

  if (userData.role !== 'admin') {
    throw new Error('Недостаточно прав доступа')
  }

  return user
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
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

    // Проверяем права администратора
    const authHeader = req.headers.get('Authorization')
    await checkAdminRole(authHeader, supabaseAdmin)

    // Get the request body
    const { name, email, password, platoon, squad, avatar_url, phone } = await req.json()

    // Validate required fields
    if (!name || !email || !password || !platoon || squad === undefined) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating cadet:', { name, email, platoon, squad })

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name,
        role: 'cadet'
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
    console.log('User created with ID:', userId)

    try {
      // 2. Create record in users table
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          email,
          name,
          role: 'cadet'
        }])

      if (userError) {
        console.error('Users table error:', userError)
        throw userError
      }

      console.log('User record created in users table')

      // 3. Create record in cadets table
      const { data: cadetData, error: cadetError } = await supabaseAdmin
        .from('cadets')
        .insert([{
          auth_user_id: userId,
          name,
          email,
          phone: phone || null,
          platoon,
          squad,
          avatar_url: avatar_url || null,
          rank: 999, // Temporary rank, will be updated by triggers
          total_score: 0,
          join_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (cadetError) {
        console.error('Cadets table error:', cadetError)
        throw cadetError
      }

      console.log('Cadet record created:', cadetData)

      // 4. Create initial scores for the cadet
      const { error: scoresError } = await supabaseAdmin
        .from('scores')
        .insert([{
          cadet_id: cadetData.id,
          study_score: 0,
          discipline_score: 0,
          events_score: 0
        }])

      if (scoresError) {
        console.error('Scores table error:', scoresError)
        // Note: We don't throw here as the cadet is already created
        // The scores can be added later manually if needed
      } else {
        console.log('Initial scores created for cadet')
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Кадет успешно создан',
          cadet: cadetData
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (error) {
      // Clean up auth user if something went wrong
      console.error('Error during cadet creation, cleaning up auth user:', error)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw error
    }

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