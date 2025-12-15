import { useEditorStore } from '../stores/editorStore';
import { EmptyState } from './field-editor/EmptyState';
import { MultiSelectState } from './field-editor/MultiSelectState';
import { SingleFieldEditor } from './field-editor/SingleFieldEditor';

export function FieldEditor() {
  const {
    textFields,
    selectedFieldIds,
    updateTextField,
    deleteTextField,
    currentPage,
    numPages,
    copyStyles,
    pasteStyles,
    copiedStyles,
  } = useEditorStore();

  const selectedFields = textFields.filter((f) =>
    selectedFieldIds.includes(f.id)
  );

  const selectedField = selectedFields.length === 1 ? selectedFields[0] : null;

  if (selectedFieldIds.length === 0) {
    return <EmptyState />;
  }

  if (selectedFields.length > 1) {
    return (
      <MultiSelectState
        selectedFields={selectedFields}
        numPages={numPages}
        onUpdate={updateTextField}
        onDelete={deleteTextField}
        onPasteStyles={pasteStyles}
        copiedStyles={copiedStyles}
      />
    );
  }

  if (!selectedField) return null;

  return (
    <SingleFieldEditor
      field={selectedField}
      numPages={numPages}
      currentPage={currentPage}
      onUpdate={updateTextField}
      onDelete={deleteTextField}
      onCopyStyles={copyStyles}
      onPasteStyles={pasteStyles}
      hasCopiedStyles={!!copiedStyles}
    />
  );
}

