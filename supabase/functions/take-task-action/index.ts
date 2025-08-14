import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Функция для проверки авторизации
async function checkAuthentication(authHeader: string | null, supabaseAdmin: any) {
  if (!authHeader) {
    throw new Error('Отсутствует токен авторизации')
  }

  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Недействительный токен авторизации')
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
    const user = await checkAuthentication(authHeader, supabaseAdmin)

    const { taskId, cadetId } = await req.json()

    // Validate required fields
    if (!taskId || !cadetId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Taking task:', { taskId, cadetId })

    // Проверяем, что задание существует и активно
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('status', 'active')
      .eq('is_active', true)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Задание не найдено или неактивно' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, что кадет существует
    const { data: cadet, error: cadetError } = await supabaseAdmin
      .from('cadets')
      .select('name')
      .eq('id', cadetId)
      .single()

    if (cadetError || !cadet) {
      return new Response(
        JSON.stringify({ error: 'Кадет не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, не взял ли уже кадет это задание
    const { data: existingSubmission, error: checkError } = await supabaseAdmin
      .from('task_submissions')
      .select('id')
      .eq('task_id', taskId)
      .eq('cadet_id', cadetId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing submission:', checkError)
      throw new Error(`Ошибка проверки существующей сдачи: ${checkError.message}`)
    }

    if (existingSubmission) {
      return new Response(
        JSON.stringify({ error: 'Вы уже взяли это задание' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем лимит участников
    if (task.max_participants > 0 && task.current_participants >= task.max_participants) {
      return new Response(
        JSON.stringify({ error: 'Достигнуто максимальное количество участников' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Создаем сдачу задания
    const { data: newSubmission, error: submissionError } = await supabaseAdmin
      .from('task_submissions')
      .insert([{
        task_id: taskId,
        cadet_id: cadetId,
        status: 'taken',
        submission_text: ''
      }])
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating task submission:', submissionError)
      throw new Error(`Ошибка создания сдачи задания: ${submissionError.message}`)
    }

    // Увеличиваем счетчик участников
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({ 
        current_participants: task.current_participants + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      console.error('Error updating task participants count:', updateError)
      // Откатываем создание сдачи
      await supabaseAdmin
        .from('task_submissions')
        .delete()
        .eq('id', newSubmission.id)
      
      throw new Error(`Ошибка обновления счетчика участников: ${updateError.message}`)
    }

    console.log('Task taken successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Задание "${task.title}" успешно взято`,
        submission: newSubmission
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
    const statusCode = errorMessage.includes('токен') || errorMessage.includes('авторизации') ? 401 : 500
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})