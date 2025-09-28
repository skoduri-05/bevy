import { create } from "zustand";

interface ExploreProgressState {
  stack: string[];
  setStack: (stack: string[]) => void;
  removeFromStack: (id: string) => void;
  reset: () => void;
}

export const useExploreProgress = create<ExploreProgressState>((set) => ({
  stack: [],
  setStack: (stack) => set({ stack }),
  removeFromStack: (id) =>
    set((state) => ({ stack: state.stack.filter((x) => x !== id) })),
  reset: () => set({ stack: [] }),
}));
