import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AssetIdStore {
  assetId: string | null;
  updateAssetId: (id: string | null) => void;
}

export const useAssetIdStore = create<AssetIdStore>()(
  persist(
    (set) => ({
      assetId: null,
      updateAssetId: (id) => set({ assetId: id }),
    }),
    {
      name: 'asset-id-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
