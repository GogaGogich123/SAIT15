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
    const currentUser = await checkAdminRole(authHeader, supabaseAdmin)

    console.log('Performing FULL RESET of all data...')

    // КРИТИЧЕСКИ ВАЖНО: Удаляем данные в правильном порядке из-за внешних ключей

    // 1. Удаляем сообщения форума
    const { error: postsError } = await supabaseAdmin
      .from('forum_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (postsError) {
      console.error('Error deleting forum posts:', postsError)
      throw new Error(`Ошибка удаления сообщений форума: ${postsError.message}`)
    }

    // 2. Удаляем темы форума
    const { error: topicsError } = await supabaseAdmin
      .from('forum_topics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (topicsError) {
      console.error('Error deleting forum topics:', topicsError)
      throw new Error(`Ошибка удаления тем форума: ${topicsError.message}`)
    }

    // 3. Удаляем категории форума
    const { error: categoriesError } = await supabaseAdmin
      .from('forum_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (categoriesError) {
      console.error('Error deleting forum categories:', categoriesError)
      throw new Error(`Ошибка удаления категорий форума: ${categoriesError.message}`)
    }

    // 4. Удаляем участников событий
    const { error: participantsError } = await supabaseAdmin
      .from('event_participants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (participantsError) {
      console.error('Error deleting event participants:', participantsError)
      throw new Error(`Ошибка удаления участников событий: ${participantsError.message}`)
    }

    // 5. Удаляем события
    const { error: eventsError } = await supabaseAdmin
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (eventsError) {
      console.error('Error deleting events:', eventsError)
      throw new Error(`Ошибка удаления событий: ${eventsError.message}`)
    }

    // 6. Удаляем сдачи заданий
    const { error: submissionsError } = await supabaseAdmin
      .from('task_submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (submissionsError) {
      console.error('Error deleting task submissions:', submissionsError)
      throw new Error(`Ошибка удаления сдач заданий: ${submissionsError.message}`)
    }

    // 7. Удаляем задания
    const { error: tasksError } = await supabaseAdmin
      .from('tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (tasksError) {
      console.error('Error deleting tasks:', tasksError)
      throw new Error(`Ошибка удаления заданий: ${tasksError.message}`)
    }

    // 8. Удаляем новости
    const { error: newsError } = await supabaseAdmin
      .from('news')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (newsError) {
      console.error('Error deleting news:', newsError)
      throw new Error(`Ошибка удаления новостей: ${newsError.message}`)
    }

    // 9. Удаляем награды кадетов
    const { error: cadetAchievementsError } = await supabaseAdmin
      .from('cadet_achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (cadetAchievementsError) {
      console.error('Error deleting cadet achievements:', cadetAchievementsError)
      throw new Error(`Ошибка удаления наград кадетов: ${cadetAchievementsError.message}`)
    }

    // 10. Удаляем достижения
    const { error: achievementsError } = await supabaseAdmin
      .from('achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (achievementsError) {
      console.error('Error deleting achievements:', achievementsError)
      throw new Error(`Ошибка удаления достижений: ${achievementsError.message}`)
    }

    // 11. Удаляем автоматические достижения
    const { error: autoAchievementsError } = await supabaseAdmin
      .from('auto_achievements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (autoAchievementsError) {
      console.error('Error deleting auto achievements:', autoAchievementsError)
      throw new Error(`Ошибка удаления автоматических достижений: ${autoAchievementsError.message}`)
    }

    // 12. Удаляем историю баллов
    const { error: historyError } = await supabaseAdmin
      .from('score_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (historyError) {
      console.error('Error deleting score history:', historyError)
      throw new Error(`Ошибка удаления истории баллов: ${historyError.message}`)
    }

    // 13. Удаляем баллы
    const { error: scoresError } = await supabaseAdmin
      .from('scores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (scoresError) {
      console.error('Error deleting scores:', scoresError)
      throw new Error(`Ошибка удаления баллов: ${scoresError.message}`)
    }

    // 14. Удаляем кадетов
    const { error: cadetsError } = await supabaseAdmin
      .from('cadets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (cadetsError) {
      console.error('Error deleting cadets:', cadetsError)
      throw new Error(`Ошибка удаления кадетов: ${cadetsError.message}`)
    }

    // 15. Удаляем пользователей из public.users
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .neq('id', currentUser.id) // Не удаляем текущего администратора

    if (usersError) {
      console.error('Error deleting users:', usersError)
      throw new Error(`Ошибка удаления пользователей: ${usersError.message}`)
    }

    // 16. КРИТИЧЕСКИ ВАЖНО: Удаляем всех пользователей из auth.users (кроме текущего админа)
    console.log('Deleting all users from auth.users except current admin...')
    
    // Получаем всех пользователей из auth
    const { data: authUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing auth users:', listUsersError)
      throw new Error(`Ошибка получения списка пользователей: ${listUsersError.message}`)
    }

    // Удаляем всех пользователей кроме текущего администратора
    const usersToDelete = authUsers.users.filter(user => user.id !== currentUser.id)
    
    for (const user of usersToDelete) {
      try {
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (deleteUserError) {
          console.error(`Error deleting auth user ${user.id}:`, deleteUserError)
          // Продолжаем удаление других пользователей даже если один не удалился
        } else {
          console.log(`Auth user ${user.id} deleted successfully`)
        }
      } catch (userDeleteError) {
        console.error(`Failed to delete auth user ${user.id}:`, userDeleteError)
        // Продолжаем удаление других пользователей
      }
    }

    console.log('Full reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Полный сброс системы выполнен успешно. Все данные удалены, включая пользователей из auth.users.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error during full reset:', error)
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