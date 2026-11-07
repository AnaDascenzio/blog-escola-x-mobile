
import { getApiBaseUrl } from '../auth/auth-api';

export interface Student {
  id: string;
  name: string;
  email: string;
  password?: string; 
  role?: string;
}

export interface PaginatedStudentsResponse {
  students: Student[];
  total: number;
  page: number;
  totalPages: number;
}

const getAuthHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const studentsApi = {
  getStudents: async (page = 1, limit = 100, token?: string | null): Promise<PaginatedStudentsResponse> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/users?role=STUDENT&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Não foi possível carregar os alunos (Erro ${response.status}).`);
    }

    const data = await response.json();
    
    const usersList = data.items || data.users || data.data || data.students || (Array.isArray(data) ? data : []);

    const studentsList = usersList.filter((u: any) => {
      if (!u.role) return true;
      const roleStr = String(u.role).toUpperCase();
      return roleStr === 'STUDENT';
    });

    return {
      students: studentsList,
      total: data.total || studentsList.length,
      page: data.page || page,
      totalPages: data.totalPages || 1,
    };
  },

  getStudentById: async (id: string, token?: string | null): Promise<Student> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Não foi possível carregar os dados do aluno (Erro ${response.status}).`);
    }

    const data = await response.json();
    return data.user || data.student || data;
  },

  createStudent: async (studentData: Omit<Student, 'id'>, token?: string | null): Promise<Student> => {
    const baseUrl = getApiBaseUrl();
    
    const payload = {
      name: studentData.name.trim(),
      email: studentData.email.trim().toLowerCase(),
      password: studentData.password ? studentData.password.trim() : '123456',
      role: 'STUDENT',
    };

    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const rawMessage = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
      const message =
        typeof rawMessage === 'string' &&
        (rawMessage.includes('unique constraint') ||
          rawMessage.includes('duplicate key') ||
          rawMessage.includes('users_email_key'))
          ? 'E-mail já cadastrado.'
          : rawMessage;
      throw new Error(message);
    }

    return data;
  },

  updateStudent: async (id: string, studentData: Partial<Student>, token?: string | null): Promise<Student> => {
    const baseUrl = getApiBaseUrl();
    const payload: Partial<Student> = { ...studentData };
    if (payload.name !== undefined) payload.name = payload.name.trim();
    if (payload.email !== undefined) {
      payload.email = payload.email.trim().toLowerCase();
    }
    if (payload.password !== undefined) {
      if (payload.password.trim()) {
        payload.password = payload.password.trim();
      } else {
        delete payload.password;
      }
    }

    const response = await fetch(`${baseUrl}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const rawMessage = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
      const message =
        typeof rawMessage === 'string' &&
        (rawMessage.includes('unique constraint') ||
          rawMessage.includes('duplicate key') ||
          rawMessage.includes('users_email_key'))
          ? 'E-mail já cadastrado.'
          : rawMessage;
      throw new Error(message);
    }

    return data;
  },

  deleteStudent: async (id: string, token?: string | null): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Não foi possível excluir o aluno (Erro ${response.status}).`);
    }
  },
};