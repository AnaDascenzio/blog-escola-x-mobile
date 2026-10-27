import { getApiBaseUrl } from "@/services/auth/auth-api";

export type Subject =
  | "PORTUGUESE"
  | "MATHEMATICS"
  | "HISTORY"
  | "GEOGRAPHY"
  | "BIOLOGY"
  | "PHYSICS"
  | "CHEMISTRY"
  | "ENGLISH"
  | "PHILOSOPHY"
  | "SOCIOLOGY"
  | "PHYSICAL_EDUCATION"
  | "ARTS";

export const SUBJECT_MAP: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  MATHEMATICS: { label: "Matemática", color: "#7c3aed", bg: "#f3e8ff" },
  PORTUGUESE: { label: "Português", color: "#0369a1", bg: "#e0f2fe" },
  HISTORY: { label: "História", color: "#b45309", bg: "#fef3c7" },
  GEOGRAPHY: { label: "Geografia", color: "#15803d", bg: "#dcfce7" },
  BIOLOGY: { label: "Biologia", color: "#059669", bg: "#d1fae5" },
  PHYSICS: { label: "Física", color: "#2563eb", bg: "#dbeafe" },
  CHEMISTRY: { label: "Química", color: "#d97706", bg: "#fef3c7" },
  ENGLISH: { label: "Inglês", color: "#4f46e5", bg: "#e0e7ff" },
  PHILOSOPHY: { label: "Filosofia", color: "#9333ea", bg: "#f3e8ff" },
  SOCIOLOGY: { label: "Sociologia", color: "#ea580c", bg: "#ffedd5" },
  PHYSICAL_EDUCATION: { label: "Educação Física", color: "#16a34a", bg: "#dcfce7" },
  ARTS: { label: "Artes", color: "#db2777", bg: "#fce7f3" },
};

export function getSubjectInfo(subject?: string) {
  if (!subject) {
    return { label: "Geral", color: "#475569", bg: "#f1f5f9" };
  }
  return (
    SUBJECT_MAP[subject] ?? { label: subject, color: "#475569", bg: "#f1f5f9" }
  );
}

export interface PostAuthor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  image?: string;
  image_url?: string;
  cover?: string;
  coverUrl?: string;
  link?: string;
  subject: Subject | string;
  authorId?: string;
  author?: PostAuthor;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedPosts {
  post: Post[];
  total: number;
}

function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function getPosts(
  token?: string | null,
  page = 1,
  limit = 10,
): Promise<PaginatedPosts> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/posts?page=${page}&limit=${limit}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(token),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API de publicações. Verifique sua conexão.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Erro ao carregar publicações (código ${response.status}).`,
    );
  }

  const data: unknown = await response.json();

  if (data && typeof data === "object") {
    const candidate = data as Record<string, unknown>;
    if (Array.isArray(candidate.post)) {
      return {
        post: candidate.post as Post[],
        total: typeof candidate.total === "number" ? candidate.total : candidate.post.length,
      };
    }
    if (Array.isArray(candidate.items)) {
      return {
        post: candidate.items as Post[],
        total: typeof candidate.total === "number" ? candidate.total : candidate.items.length,
      };
    }
    if (Array.isArray(candidate.posts)) {
      return {
        post: candidate.posts as Post[],
        total: typeof candidate.total === "number" ? candidate.total : candidate.posts.length,
      };
    }
  }

  if (Array.isArray(data)) {
    return {
      post: data as Post[],
      total: data.length,
    };
  }

  return { post: [], total: 0 };
}

export async function getPostById(
  id: string,
  token?: string | null,
): Promise<Post> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/posts/${id}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(token),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API de publicações. Verifique sua conexão.",
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Publicação não encontrada.");
    }
    throw new Error(
      `Erro ao carregar detalhes da publicação (código ${response.status}).`,
    );
  }

  const data = (await response.json()) as Post;

  // Se a API não incluiu os dados completos do autor no GET /posts/:id,
  // busca o usuário correspondente pelo authorId para exibir o nome correto
  if (!data.author?.name && data.authorId) {
    try {
      const userResponse = await fetch(`${baseUrl}/users/${data.authorId}`, {
        method: "GET",
        headers: buildHeaders(token),
      });

      if (userResponse.ok) {
        const userData = (await userResponse.json()) as PostAuthor;
        data.author = {
          id: userData.id ?? data.authorId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };
      }
    } catch {
      // Ignora erro de enriquecimento secundário
    }
  }

  return data;
}

export function getPostImageUrl(post?: Partial<Post> | null): string | undefined {
  if (!post) return undefined;
  const raw =
    post.imageUrl ||
    post.image ||
    post.image_url ||
    post.coverUrl ||
    post.cover;

  if (!raw) return undefined;

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  try {
    const baseUrl = getApiBaseUrl();
    const cleanPath = raw.startsWith("/") ? raw : `/${raw}`;
    return `${baseUrl}${cleanPath}`;
  } catch {
    return raw;
  }
}

export function formatPostDate(
  dateStr?: string,
  format: "short" | "long" = "short",
): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    if (format === "long") {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }

    return new Intl.DateTimeFormat("pt-BR").format(date);
  } catch {
    return "";
  }
}

export function calculateReadingTime(content?: string): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
