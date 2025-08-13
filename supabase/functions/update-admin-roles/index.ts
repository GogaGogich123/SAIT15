import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
}

// Функция для проверки прав главного администратора
async function checkSuperAdminRole(authHeader: string | null, supabaseAdmin: any) {
  if (!authHeader) {
    throw new Error('Отсутствует токен авторизации')
  }

  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  
  if (authError || !user) {
    throw new Error('Недействительный токен авторизации')
  }

  const { data: isSuperAdmin, error: checkError } = await supabaseAdmin
    .rpc('user_has_permission', { 
      user_id: user.id, 
      permission_name: 'manage_admins' 
    })

  if (checkError) {
    throw new Error('Ошибка проверки прав доступа')
  }

  if (!isSuperAdmin) {
    throw new Error('Недостаточно прав доступа. Требуются права главного администратора.')
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
    const currentUser = await checkSuperAdminRole(authHeader, supabaseAdmin)

    const { userId, roleIds } = await req.json()

    if (!userId || !roleIds || !Array.isArray(roleIds)) {
      return new Response(
        JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Updating admin roles:', { userId, roleIds })

    // Проверяем, что пользователь существует и является админом
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .in('role', ['admin', 'super_admin'])
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Администратор не найден' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Деактивируем все текущие роли пользователя
    const { error: deactivateError } = await supabaseAdmin
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) {
      console.error('Error deactivating current roles:', deactivateError)
      throw new Error(`Ошибка деактивации текущих ролей: ${deactivateError.message}`)
    }

    // Назначаем новые роли
    if (roleIds.length > 0) {
      const userRoleInserts = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
        assigned_by: currentUser.id,
        is_active: true
      }))

      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .upsert(userRoleInserts, { 
          onConflict: 'user_id,role_id',
          ignoreDuplicates: false 
        })

      if (insertError) {
        console.error('Error inserting new roles:', insertError)
        throw new Error(`Ошибка назначения новых ролей: ${insertError.message}`)
      }
    }

    console.log('Admin roles updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Роли администратора успешно обновлены'
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