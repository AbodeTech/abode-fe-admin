import { create } from 'zustand';

/**
 * Which panels on the course overview page are in edit mode. Mirrors
 * features/assets/store/asset-form-store.ts's editingSections slice — each
 * panel saves against its own field set, so more than one can be open at once.
 */
type CourseFormState = {
  editingSections: Record<string, boolean>;
  startEditing: (id: string) => void;
  stopEditing: (id: string) => void;
};

export const useCourseFormStore = create<CourseFormState>((set) => ({
  editingSections: {},

  startEditing: (id) =>
    set((state) => ({ editingSections: { ...state.editingSections, [id]: true } })),

  stopEditing: (id) =>
    set((state) => {
      const next = { ...state.editingSections };
      delete next[id];
      return { editingSections: next };
    }),
}));
