import { createClient } from 'npm:@supabase/supabase-js@2'

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
    await checkAdminRole(authHeader, supabaseAdmin)

    console.log('Resetting forum...')

    // Удаляем сообщения форума
    const { error: postsError } = await supabaseAdmin
      .from('forum_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (postsError) {
      console.error('Error deleting forum posts:', postsError)
      throw new Error(`Ошибка удаления сообщений форума: ${postsError.message}`)
    }

    // Удаляем темы форума
    const { error: topicsError } = await supabaseAdmin
      .from('forum_topics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (topicsError) {
      console.error('Error deleting forum topics:', topicsError)
      throw new Error(`Ошибка удаления тем форума: ${topicsError.message}`)
    }

    // Удаляем категории форума
    const { error: categoriesError } = await supabaseAdmin
      .from('forum_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (categoriesError) {
      console.error('Error deleting forum categories:', categoriesError)
      throw new Error(`Ошибка удаления категорий форума: ${categoriesError.message}`)
    }

    console.log('Forum reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Все данные форума успешно удалены'
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