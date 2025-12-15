import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Developer {
  id: string;
  name: string;
}

export interface Compound {
  id: string;
  developerId: string;
  name: string;
}

export interface TemplateMeta {
  id: string;
  compoundId: string;
  name: string; // Display name
  updatedAt: number;
  elementCount?: number;
}

interface ProjectStore {
  developers: Developer[];
  compounds: Compound[];
  templates: TemplateMeta[];

  // Developer Actions
  addDeveloper: (name: string) => void;
  updateDeveloper: (id: string, name: string) => void;
  deleteDeveloper: (id: string) => void;

  // Compound Actions
  addCompound: (developerId: string, name: string) => void;
  updateCompound: (id: string, name: string) => void;
  deleteCompound: (id: string) => void;

  // Template Actions
  addTemplate: (compoundId: string, name: string) => string; // Returns ID
  updateTemplate: (id: string, updates: Partial<TemplateMeta> & { name?: string }) => void;
  deleteTemplate: (id: string) => void;
  touchTemplate: (id: string) => void; // Updates timestamp
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      developers: [],
      compounds: [],
      templates: [],

      addDeveloper: (name) =>
        set((state) => ({
          developers: [...state.developers, { id: generateId(), name }],
        })),

      updateDeveloper: (id, name) =>
        set((state) => ({
          developers: state.developers.map((d) =>
            d.id === id ? { ...d, name } : d
          ),
        })),

      deleteDeveloper: (id) =>
        set((state) => ({
          developers: state.developers.filter((d) => d.id !== id),
          compounds: state.compounds.filter((c) => c.developerId !== id),
          // Clean up templates would also be needed, ideally
        })),

      addCompound: (developerId, name) =>
        set((state) => ({
          compounds: [...state.compounds, { id: generateId(), developerId, name }],
        })),

      updateCompound: (id, name) =>
        set((state) => ({
          compounds: state.compounds.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
        })),

      deleteCompound: (id) =>
        set((state) => ({
          compounds: state.compounds.filter((c) => c.id !== id),
          templates: state.templates.filter((t) => t.compoundId !== id),
        })),

      addTemplate: (compoundId, name) => {
        const id = generateId();
        set((state) => ({
          templates: [
            ...state.templates,
            { id, compoundId, name, updatedAt: Date.now(), elementCount: 0 },
          ],
        }));
        return id;
      },

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
        
      touchTemplate: (id) =>
        set((state) => ({
            templates: state.templates.map((t) =>
                t.id === id ? { ...t, updatedAt: Date.now() } : t
            ),
        })),
    }),
    {
      name: 'project-store',
      // We only strictly need to persist metadata here.
      // Large data (editor state per template) will be in idb-keyval
    }
  )
);
