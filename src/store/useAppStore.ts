import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Application, FilterState } from "@/lib/types";

interface AppStore {
  // Applications
  applications: Application[];
  setApplications: (apps: Application[]) => void;
  addApplication: (app: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  removeApplication: (id: string) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  viewMode: "kanban" | "table";
  setViewMode: (mode: "kanban" | "table") => void;
  selectedApplicationId: string | null;
  setSelectedApplicationId: (id: string | null) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isAISidebarOpen: boolean;
  setIsAISidebarOpen: (open: boolean) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Search
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

const defaultFilters: FilterState = {
  search: "",
  status: [],
  industry: [],
  workMode: [],
  seniority: [],
  source: [],
  dateFrom: null,
  dateTo: null,
  isBookmarked: null,
  isArchived: false,
  tags: [],
};

export const useAppStore = create<AppStore>()(
  devtools((set) => ({
    applications: [],
    setApplications: (apps) => set({ applications: apps }),
    addApplication: (app) =>
      set((state) => ({ applications: [app, ...state.applications] })),
    updateApplication: (id, updates) =>
      set((state) => ({
        applications: state.applications.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),
    removeApplication: (id) =>
      set((state) => ({
        applications: state.applications.filter((a) => a.id !== id),
      })),

    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    viewMode: "kanban",
    setViewMode: (mode) => set({ viewMode: mode }),
    selectedApplicationId: null,
    setSelectedApplicationId: (id) => set({ selectedApplicationId: id }),
    isQuickAddOpen: false,
    setIsQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
    isAISidebarOpen: false,
    setIsAISidebarOpen: (open) => set({ isAISidebarOpen: open }),

    filters: defaultFilters,
    setFilters: (filters) =>
      set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),

    globalSearch: "",
    setGlobalSearch: (q) => set({ globalSearch: q }),
  }))
);
