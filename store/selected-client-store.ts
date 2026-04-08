import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SelectedClientStore {
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  setClient: (id: string, name?: string | null, email?: string | null) => void;
  clearClient: () => void;
}

export const useSelectedClientStore = create<SelectedClientStore>()(
  persist(
    (set) => ({
      clientId: null,
      clientName: null,
      clientEmail: null,
      setClient: (id, name, email) =>
        set({
          clientId: id,
          clientName: name ?? null,
          clientEmail: email ?? null,
        }),
      clearClient: () => set({ clientId: null, clientName: null, clientEmail: null }),
    }),
    {
      name: "selected-client-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
