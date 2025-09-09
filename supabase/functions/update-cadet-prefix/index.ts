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

    const { prefixId, updates } = await req.json()

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

    if (!updates || Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют данные для обновления' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Updating cadet prefix:', { prefixId, updates })

    // Проверяем, что префикс существует
    const { data: existingPrefix, error: fetchError } = await supabaseAdmin
      .from('cadet_prefixes')
      .select('*')
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

    // Если обновляется имя, проверяем уникальность
    if (updates.name && updates.name !== existingPrefix.name) {
      const { data: nameCheck, error: nameError } = await supabaseAdmin
        .from('cadet_prefixes')
        .select('id')
        .eq('name', updates.name)
        .neq('id', prefixId)
        .maybeSingle()

      if (nameError) {
        console.error('Error checking name uniqueness:', nameError)
        throw new Error(`Ошибка проверки уникальности имени: ${nameError.message}`)
      }

      if (nameCheck) {
        return new Response(
          JSON.stringify({ error: 'Префикс с таким именем уже существует' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Обновляем префикс
    const { data: updatedPrefix, error: updateError } = await supabaseAdmin
      .from('cadet_prefixes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', prefixId)
      .select()
      .single()

    if (updateError) {
      console.error('Prefix update error:', updateError)
      throw new Error(`Ошибка обновления префикса: ${updateError.message}`)
    }

    console.log('Prefix updated successfully:', updatedPrefix)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Префикс успешно обновлен',
        prefix: updatedPrefix
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