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
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Недействительный токен авторизации')
  }

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
    const currentUser = await checkAdminRole(authHeader, supabaseAdmin)

    // Get the request body
    const { platoon } = await req.json()

    // Validate required fields
    if (!platoon) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует номер взвода' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Resetting cadets by platoon:', platoon)

    // Получаем кадетов из указанного взвода
    const { data: cadets, error: fetchError } = await supabaseAdmin
      .from('cadets')
      .select('id, auth_user_id, name')
      .eq('platoon', platoon)

    if (fetchError) {
      console.error('Error fetching cadets by platoon:', fetchError)
      throw new Error(`Ошибка получения кадетов взвода: ${fetchError.message}`)
    }

    console.log(`Found ${cadets?.length || 0} cadets in platoon ${platoon}`)

    if (!cadets || cadets.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Во взводе ${platoon} нет кадетов для удаления`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Удаляем кадетов из указанного взвода
    const { error: deleteCadetsError } = await supabaseAdmin
      .from('cadets')
      .delete()
      .eq('platoon', platoon)

    if (deleteCadetsError) {
      console.error('Error deleting cadets by platoon:', deleteCadetsError)
      throw new Error(`Ошибка удаления кадетов взвода: ${deleteCadetsError.message}`)
    }

    console.log(`Cadets from platoon ${platoon} deleted from database`)

    // Удаляем пользователей-кадетов из auth.users
    for (const cadet of cadets) {
      if (cadet.auth_user_id && cadet.auth_user_id !== currentUser.id) {
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(cadet.auth_user_id)
          
          if (authDeleteError) {
            console.error(`Error deleting auth user for cadet ${cadet.name}:`, authDeleteError)
          } else {
            console.log(`Auth user deleted for cadet: ${cadet.name}`)
          }
        } catch (authError) {
          console.error(`Failed to delete auth user for cadet ${cadet.name}:`, authError)
        }
      }
    }

    // Удаляем пользователей-кадетов из таблицы users
    const authUserIds = cadets
      .filter(cadet => cadet.auth_user_id && cadet.auth_user_id !== currentUser.id)
      .map(cadet => cadet.auth_user_id)

    if (authUserIds.length > 0) {
      const { error: usersError } = await supabaseAdmin
        .from('users')
        .delete()
        .in('id', authUserIds)

      if (usersError) {
        console.error('Error deleting cadet users:', usersError)
        // Не критично, продолжаем
      } else {
        console.log('Cadet users deleted from users table')
      }
    }

    console.log(`Platoon ${platoon} reset completed successfully`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Все кадеты из ${platoon} взвода (${cadets.length}) успешно удалены`
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