import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

    const { achievementId, updates } = await req.json()

    if (!achievementId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID достижения' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют данные для обновления' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Updating achievement:', { achievementId, updates })

    const { data: updatedAchievement, error: updateError } = await supabaseAdmin
      .from('achievements')
      .update(updates)
      .eq('id', achievementId)
      .select()
      .single()

    if (updateError) {
      console.error('Achievement update error:', updateError)
      throw new Error(`Ошибка обновления достижения: ${updateError.message}`)
    }

    console.log('Achievement updated successfully:', updatedAchievement)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Достижение успешно обновлено',
        achievement: updatedAchievement
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