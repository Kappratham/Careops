import { create } from "zustand";
import { User, Workspace, OnboardingStatus } from "@/types";
import api from "@/lib/api";
import { setTokens, clearTokens } from "@/lib/auth";

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  onboarding: OnboardingStatus | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  fetchWorkspace: () => Promise<void>;
  fetchOnboarding: () => Promise<void>;
  setWorkspace: (workspace: Workspace) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  workspace: null,
  onboarding: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { user, tokens } = res.data;
    setTokens(tokens.access_token, tokens.refresh_token);
    set({ user });

    if (user.workspace_id) {
      await get().fetchWorkspace();
      await get().fetchOnboarding();
    }
  },

  register: async (email: string, password: string, fullName: string) => {
    const res = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    const { user, tokens } = res.data;
    setTokens(tokens.access_token, tokens.refresh_token);
    set({ user });
  },

  logout: () => {
    clearTokens();
    set({ user: null, workspace: null, onboarding: null });
    window.location.href = "/login";
  },

  fetchUser: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, isLoading: false });

      if (res.data.workspace_id) {
        await get().fetchWorkspace();
        await get().fetchOnboarding();
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  fetchWorkspace: async () => {
    try {
      const res = await api.get("/workspace/");
      set({ workspace: res.data });
    } catch {
      set({ workspace: null });
    }
  },

  fetchOnboarding: async () => {
    try {
      const res = await api.get("/workspace/onboarding");
      set({ onboarding: res.data });
    } catch {
      set({ onboarding: null });
    }
  },

  setWorkspace: (workspace: Workspace) => {
    set({ workspace });
  },
}));