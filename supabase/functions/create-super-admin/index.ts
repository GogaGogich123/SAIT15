import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { email = 'superadmin@nkkk.ru', password = 'superadmin123', name = 'Главный администратор' } = await req.json()

    console.log('Creating super admin:', { email, name })

    // Проверяем, существует ли уже главный администратор
    const { data: existingSuperAdmin, error: checkError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        user_roles!inner(
          role:admin_roles!inner(name)
        )
      `)
      .eq('user_roles.is_active', true)
      .eq('user_roles.role.name', 'super_admin')
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing super admin:', checkError)
      throw new Error(`Ошибка проверки существующего главного администратора: ${checkError.message}`)
    }

    if (existingSuperAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Главный администратор уже существует в системе'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. Создаем пользователя в Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'super_admin'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: `Ошибка создания пользователя: ${authError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = authData.user.id
    console.log('Super admin user created with ID:', userId)

    try {
      // 2. Создаем запись в таблице users
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          email,
          name,
          role: 'super_admin'
        }])

      if (userError) {
        console.error('Users table error:', userError)
        throw userError
      }

      console.log('Super admin record created in users table')

      // 3. Получаем ID роли super_admin
      const { data: superAdminRole, error: roleError } = await supabaseAdmin
        .from('admin_roles')
        .select('id')
        .eq('name', 'super_admin')
        .single()

      if (roleError || !superAdminRole) {
        console.error('Super admin role not found:', roleError)
        throw new Error('Роль super_admin не найдена в системе')
      }

      // 4. Назначаем роль super_admin
      const { error: roleAssignError } = await supabaseAdmin
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: superAdminRole.id,
          assigned_by: userId,
          is_active: true
        }])

      if (roleAssignError) {
        console.error('Role assignment error:', roleAssignError)
        throw roleAssignError
      }

      console.log('Super admin role assigned successfully')

      // 5. Получаем полные данные созданного администратора
      const { data: adminData, error: fetchError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          user_roles!inner(
            role:admin_roles(*)
          )
        `)
        .eq('id', userId)
        .eq('user_roles.is_active', true)
        .single()

      if (fetchError) {
        console.error('Error fetching created super admin:', fetchError)
        throw fetchError
      }

      // Получаем разрешения пользователя
      const { data: permissions, error: permissionsError } = await supabaseAdmin
        .rpc('get_user_permissions', { user_id: userId })

      if (permissionsError) {
        console.error('Error fetching user permissions:', permissionsError)
        // Не критично, продолжаем без разрешений
      }

      const superAdmin = {
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        roles: adminData.user_roles?.map((ur: any) => ur.role).filter(Boolean) || [],
        permissions: permissions || [],
        created_at: adminData.created_at
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Главный администратор успешно создан',
          admin: superAdmin,
          credentials: {
            email,
            password
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (error) {
      // Очищаем пользователя из Auth если что-то пошло не так
      console.error('Error during super admin creation, cleaning up auth user:', error)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw error
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})