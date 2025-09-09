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

    const { cadetId, prefixId } = await req.json()

    // Validate required fields
    if (!cadetId || !prefixId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Assigning prefix to cadet:', { cadetId, prefixId })

    // Проверяем, что кадет существует
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

    // Проверяем, что префикс существует и активен
    const { data: prefix, error: prefixError } = await supabaseAdmin
      .from('cadet_prefixes')
      .select('display_name')
      .eq('id', prefixId)
      .eq('is_active', true)
      .single()

    if (prefixError || !prefix) {
      return new Response(
        JSON.stringify({ error: 'Префикс не найден или неактивен' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, не назначен ли уже этот префикс кадету
    const { data: existingAssignment, error: checkError } = await supabaseAdmin
      .from('cadet_assigned_prefixes')
      .select('id')
      .eq('cadet_id', cadetId)
      .eq('prefix_id', prefixId)
      .eq('is_active', true)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing assignment:', checkError)
      throw new Error(`Ошибка проверки существующего назначения: ${checkError.message}`)
    }

    if (existingAssignment) {
      return new Response(
        JSON.stringify({ error: 'Этот префикс уже назначен данному кадету' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Назначаем префикс кадету
    const { data: newAssignment, error: assignError } = await supabaseAdmin
      .from('cadet_assigned_prefixes')
      .insert([{
        cadet_id: cadetId,
        prefix_id: prefixId,
        assigned_by: adminUser.id,
        is_active: true
      }])
      .select()
      .single()

    if (assignError) {
      console.error('Error assigning prefix:', assignError)
      throw new Error(`Ошибка назначения префикса: ${assignError.message}`)
    }

    console.log('Prefix assigned successfully:', newAssignment)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Префикс "${prefix.display_name}" успешно назначен кадету ${cadet.name}`,
        assignment: newAssignment
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