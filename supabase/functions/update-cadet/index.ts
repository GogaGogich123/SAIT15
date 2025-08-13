import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
}

// Функция для проверки роли администратора
async function checkAdminRole(authHeader: string | null, supabaseAdmin: any) {
  if (!authHeader) {
    throw new Error('Отсутствует токен авторизации')
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Проверяем токен и получаем пользователя
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Недействительный токен авторизации')
  }

  // Проверяем роль пользователя в таблице users
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
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

    // Проверяем права администратора
    const authHeader = req.headers.get('Authorization')
    await checkAdminRole(authHeader, supabaseAdmin)

    // Get the request body
    const { cadetId, updates } = await req.json()

    // Validate required fields
    if (!cadetId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует ID кадета' }),
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

    console.log('Updating cadet:', { cadetId, updates })

    // Получаем текущие данные кадета
    const { data: currentCadet, error: fetchError } = await supabaseAdmin
      .from('cadets')
      .select('auth_user_id, email, name')
      .eq('id', cadetId)
      .single()

    if (fetchError || !currentCadet) {
      return new Response(
        JSON.stringify({ error: 'Кадет не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Обновляем данные кадета
    const { data: updatedCadet, error: updateError } = await supabaseAdmin
      .from('cadets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', cadetId)
      .select()
      .single()

    if (updateError) {
      console.error('Cadet update error:', updateError)
      return new Response(
        JSON.stringify({ error: `Ошибка обновления кадета: ${updateError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Cadet updated successfully:', updatedCadet)

    // Если обновляется email или имя, обновляем также в таблице users
    if ((updates.email && updates.email !== currentCadet.email) || 
        (updates.name && updates.name !== currentCadet.name)) {
      
      const userUpdates: any = {}
      if (updates.email) userUpdates.email = updates.email
      if (updates.name) userUpdates.name = updates.name

      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', currentCadet.auth_user_id)

      if (userUpdateError) {
        console.error('User table update error:', userUpdateError)
        // Не критично, продолжаем
      } else {
        console.log('User table updated successfully')
      }

      // Обновляем метаданные пользователя в Auth, если изменилось имя
      if (updates.name && currentCadet.auth_user_id) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(currentCadet.auth_user_id, {
            user_metadata: { name: updates.name }
          })
          console.log('Auth user metadata updated successfully')
        } catch (authUpdateError) {
          console.error('Auth user metadata update error:', authUpdateError)
          // Не критично, продолжаем
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Кадет успешно обновлен',
        cadet: updatedCadet
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