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

  if (userData.role !== 'admin' && userData.role !== 'super_admin') {
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
    const adminUser = await checkAdminRole(authHeader, supabaseAdmin)

    const { cadet_id, position_id, staff_id, notes } = await req.json()

    // Validate required fields
    if (!cadet_id || !position_id) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Appointing council member:', { cadet_id, position_id, staff_id })

    // Проверяем, что кадет существует
    const { data: cadet, error: cadetError } = await supabaseAdmin
      .from('cadets')
      .select('name')
      .eq('id', cadet_id)
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

    // Проверяем, что должность существует
    const { data: position, error: positionError } = await supabaseAdmin
      .from('council_positions')
      .select('display_name, level')
      .eq('id', position_id)
      .eq('is_active', true)
      .single()

    if (positionError || !position) {
      return new Response(
        JSON.stringify({ error: 'Должность не найдена или неактивна' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Если должность требует штаб (уровень >= 2), проверяем штаб
    if (position.level >= 2) {
      if (!staff_id) {
        return new Response(
          JSON.stringify({ error: 'Для этой должности необходимо указать штаб' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: staff, error: staffError } = await supabaseAdmin
        .from('council_staffs')
        .select('display_name')
        .eq('id', staff_id)
        .eq('is_active', true)
        .single()

      if (staffError || !staff) {
        return new Response(
          JSON.stringify({ error: 'Штаб не найден или неактивен' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Проверяем, не назначен ли уже кадет на эту должность в этом штабе
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from('council_members')
      .select('id')
      .eq('cadet_id', cadet_id)
      .eq('position_id', position_id)
      .eq('staff_id', staff_id || null)
      .eq('is_active', true)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing member:', checkError)
      throw new Error(`Ошибка проверки существующего назначения: ${checkError.message}`)
    }

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'Кадет уже назначен на эту должность' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Для уникальных должностей (атаман, зам атамана) проверяем, что нет других назначений
    if (position.level <= 1) {
      const { data: existingAtPosition, error: uniqueError } = await supabaseAdmin
        .from('council_members')
        .select('id')
        .eq('position_id', position_id)
        .eq('is_active', true)
        .maybeSingle()

      if (uniqueError) {
        console.error('Error checking unique position:', uniqueError)
        throw new Error(`Ошибка проверки уникальной должности: ${uniqueError.message}`)
      }

      if (existingAtPosition) {
        return new Response(
          JSON.stringify({ error: 'На эту должность уже назначен другой кадет' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Назначаем кадета
    const { data: newMember, error: appointError } = await supabaseAdmin
      .from('council_members')
      .insert([{
        cadet_id,
        position_id,
        staff_id: staff_id || null,
        appointed_by: adminUser.id,
        notes: notes || null,
        is_active: true
      }])
      .select(`
        *,
        cadet:cadets(name, display_name, avatar_url, platoon, squad, rank),
        position:council_positions(*),
        staff:council_staffs(*)
      `)
      .single()

    if (appointError) {
      console.error('Error appointing council member:', appointError)
      throw new Error(`Ошибка назначения в совет: ${appointError.message}`)
    }

    console.log('Council member appointed successfully:', newMember)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Кадет ${cadet.name} успешно назначен на должность ${position.display_name}`,
        member: newMember
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