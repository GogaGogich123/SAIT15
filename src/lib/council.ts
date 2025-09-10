import { supabase } from './supabase';

// Types
export interface CouncilPosition {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  level: number; // 0=атаман, 1=зам атамана, 2=командир штаба, 3=подчиненный
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouncilStaff {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouncilMember {
  id: string;
  cadet_id: string;
  position_id: string;
  staff_id?: string;
  appointed_by?: string;
  appointed_at: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  cadet?: {
    name: string;
    display_name?: string;
    avatar_url?: string;
    platoon: string;
    squad: number;
    rank: number;
  };
  position?: CouncilPosition;
  staff?: CouncilStaff;
}

export interface CouncilHierarchy {
  id: string;
  subordinate_id: string;
  superior_id: string;
  created_at: string;
  subordinate?: CouncilMember;
  superior?: CouncilMember;
}

// Функция для получения токена авторизации
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Пользователь не авторизован');
  }
  return session.access_token;
};

// Функция для вызова Edge Function
const callEdgeFunction = async (functionName: string, payload: any = {}, method: string = 'POST') => {
  const token = await getAuthToken();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Получение всех должностей
export const getCouncilPositions = async (): Promise<CouncilPosition[]> => {
  const { data, error } = await supabase
    .from('council_positions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

// Получение всех штабов
export const getCouncilStaffs = async (): Promise<CouncilStaff[]> => {
  const { data, error } = await supabase
    .from('council_staffs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

// Получение всех членов совета с полной информацией
export const getCouncilMembers = async (): Promise<CouncilMember[]> => {
  const { data, error } = await supabase
    .from('council_members')
    .select(`
      *,
      cadet:cadets(name, display_name, avatar_url, platoon, squad, rank),
      position:council_positions(*),
      staff:council_staffs(*)
    `)
    .eq('is_active', true)
    .order('position.sort_order', { ascending: true, foreignTable: 'position' })
    .order('staff.sort_order', { ascending: true, foreignTable: 'staff' });
  
  if (error) throw error;
  return data || [];
};

// Получение иерархии совета
export const getCouncilHierarchy = async (): Promise<CouncilHierarchy[]> => {
  const { data, error } = await supabase
    .from('council_hierarchy')
    .select(`
      *,
      subordinate:council_members!council_hierarchy_subordinate_id_fkey(
        *,
        cadet:cadets(name, display_name, avatar_url, platoon, squad),
        position:council_positions(*),
        staff:council_staffs(*)
      ),
      superior:council_members!council_hierarchy_superior_id_fkey(
        *,
        cadet:cadets(name, display_name, avatar_url, platoon, squad),
        position:council_positions(*),
        staff:council_staffs(*)
      )
    `);
  
  if (error) throw error;
  return data || [];
};

// Создание новой должности
export const createCouncilPosition = async (positionData: {
  name: string;
  display_name: string;
  description?: string;
  level: number;
  color: string;
  icon: string;
  sort_order: number;
}): Promise<CouncilPosition> => {
  try {
    const result = await callEdgeFunction('create-council-position', positionData);
    return result.position;
  } catch (error) {
    console.error('Create council position failed', error);
    throw error;
  }
};

// Создание нового штаба
export const createCouncilStaff = async (staffData: {
  name: string;
  display_name: string;
  description?: string;
  color: string;
  icon: string;
  sort_order: number;
}): Promise<CouncilStaff> => {
  try {
    const result = await callEdgeFunction('create-council-staff', staffData);
    return result.staff;
  } catch (error) {
    console.error('Create council staff failed', error);
    throw error;
  }
};

// Назначение кадета на должность
export const appointCouncilMember = async (memberData: {
  cadet_id: string;
  position_id: string;
  staff_id?: string;
  notes?: string;
}): Promise<CouncilMember> => {
  try {
    const result = await callEdgeFunction('appoint-council-member', memberData);
    return result.member;
  } catch (error) {
    console.error('Appoint council member failed', error);
    throw error;
  }
};

// Обновление члена совета
export const updateCouncilMember = async (memberId: string, updates: {
  position_id?: string;
  staff_id?: string;
  notes?: string;
}): Promise<void> => {
  try {
    await callEdgeFunction('update-council-member', { memberId, updates }, 'PUT');
  } catch (error) {
    console.error('Update council member failed', error);
    throw error;
  }
};

// Удаление члена совета
export const removeCouncilMember = async (memberId: string): Promise<void> => {
  try {
    await callEdgeFunction('remove-council-member', { memberId }, 'DELETE');
  } catch (error) {
    console.error('Remove council member failed', error);
    throw error;
  }
};

// Обновление должности
export const updateCouncilPosition = async (positionId: string, updates: Partial<CouncilPosition>): Promise<void> => {
  try {
    await callEdgeFunction('update-council-position', { positionId, updates }, 'PUT');
  } catch (error) {
    console.error('Update council position failed', error);
    throw error;
  }
};

// Обновление штаба
export const updateCouncilStaff = async (staffId: string, updates: Partial<CouncilStaff>): Promise<void> => {
  try {
    await callEdgeFunction('update-council-staff', { staffId, updates }, 'PUT');
  } catch (error) {
    console.error('Update council staff failed', error);
    throw error;
  }
};

// Удаление должности
export const deleteCouncilPosition = async (positionId: string): Promise<void> => {
  try {
    await callEdgeFunction('delete-council-position', { positionId }, 'DELETE');
  } catch (error) {
    console.error('Delete council position failed', error);
    throw error;
  }
};

// Удаление штаба
export const deleteCouncilStaff = async (staffId: string): Promise<void> => {
  try {
    await callEdgeFunction('delete-council-staff', { staffId }, 'DELETE');
  } catch (error) {
    console.error('Delete council staff failed', error);
    throw error;
  }
};

// Установка иерархии подчинения
export const setCouncilHierarchy = async (subordinateId: string, superiorId: string): Promise<void> => {
  try {
    await callEdgeFunction('set-council-hierarchy', { subordinateId, superiorId });
  } catch (error) {
    console.error('Set council hierarchy failed', error);
    throw error;
  }
};

// Получение структурированных данных совета
export const getCouncilStructure = async () => {
  const [members, hierarchy] = await Promise.all([
    getCouncilMembers(),
    getCouncilHierarchy()
  ]);

  // Группируем по уровням
  const ataman = members.find(m => m.position?.level === 0);
  const deputyAtaman = members.find(m => m.position?.level === 1);
  const staffCommanders = members.filter(m => m.position?.level === 2);
  const staffMembers = members.filter(m => m.position?.level === 3);

  // Группируем членов штабов по штабам
  const staffsByStaff = staffMembers.reduce((acc, member) => {
    if (member.staff_id) {
      if (!acc[member.staff_id]) {
        acc[member.staff_id] = [];
      }
      acc[member.staff_id].push(member);
    }
    return acc;
  }, {} as { [staffId: string]: CouncilMember[] });

  return {
    ataman,
    deputyAtaman,
    staffCommanders,
    staffMembers: staffsByStaff,
    hierarchy,
    allMembers: members
  };
};