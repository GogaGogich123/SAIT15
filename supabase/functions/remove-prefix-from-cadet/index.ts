import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    console.log('Removing prefix from cadet:', { cadetId, prefixId })

    // Проверяем, что назначение существует
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('cadet_assigned_prefixes')
      .select(`
        *,
        cadet:cadets(name),
        prefix:cadet_prefixes(display_name)
      `)
      .eq('cadet_id', cadetId)
      .eq('prefix_id', prefixId)
      .eq('is_active', true)
      .single()

    if (fetchError || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Назначение префикса не найдено' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Деактивируем назначение префикса
    const { error: removeError } = await supabaseAdmin
      .from('cadet_assigned_prefixes')
      .update({ is_active: false })
      .eq('id', assignment.id)

    if (removeError) {
      console.error('Error removing prefix assignment:', removeError)
      throw new Error(`Ошибка удаления назначения префикса: ${removeError.message}`)
    }

    console.log('Prefix assignment removed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Префикс "${assignment.prefix?.display_name}" успешно удален у кадета ${assignment.cadet?.name}`
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