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

    const { name, display_name, description, color, icon, sort_order } = await req.json()

    // Validate required fields
    if (!name || !display_name) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating council staff:', { name, display_name })

    // Проверяем уникальность имени
    const { data: existingStaff, error: checkError } = await supabaseAdmin
      .from('council_staffs')
      .select('id')
      .eq('name', name)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing staff:', checkError)
      throw new Error(`Ошибка проверки существующего штаба: ${checkError.message}`)
    }

    if (existingStaff) {
      return new Response(
        JSON.stringify({ error: 'Штаб с таким именем уже существует' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Создаем новый штаб
    const { data: newStaff, error: createError } = await supabaseAdmin
      .from('council_staffs')
      .insert([{
        name,
        display_name,
        description: description || null,
        color: color || 'from-green-500 to-green-700',
        icon: icon || 'Users',
        sort_order: sort_order || 0,
        is_active: true
      }])
      .select()
      .single()

    if (createError) {
      console.error('Staff creation error:', createError)
      throw new Error(`Ошибка создания штаба: ${createError.message}`)
    }

    console.log('Staff created successfully:', newStaff)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Штаб успешно создан',
        staff: newStaff
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