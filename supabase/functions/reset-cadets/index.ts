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
    const currentUser = await checkAdminRole(authHeader, supabaseAdmin)

    console.log('Resetting all cadets...')

    // Получаем всех кадетов с их auth_user_id
    const { data: cadets, error: fetchError } = await supabaseAdmin
      .from('cadets')
      .select('id, auth_user_id, name')

    if (fetchError) {
      console.error('Error fetching cadets:', fetchError)
      throw new Error(`Ошибка получения списка кадетов: ${fetchError.message}`)
    }

    console.log(`Found ${cadets?.length || 0} cadets to delete`)

    // Удаляем всех кадетов (каскадное удаление удалит связанные записи)
    const { error: deleteCadetsError } = await supabaseAdmin
      .from('cadets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteCadetsError) {
      console.error('Error deleting cadets:', deleteCadetsError)
      throw new Error(`Ошибка удаления кадетов: ${deleteCadetsError.message}`)
    }

    console.log('All cadets deleted from database')

    // Удаляем пользователей-кадетов из auth.users
    if (cadets && cadets.length > 0) {
      for (const cadet of cadets) {
        if (cadet.auth_user_id && cadet.auth_user_id !== currentUser.id) {
          try {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(cadet.auth_user_id)
            
            if (authDeleteError) {
              console.error(`Error deleting auth user for cadet ${cadet.name}:`, authDeleteError)
            } else {
              console.log(`Auth user deleted for cadet: ${cadet.name}`)
            }
          } catch (authError) {
            console.error(`Failed to delete auth user for cadet ${cadet.name}:`, authError)
          }
        }
      }
    }

    // Удаляем пользователей-кадетов из таблицы users
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('role', 'cadet')

    if (usersError) {
      console.error('Error deleting cadet users:', usersError)
      // Не критично, продолжаем
    } else {
      console.log('Cadet users deleted from users table')
    }

    console.log('All cadets reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Все кадеты (${cadets?.length || 0}) успешно удалены`
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