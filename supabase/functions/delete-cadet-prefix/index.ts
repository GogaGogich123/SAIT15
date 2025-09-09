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
        permission_name: 'manage_cadets' 
      })

    if (permError) {
      console.error('Error checking manage_cadets permission:', permError)
      // If RPC doesn't exist, allow admin role
      if (userData.role === 'admin') {
        return user
      }
      throw new Error('Ошибка проверки прав доступа')
    }

    if (!hasPermission) {
      throw new Error('Недостаточно прав для управления кадетами')
    }
  } catch (rpcError) {
    console.error('RPC error, falling back to role check:', rpcError)
    // Fallback to role-based check if RPC fails
    if (userData.role !== 'admin') {
      throw new Error('Недостаточно прав для управления кадетами')
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

    const { prefixId } = await req.json()

    // Validate required fields
    if (!prefixId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID префикса' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleting cadet prefix:', { prefixId })

    // Проверяем, что префикс существует
    const { data: existingPrefix, error: fetchError } = await supabaseAdmin
      .from('cadet_prefixes')
      .select('display_name')
      .eq('id', prefixId)
      .single()

    if (fetchError || !existingPrefix) {
      return new Response(
        JSON.stringify({ error: 'Префикс не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, не назначен ли префикс каким-либо кадетам
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('cadet_assigned_prefixes')
      .select('id')
      .eq('prefix_id', prefixId)
      .eq('is_active', true)
      .limit(1)

    if (assignmentError) {
      console.error('Error checking prefix assignments:', assignmentError)
      throw new Error(`Ошибка проверки назначений префикса: ${assignmentError.message}`)
    }

    if (assignments && assignments.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Нельзя удалить префикс, который назначен кадетам' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Удаляем префикс
    const { error: deleteError } = await supabaseAdmin
      .from('cadet_prefixes')
      .delete()
      .eq('id', prefixId)

    if (deleteError) {
      console.error('Prefix deletion error:', deleteError)
      throw new Error(`Ошибка удаления префикса: ${deleteError.message}`)
    }

    console.log('Prefix deleted successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Префикс "${existingPrefix.display_name}" успешно удален`
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