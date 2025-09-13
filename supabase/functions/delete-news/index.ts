import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    const { newsId } = await req.json()

    if (!newsId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID новости' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleting news:', { newsId })

    // Проверяем, что новость существует
    const { data: existingNews, error: fetchError } = await supabaseAdmin
      .from('news')
      .select('title')
      .eq('id', newsId)
      .single()

    if (fetchError || !existingNews) {
      return new Response(
        JSON.stringify({ error: 'Новость не найдена' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Удаляем новость
    const { error: deleteError } = await supabaseAdmin
      .from('news')
      .delete()
      .eq('id', newsId)

    if (deleteError) {
      console.error('News deletion error:', deleteError)
      throw new Error(`Ошибка удаления новости: ${deleteError.message}`)
    }

    console.log('News deleted successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Новость "${existingNews.title}" успешно удалена`
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