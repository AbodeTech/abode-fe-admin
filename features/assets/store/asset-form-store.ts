import { create } from 'zustand';

/* ============================================================
 * UI state for the asset create/edit form.
 *
 * React Hook Form owns the *values* — that stays the house standard and gives
 * us zodResolver validation. This store owns everything around them, which
 * would otherwise be a dozen scattered `useState` calls across a four-level
 * nested form: which sections are open, the status of each upload, and which
 * offer/size/plan the detail page's Offers tab is currently editing.
 *
 * Deliberately not persisted, and `reset()` is called when the form mounts —
 * a half-filled asset from a previous visit reappearing would be worse than
 * losing it.
 * ============================================================ */

export type UploadStatus = 'uploading' | 'done' | 'error';

export type UploadEntry = {
  /** File name, so a failed upload can name what failed. */
  name: string;
  status: UploadStatus;
  url?: string;
  error?: string;
};

/**
 * What the offers tab is currently editing. One discriminated union rather
 * than a dialog-open boolean per level — the tree is four deep, and five
 * separate `useState` pairs would drift out of sync.
 *
 * A missing `sizeId` or `tenor` means "add"; present means "edit".
 */
export type OfferEditTarget =
  /** The one target whose offer doesn't exist yet — `offerType` is the type being added. */
  | { kind: 'add-offer'; offerType: string }
  | { kind: 'offer'; offerType: string }
  | { kind: 'size'; offerType: string; sizeId?: string }
  | { kind: 'plan'; offerType: string; sizeId: string; tenor?: number }
  | { kind: 'delete-size'; offerType: string; sizeId: string }
  | { kind: 'delete-plan'; offerType: string; sizeId: string; tenor: number };

type AssetFormState = {
  openSections: Record<string, boolean>;
  isOpen: (id: string, fallback?: boolean) => boolean;
  toggleSection: (id: string) => void;
  setSection: (id: string, open: boolean) => void;

  /**
   * Which sections of the detail page are in edit mode. Sections are
   * independent — each saves against its own endpoint — so more than one can
   * be open at a time.
   */
  editingSections: Record<string, boolean>;
  isEditing: (id: string) => boolean;
  startEditing: (id: string) => void;
  stopEditing: (id: string) => void;

  /** Keyed by form field path, so one map covers hero image, gallery and docs. */
  uploads: Record<string, UploadEntry>;
  startUpload: (key: string, name: string) => void;
  completeUpload: (key: string, url: string) => void;
  failUpload: (key: string, error: string) => void;
  clearUpload: (key: string) => void;
  /** True while any upload is in flight — submit waits on this. */
  isUploading: () => boolean;

  offerEdit: OfferEditTarget | null;
  openOfferEdit: (target: OfferEditTarget) => void;
  closeOfferEdit: () => void;

  reset: () => void;
};

export const useAssetFormStore = create<AssetFormState>((set, get) => ({
  openSections: {},

  isOpen: (id, fallback = true) => get().openSections[id] ?? fallback,

  toggleSection: (id) =>
    set((state) => ({
      openSections: { ...state.openSections, [id]: !(state.openSections[id] ?? true) },
    })),

  setSection: (id, open) =>
    set((state) => ({ openSections: { ...state.openSections, [id]: open } })),

  editingSections: {},

  isEditing: (id) => get().editingSections[id] ?? false,

  startEditing: (id) =>
    set((state) => ({ editingSections: { ...state.editingSections, [id]: true } })),

  stopEditing: (id) =>
    set((state) => {
      const next = { ...state.editingSections };
      delete next[id];
      return { editingSections: next };
    }),

  uploads: {},

  startUpload: (key, name) =>
    set((state) => ({ uploads: { ...state.uploads, [key]: { name, status: 'uploading' } } })),

  completeUpload: (key, url) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [key]: { ...state.uploads[key], name: state.uploads[key]?.name ?? '', status: 'done', url },
      },
    })),

  failUpload: (key, error) =>
    set((state) => ({
      uploads: {
        ...state.uploads,
        [key]: { ...state.uploads[key], name: state.uploads[key]?.name ?? '', status: 'error', error },
      },
    })),

  clearUpload: (key) =>
    set((state) => {
      const next = { ...state.uploads };
      delete next[key];
      return { uploads: next };
    }),

  isUploading: () => Object.values(get().uploads).some((entry) => entry.status === 'uploading'),

  offerEdit: null,

  openOfferEdit: (target) => set({ offerEdit: target }),

  closeOfferEdit: () => set({ offerEdit: null }),

  reset: () =>
    set({
      openSections: {},
      editingSections: {},
      uploads: {},
      offerEdit: null,
    }),
}));
