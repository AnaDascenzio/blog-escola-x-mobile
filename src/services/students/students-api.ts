
import { getApiBaseUrl } from '../auth/auth-api';

export interface Student {
  id: string;
  name: string;
  email: string;
  password?: string; 
  registrationNumber?: string;
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
    
    console.log('RESPOSTA COMPLETA DA API /users:', data);

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
      name: studentData.name,
      email: studentData.email,
      password: studentData.password || '123456', // Senha padrão 
      registrationNumber: studentData.registrationNumber,
      role: 'STUDENT',
    };

    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
      throw new Error(errorMessage);
    }

    return data;
  },

  updateStudent: async (id: string, studentData: Partial<Student>, token?: string | null): Promise<Student> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(studentData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = typeof data === 'string' ? data : (data.message || JSON.stringify(data));
      throw new Error(errorMessage);
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