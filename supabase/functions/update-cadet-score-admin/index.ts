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

  if (userData.role !== 'admin' && userData.role !== 'super_admin') {
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
    const adminUser = await checkAdminRole(authHeader, supabaseAdmin)

    // Get the request body
    const { cadetId, category, points, description } = await req.json()

    // Validate required fields
    if (!cadetId || !category || points === undefined || !description) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!['study', 'discipline', 'events'].includes(category)) {
      return new Response(
        JSON.stringify({ error: 'Неверная категория баллов' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Проверяем разрешения для конкретной категории баллов
    const requiredPermissions = {
      study: ['manage_scores_study', 'manage_scores'],
      discipline: ['manage_scores_discipline', 'manage_scores'],
      events: ['manage_scores_events', 'manage_scores']
    }

    const categoryPermissions = requiredPermissions[category as keyof typeof requiredPermissions]
    
    // Проверяем, есть ли у пользователя нужные разрешения
    let hasPermission = false
    
    for (const permission of categoryPermissions) {
      // Проверяем прямые разрешения
      const { data: directPerm, error: directError } = await supabaseAdmin
        .from('user_permissions')
        .select(`
          permission:admin_permissions!inner(name)
        `)
        .eq('user_id', adminUser.id)
        .eq('is_active', true)
        .eq('permission.name', permission)
        .limit(1)

      if (!directError && directPerm && directPerm.length > 0) {
        hasPermission = true
        break
      }

      // Проверяем разрешения через роли
      const { data: rolePerm, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select(`
          role:admin_roles!inner(
            role_permissions!inner(
              permission:admin_permissions!inner(name)
            )
          )
        `)
        .eq('user_id', adminUser.id)
        .eq('is_active', true)
        .eq('role.role_permissions.permission.name', permission)
        .limit(1)

      if (!roleError && rolePerm && rolePerm.length > 0) {
        hasPermission = true
        break
      }
    }

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: `Недостаточно прав для управления баллами категории "${category}"` }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Updating cadet scores:', { cadetId, category, points, description })

    // 1. Добавляем запись в историю баллов
    const { error: historyError } = await supabaseAdmin
      .from('score_history')
      .insert([{
        cadet_id: cadetId,
        category,
        points,
        description,
        awarded_by: adminUser.id
      }])

    if (historyError) {
      console.error('Error adding score history:', historyError)
      throw new Error(`Ошибка добавления истории баллов: ${historyError.message}`)
    }

    console.log('Score history added successfully')

    // 2. Получаем текущие баллы кадета
    const { data: currentScores, error: fetchError } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('cadet_id', cadetId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current scores:', fetchError)
      throw new Error(`Ошибка получения текущих баллов: ${fetchError.message}`)
    }

    // 3. Вычисляем новые баллы
    const newScores = {
      study_score: currentScores?.study_score || 0,
      discipline_score: currentScores?.discipline_score || 0,
      events_score: currentScores?.events_score || 0
    }

    // Обновляем баллы по категории
    if (category === 'study') {
      newScores.study_score = Math.max(0, newScores.study_score + points)
    } else if (category === 'discipline') {
      newScores.discipline_score = Math.max(0, newScores.discipline_score + points)
    } else if (category === 'events') {
      newScores.events_score = Math.max(0, newScores.events_score + points)
    }

    const totalScore = newScores.study_score + newScores.discipline_score + newScores.events_score

    console.log('Calculated new scores:', { ...newScores, totalScore })

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
        console.error('Error updating scores:', updateScoresError)
        throw new Error(`Ошибка обновления баллов: ${updateScoresError.message}`)
      }
    } else {
      const { error: insertScoresError } = await supabaseAdmin
        .from('scores')
        .insert([{
          cadet_id: cadetId,
          ...newScores
        }])

      if (insertScoresError) {
        console.error('Error inserting scores:', insertScoresError)
        throw new Error(`Ошибка создания баллов: ${insertScoresError.message}`)
      }
    }

    console.log('Scores table updated successfully')

    // 5. Обновляем общий балл кадета
    const { error: updateCadetError } = await supabaseAdmin
      .from('cadets')
      .update({
        total_score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', cadetId)

    if (updateCadetError) {
      console.error('Error updating cadet total score:', updateCadetError)
      throw new Error(`Ошибка обновления общего балла кадета: ${updateCadetError.message}`)
    }

    console.log('Cadet total score updated successfully')

    // 6. Получаем обновленные данные кадета для ответа
    const { data: updatedCadet, error: fetchUpdatedError } = await supabaseAdmin
      .from('cadets')
      .select('*')
      .eq('id', cadetId)
      .single()

    if (fetchUpdatedError) {
      console.error('Error fetching updated cadet:', fetchUpdatedError)
      throw new Error(`Ошибка получения обновленных данных кадета: ${fetchUpdatedError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Баллы успешно начислены. Новый общий балл: ${totalScore}`,
        cadet: updatedCadet,
        scores: newScores
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