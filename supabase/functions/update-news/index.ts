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

  // Super admins always have permission
  if (userData.role === 'super_admin') {
    return user
  }

  // For regular admins, check specific permission
  try {
    const { data: hasPermission, error: permError } = await supabaseAdmin
      .rpc('user_has_permission', { 
        user_id: user.id, 
        permission_name: 'manage_news' 
      })

    if (permError) {
      console.error('Error checking manage_news permission:', permError)
      // If RPC doesn't exist, allow admin role
      if (userData.role === 'admin') {
        return user
      }
      throw new Error('Ошибка проверки прав доступа')
    }

    if (!hasPermission) {
      throw new Error('Недостаточно прав для управления новостями')
    }
  } catch (rpcError) {
    console.error('RPC error, falling back to role check:', rpcError)
    // Fallback to role-based check if RPC fails
    if (userData.role !== 'admin') {
      throw new Error('Недостаточно прав для управления новостями')
    }
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

    const { newsId, updates } = await req.json()

    if (!newsId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID новости' }),
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

    console.log('Updating news:', { newsId, updates })

    // Если устанавливается флаг главной новости, убираем его у других
    if (updates.is_main === true) {
      const { error: resetMainError } = await supabaseAdmin
        .from('news')
        .update({ is_main: false })
        .eq('is_main', true)
        .neq('id', newsId)

      if (resetMainError) {
        console.error('Error resetting main news flag:', resetMainError)
        // Не критично, продолжаем
      }
    }

    const { data: updatedNews, error: updateError } = await supabaseAdmin
      .from('news')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', newsId)
      .select()
      .single()

    if (updateError) {
      console.error('News update error:', updateError)
      throw new Error(`Ошибка обновления новости: ${updateError.message}`)
    }

    console.log('News updated successfully:', updatedNews)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Новость успешно обновлена',
        news: updatedNews
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