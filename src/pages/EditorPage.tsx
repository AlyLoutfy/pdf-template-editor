import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useProjectStore } from '../stores/projectStore';
import { getFile } from '../utils/storage';
import { get } from 'idb-keyval';

interface EditorPageProps {
  children?: ReactNode;
}

export function EditorPage({ children }: EditorPageProps) {
  const { templateId } = useParams<{ templateId: string }>();
  const { hydrateTemplate } = useEditorStore();
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    async function load() {
      if (!templateId) return;
      
      setLoading(true);
      try {
        // 1. Get metadata
        // Use getState to avoid re-triggering effect when templates change
        const currentTemplates = useProjectStore.getState().templates;
        const template = currentTemplates.find(t => t.id === templateId);
        if (!template) {
             console.error("Template not found in project store");
        }

        // 2. Get large data from IDB
        const savedData = await get(`template-${templateId}`);
        const savedPdf = await getFile(templateId);

        // 3. Hydrate
        hydrateTemplate(templateId, savedData || {}, savedPdf);
        
      } catch (e) {
        console.error("Failed to load template", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [templateId, hydrateTemplate]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-neutral-950 text-neutral-400">Loading Editor...</div>;
  }

  return (
      <div className="h-screen flex flex-col">
          <div className="flex-1 overflow-hidden relative">
             {children}
          </div>
      </div>
  );
}
