import { create } from "zustand";


type State = {
ids: string[];
add: (id: string) => void;
remove: (id: string) => void;
has: (id: string) => boolean;
};


export const useWishlist = create<State>((set, get) => ({
ids: [],
add: (id) => set({ ids: Array.from(new Set([...get().ids, id])) }),
remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
has: (id) => get().ids.includes(id),
}));