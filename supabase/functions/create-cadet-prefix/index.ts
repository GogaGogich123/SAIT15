import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { name, display_name, description, color, sort_order } = await req.json()

    // Validate required fields
    if (!name || !display_name || !color) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating cadet prefix:', { name, display_name, color })

    // Проверяем, не существует ли уже префикс с таким именем
    const { data: existingPrefix, error: checkError } = await supabaseAdmin
      .from('cadet_prefixes')
      .select('id')
      .eq('name', name)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing prefix:', checkError)
      throw new Error(`Ошибка проверки существующего префикса: ${checkError.message}`)
    }

    if (existingPrefix) {
      return new Response(
        JSON.stringify({ error: 'Префикс с таким именем уже существует' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Создаем новый префикс
    const { data: newPrefix, error: createError } = await supabaseAdmin
      .from('cadet_prefixes')
      .insert([{
        name,
        display_name,
        description: description || null,
        color,
        sort_order: sort_order || 0,
        is_active: true
      }])
      .select()
      .single()

    if (createError) {
      console.error('Prefix creation error:', createError)
      throw new Error(`Ошибка создания префикса: ${createError.message}`)
    }

    console.log('Prefix created successfully:', newPrefix)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Префикс успешно создан',
        prefix: newPrefix
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