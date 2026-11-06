import { getApiBaseUrl } from "@/services/auth/auth-api";

export type UserRole = "TEACHER" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: boolean;
}

export interface PaginatedUsers {
  items: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

const ROLE_PLURAL: Record<UserRole, string> = {
  TEACHER: "professores",
  STUDENT: "alunos",
};

function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique sua conexão.",
    );
  }
}

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  if (response.status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }
  if (response.status === 403) {
    return "Apenas professores podem gerenciar usuários.";
  }
  if (response.status === 404) {
    return "Usuário não encontrado.";
  }
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as Record<string, unknown>).message === "string"
    ) {
      return (body as Record<string, string>).message;
    }
  } catch {
    // Corpo vazio ou não-JSON: usa a mensagem padrão.
  }
  return `${fallback} (código ${response.status}).`;
}

export async function listUsers(
  role: UserRole,
  token: string | null,
  page = 1,
  limit = 10,
): Promise<PaginatedUsers> {
  const url = `${getApiBaseUrl()}/users?role=${role}&page=${page}&limit=${limit}`;
  const response = await request(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, `Erro ao listar ${ROLE_PLURAL[role]}`),
    );
  }

  return (await response.json()) as PaginatedUsers;
}

export async function getUserById(
  id: string,
  token: string | null,
): Promise<User> {
  const response = await request(`${getApiBaseUrl()}/users/${id}`, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao carregar usuário"));
  }

  return (await response.json()) as User;
}

export async function createUser(
  input: CreateUserInput,
  token: string | null,
): Promise<User> {
  const response = await request(`${getApiBaseUrl()}/users`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao cadastrar usuário"));
  }

  return (await response.json()) as User;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  token: string | null,
): Promise<User> {
  const response = await request(`${getApiBaseUrl()}/users/${id}`, {
    method: "PUT",
    headers: buildHeaders(token),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao atualizar usuário"));
  }

  return (await response.json()) as User;
}

export async function deactivateUser(
  id: string,
  token: string | null,
): Promise<void> {
  const response = await request(`${getApiBaseUrl()}/users/${id}`, {
    method: "DELETE",
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao excluir usuário"));
  }
}