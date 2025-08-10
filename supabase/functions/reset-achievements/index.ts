import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
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

    console.log('Resetting achievements...')

    // Удаляем награды кадетов
    const { error: cadetAchievementsError } = await supabaseAdmin
      .from('cadet_achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (cadetAchievementsError) {
      console.error('Error deleting cadet achievements:', cadetAchievementsError)
      throw new Error(`Ошибка удаления наград кадетов: ${cadetAchievementsError.message}`)
    }

    // Удаляем достижения
    const { error: achievementsError } = await supabaseAdmin
      .from('achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (achievementsError) {
      console.error('Error deleting achievements:', achievementsError)
      throw new Error(`Ошибка удаления достижений: ${achievementsError.message}`)
    }

    // Удаляем автоматические достижения
    const { error: autoAchievementsError } = await supabaseAdmin
      .from('auto_achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (autoAchievementsError) {
      console.error('Error deleting auto achievements:', autoAchievementsError)
      throw new Error(`Ошибка удаления автоматических достижений: ${autoAchievementsError.message}`)
    }

    console.log('Achievements reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Все достижения успешно удалены'
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