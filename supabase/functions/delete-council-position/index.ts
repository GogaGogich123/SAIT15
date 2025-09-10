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

    const { positionId } = await req.json()

    // Validate required fields
    if (!positionId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID должности' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleting council position:', { positionId })

    // Проверяем, что должность существует
    const { data: existingPosition, error: fetchError } = await supabaseAdmin
      .from('council_positions')
      .select('display_name')
      .eq('id', positionId)
      .single()

    if (fetchError || !existingPosition) {
      return new Response(
        JSON.stringify({ error: 'Должность не найдена' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, не назначен ли кто-то на эту должность
    const { data: assignedMembers, error: checkError } = await supabaseAdmin
      .from('council_members')
      .select('id')
      .eq('position_id', positionId)
      .eq('is_active', true)
      .limit(1)

    if (checkError) {
      console.error('Error checking assigned members:', checkError)
      throw new Error(`Ошибка проверки назначений: ${checkError.message}`)
    }

    if (assignedMembers && assignedMembers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Нельзя удалить должность, на которую назначены кадеты' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Удаляем должность
    const { error: deleteError } = await supabaseAdmin
      .from('council_positions')
      .delete()
      .eq('id', positionId)

    if (deleteError) {
      console.error('Error deleting council position:', deleteError)
      throw new Error(`Ошибка удаления должности: ${deleteError.message}`)
    }

    console.log('Council position deleted successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Должность "${existingPosition.display_name}" успешно удалена`
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