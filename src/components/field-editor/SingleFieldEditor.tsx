import type { EditorTextField } from '../../types';
import { ContentSection } from './sections/ContentSection';
import { PageSection } from './sections/PageSection';
import { PositionSection } from './sections/PositionSection';
import { TypographySection } from './sections/TypographySection';
import { BehaviorSection } from './sections/BehaviorSection';
import { ActionsSection } from './sections/ActionsSection';

interface SingleFieldEditorProps {
  field: EditorTextField;
  numPages: number;
  currentPage: number;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
  onDelete: (id: string) => void;
  onCopyStyles: () => void;
  onPasteStyles: () => void;
  hasCopiedStyles: boolean;
}

export function SingleFieldEditor({
  field,
  numPages,
  currentPage,
  onUpdate,
  onDelete,
  onCopyStyles,
  onPasteStyles,
  hasCopiedStyles,
}: SingleFieldEditorProps) {
  return (
    <div key="single" className="field-editor p-3 space-y-3 overflow-y-auto h-full animate-slide-in-right">
      <h3 className="text-xs font-medium text-neutral-400 mb-1">Field Properties</h3>
      <ContentSection field={field} onUpdate={onUpdate} />
      <PageSection field={field} numPages={numPages} currentPage={currentPage} onUpdate={onUpdate} />
      <PositionSection field={field} onUpdate={onUpdate} />
      <TypographySection field={field} onUpdate={onUpdate} />
      <BehaviorSection field={field} onUpdate={onUpdate} />
      <ActionsSection
        onCopyStyles={onCopyStyles}
        onPasteStyles={onPasteStyles}
        onDelete={() => onDelete(field.id)}
        hasCopiedStyles={hasCopiedStyles}
      />
    </div>
  );
}
