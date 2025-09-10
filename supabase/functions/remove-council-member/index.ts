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

    const { memberId } = await req.json()

    // Validate required fields
    if (!memberId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID члена совета' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Removing council member:', { memberId })

    // Проверяем, что член совета существует
    const { data: existingMember, error: fetchError } = await supabaseAdmin
      .from('council_members')
      .select(`
        *,
        cadet:cadets(name),
        position:council_positions(display_name)
      `)
      .eq('id', memberId)
      .eq('is_active', true)
      .single()

    if (fetchError || !existingMember) {
      return new Response(
        JSON.stringify({ error: 'Член совета не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Деактивируем членство в совете
    const { error: removeError } = await supabaseAdmin
      .from('council_members')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)

    if (removeError) {
      console.error('Error removing council member:', removeError)
      throw new Error(`Ошибка исключения из совета: ${removeError.message}`)
    }

    // Удаляем связи в иерархии
    const { error: hierarchyError } = await supabaseAdmin
      .from('council_hierarchy')
      .delete()
      .or(`subordinate_id.eq.${memberId},superior_id.eq.${memberId}`)

    if (hierarchyError) {
      console.error('Error removing hierarchy relations:', hierarchyError)
      // Не критично, продолжаем
    }

    console.log('Council member removed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Кадет ${existingMember.cadet?.name} исключен из должности ${existingMember.position?.display_name}`
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