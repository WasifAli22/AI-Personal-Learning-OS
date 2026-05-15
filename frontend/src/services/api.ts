import { API_URL } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}/api${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }
  return res.json();
}

// Auth
export const authAPI = {
  signup: (data: { email: string; password: string; full_name: string }) =>
    fetchAPI("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    fetchAPI("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => fetchAPI("/auth/me"),
};

// Documents
export const documentsAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchAPI("/documents/upload", { method: "POST", body: formData });
  },
  list: () => fetchAPI("/documents/"),
  delete: (id: string) => fetchAPI(`/documents/${id}`, { method: "DELETE" }),
};

// Chat
export const chatAPI = {
  send: (data: { message: string; document_ids?: string[]; conversation_id?: string }) =>
    fetchAPI("/chat", { method: "POST", body: JSON.stringify(data) }),
};

// Quiz
export const quizAPI = {
  generate: (data: { document_ids?: string[]; topic?: string; num_questions?: number; difficulty?: string }) =>
    fetchAPI("/generate-quiz", { method: "POST", body: JSON.stringify(data) }),
  submit: (data: { quiz_id: string; answers: Record<string, string> }) =>
    fetchAPI("/submit-quiz", { method: "POST", body: JSON.stringify(data) }),
};

// Roadmap
export const roadmapAPI = {
  generate: (data: { document_ids?: string[]; duration_weeks?: number; daily_hours?: number; skill_level?: string }) =>
    fetchAPI("/generate-roadmap", { method: "POST", body: JSON.stringify(data) }),
  get: () => fetchAPI("/roadmap"),
};

// Flashcards
export const flashcardsAPI = {
  generate: (data: { document_ids?: string[]; topic?: string; num_cards?: number }) =>
    fetchAPI("/generate-flashcards", { method: "POST", body: JSON.stringify(data) }),
  list: () => fetchAPI("/flashcards"),
};

// Dashboard & Analytics
export const dashboardAPI = {
  get: () => fetchAPI("/dashboard"),
  analytics: () => fetchAPI("/analytics"),
  updatePerformance: (data: { activity_type: string; topic?: string; score?: number; time_spent_minutes?: number }) =>
    fetchAPI("/update-performance", { method: "POST", body: JSON.stringify(data) }),
};
