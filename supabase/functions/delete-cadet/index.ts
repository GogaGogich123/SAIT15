import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
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
    const { cadetId } = await req.json()

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

    console.log('Deleting cadet:', { cadetId })

    // Получаем auth_user_id перед удалением
    const { data: cadet, error: fetchError } = await supabaseAdmin
      .from('cadets')
      .select('auth_user_id, name')
      .eq('id', cadetId)
      .single()

    if (fetchError || !cadet) {
      return new Response(
        JSON.stringify({ error: 'Кадет не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found cadet to delete:', cadet)

    // Удаляем кадета (каскадное удаление удалит связанные записи)
    const { error: deleteError } = await supabaseAdmin
      .from('cadets')
      .delete()
      .eq('id', cadetId)

    if (deleteError) {
      console.error('Cadet deletion error:', deleteError)
      return new Response(
        JSON.stringify({ error: `Ошибка удаления кадета: ${deleteError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Cadet deleted from database')

    // Удаляем пользователя из Auth (если есть auth_user_id)
    if (cadet.auth_user_id) {
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(cadet.auth_user_id)
        
        if (authDeleteError) {
          console.error('Auth user deletion error:', authDeleteError)
          // Не критично, кадет уже удален из базы
        } else {
          console.log('Auth user deleted successfully')
        }
      } catch (authError) {
        console.error('Auth deletion failed:', authError)
        // Не критично, продолжаем
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Кадет "${cadet.name}" успешно удален`
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