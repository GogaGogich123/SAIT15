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
    await checkAdminRole(authHeader, supabaseAdmin)

    console.log('Resetting scores and score history...')

    // Удаляем историю баллов
    const { error: historyError } = await supabaseAdmin
      .from('score_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (historyError) {
      console.error('Error deleting score history:', historyError)
      throw new Error(`Ошибка удаления истории баллов: ${historyError.message}`)
    }

    // Сбрасываем баллы кадетов
    const { error: scoresError } = await supabaseAdmin
      .from('scores')
      .update({
        study_score: 0,
        discipline_score: 0,
        events_score: 0,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (scoresError) {
      console.error('Error resetting scores:', scoresError)
      throw new Error(`Ошибка сброса баллов: ${scoresError.message}`)
    }

    // Сбрасываем общие баллы кадетов
    const { error: cadetsError } = await supabaseAdmin
      .from('cadets')
      .update({
        total_score: 0,
        rank: 999,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (cadetsError) {
      console.error('Error resetting cadet scores:', cadetsError)
      throw new Error(`Ошибка сброса баллов кадетов: ${cadetsError.message}`)
    }

    console.log('Scores reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Все баллы успешно сброшены'
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