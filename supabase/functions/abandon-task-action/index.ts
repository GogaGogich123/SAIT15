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

    console.log('Abandoning task:', { taskId, cadetId })

    // Проверяем, что задание существует
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Задание не найдено' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем, что кадет взял это задание
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('task_submissions')
      .select('*')
      .eq('task_id', taskId)
      .eq('cadet_id', cadetId)
      .eq('status', 'taken')
      .single()

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Сдача задания не найдена или задание уже сдано' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Применяем штраф за отказ, если он есть
    if (task.abandon_penalty > 0) {
      // 1. Добавляем запись в историю баллов со штрафом
      const { error: penaltyError } = await supabaseAdmin
        .from('score_history')
        .insert([{
          cadet_id: cadetId,
          category: task.category,
          points: -task.abandon_penalty,
          description: `Штраф за отказ от задания: ${task.title}`,
          awarded_by: null
        }])

      if (penaltyError) {
        console.error('Error applying abandon penalty:', penaltyError)
        throw new Error(`Ошибка применения штрафа: ${penaltyError.message}`)
      } else {
        console.log('Abandon penalty applied:', task.abandon_penalty)
      }

      // 2. Получаем текущие баллы кадета
      const { data: currentScores, error: fetchScoresError } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('cadet_id', cadetId)
        .maybeSingle()

      if (fetchScoresError && fetchScoresError.code !== 'PGRST116') {
        console.error('Error fetching current scores:', fetchScoresError)
        throw new Error(`Ошибка получения текущих баллов: ${fetchScoresError.message}`)
      }

      // 3. Вычисляем новые баллы с учетом штрафа
      const newScores = {
        study_score: currentScores?.study_score || 0,
        discipline_score: currentScores?.discipline_score || 0,
        events_score: currentScores?.events_score || 0
      }

      // Вычитаем штраф из соответствующей категории
      if (task.category === 'study') {
        newScores.study_score = Math.max(0, newScores.study_score - task.abandon_penalty)
      } else if (task.category === 'discipline') {
        newScores.discipline_score = Math.max(0, newScores.discipline_score - task.abandon_penalty)
      } else if (task.category === 'events') {
        newScores.events_score = Math.max(0, newScores.events_score - task.abandon_penalty)
      }

      const totalScore = newScores.study_score + newScores.discipline_score + newScores.events_score

      console.log('Calculated new scores after penalty:', { ...newScores, totalScore })

      // 4. Обновляем или создаем запись в таблице scores
      if (currentScores) {
        const { error: updateScoresError } = await supabaseAdmin
          .from('scores')
          .update({
            ...newScores,
            updated_at: new Date().toISOString()
          })
          .eq('cadet_id', cadetId)

        if (updateScoresError) {
          console.error('Error updating scores after penalty:', updateScoresError)
          throw new Error(`Ошибка обновления баллов после штрафа: ${updateScoresError.message}`)
        }
      } else {
        const { error: insertScoresError } = await supabaseAdmin
          .from('scores')
          .insert([{
            cadet_id: cadetId,
            ...newScores
          }])

        if (insertScoresError) {
          console.error('Error inserting scores after penalty:', insertScoresError)
          throw new Error(`Ошибка создания баллов после штрафа: ${insertScoresError.message}`)
        }
      }

      console.log('Scores updated successfully after penalty application')

      // 5. Обновляем общий балл кадета (триггеры базы данных должны это сделать автоматически, но делаем явно для надежности)
      const { error: updateCadetError } = await supabaseAdmin
        .from('cadets')
        .update({
          total_score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', cadetId)

      if (updateCadetError) {
        console.error('Error updating cadet total score after penalty:', updateCadetError)
        // Не критично, так как триггеры должны это сделать
      } else {
        console.log('Cadet total score updated after penalty application')
      }
    }

    // Удаляем сдачу задания
    const { error: deleteError } = await supabaseAdmin
      .from('task_submissions')
      .delete()
      .eq('id', submission.id)

    if (deleteError) {
      console.error('Error deleting task submission:', deleteError)
      throw new Error(`Ошибка удаления сдачи задания: ${deleteError.message}`)
    }

    // Уменьшаем счетчик участников
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({ 
        current_participants: Math.max(0, task.current_participants - 1),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      console.error('Error updating task participants count:', updateError)
      throw new Error(`Ошибка обновления счетчика участников: ${updateError.message}`)
    }

    console.log('Task abandoned successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Отказ от задания "${task.title}" зафиксирован${task.abandon_penalty > 0 ? `. Применен штраф: ${task.abandon_penalty} баллов` : ''}`,
        penaltyApplied: task.abandon_penalty
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