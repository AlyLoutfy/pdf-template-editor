import type { EditorTextField } from '../../types';

interface MultiSelectStateProps {
  selectedFields: EditorTextField[];
  numPages: number;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
  onDelete: (id: string) => void;
  onPasteStyles: () => void;
  copiedStyles: Partial<EditorTextField> | null;
}

export function MultiSelectState({
  selectedFields,
  numPages,
  onUpdate,
  onDelete,
  onPasteStyles,
  copiedStyles,
}: MultiSelectStateProps) {
  const selectedFieldIds = selectedFields.map(f => f.id);

  const bulkUpdate = (updates: Partial<EditorTextField>) => {
    selectedFieldIds.forEach((id) => onUpdate(id, updates));
  };

  return (
    <div key="multi" className="field-editor p-3 space-y-3 overflow-y-auto h-full animate-slide-in-right">
      <h3 className="text-xs font-medium text-neutral-400 mb-1">
        {selectedFields.length} Fields Selected
      </h3>

      {/* Section: Bulk Page */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-neutral-800"></div>
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Page</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>
        
        <div className="relative">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value !== '') {
                bulkUpdate({ page: parseInt(e.target.value), pageReference: undefined });
              }
            }}
            className="w-full pl-2.5 pr-7 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-primary-500 appearance-none"
          >
            <option value="">Move all to page...</option>
            {Array.from({ length: numPages }, (_, i) => (
              <option key={i} value={i}>
                Page {i + 1}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Section: Bulk Typography */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-neutral-800"></div>
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Typography</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Font Size: {selectedFields[0]?.size || 12}px
          </label>
          <input
            type="range"
            min="8"
            max="72"
            value={selectedFields[0]?.size || 12}
            onChange={(e) => bulkUpdate({ size: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-[10px] text-neutral-600 mt-0.5">
            <span>8</span>
            <span>72</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1">Color</label>
          
          {/* Color picker integrated with preview */}
          <div className="flex items-center gap-2 mb-1.5">
            <label className="relative cursor-pointer flex-shrink-0">
              <div 
                className="w-[36px] h-[36px] rounded-md border-2 border-neutral-600 transition-all hover:border-primary-500"
                style={{ backgroundColor: selectedFields[0]?.color || '#000000' }}
              />
              <input
                type="color"
                value={selectedFields[0]?.color || '#000000'}
                onChange={(e) => bulkUpdate({ color: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              value={selectedFields[0]?.color || '#000000'}
              onChange={(e) => bulkUpdate({ color: e.target.value })}
              className="flex-1 px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-primary-500 h-[36px]"
              placeholder="#000000"
            />
          </div>

          {/* Common colors - fill horizontal space */}
          <div className="flex gap-1.5">
            {['#000000', '#FFFFFF', '#064952', '#EDE2DF', '#FF0000', '#00FF00', '#0000FF'].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => bulkUpdate({ color })}
                  className="flex-1 h-7 rounded-md border-2 border-neutral-600 hover:border-primary-400 transition-all"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Section: Bulk Formatting */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-neutral-800"></div>
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Formatting</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => bulkUpdate({ isFullNumber: true })}
            className="flex-1 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:bg-neutral-700 hover:border-primary-500 transition-colors"
          >
            Set Full Number
          </button>
          <button
            onClick={() => bulkUpdate({ isFullNumber: false })}
            className="flex-1 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:bg-neutral-700 hover:border-primary-500 transition-colors"
          >
            Unset Full Number
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => bulkUpdate({ isHorizontallyCentered: true })}
            className="flex-1 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:bg-neutral-700 hover:border-primary-500 transition-colors"
          >
            Center All
          </button>
          <button
            onClick={() => bulkUpdate({ isHorizontallyCentered: false })}
            className="flex-1 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:bg-neutral-700 hover:border-primary-500 transition-colors"
          >
            Uncenter All
          </button>
        </div>
      </div>

      {/* Section: Styles - only show if copiedStyles exists */}
      {copiedStyles && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-neutral-800"></div>
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Styles</span>
            <div className="h-px flex-1 bg-neutral-800"></div>
          </div>

          <button
            onClick={onPasteStyles}
            className="w-full py-1.5 px-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Paste Styles ({copiedStyles.size}px, {copiedStyles.color})
          </button>
        </div>
      )}

      {/* Section: Actions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-neutral-800"></div>
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Actions</span>
          <div className="h-px flex-1 bg-neutral-800"></div>
        </div>

        <button
          onClick={() => {
            selectedFields.forEach(f => onDelete(f.id));
          }}
          className="w-full py-1.5 px-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs transition-colors"
        >
          Delete {selectedFields.length} Fields
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="pt-2 border-t border-neutral-800">
        <p className="text-[10px] text-neutral-500 text-center">
          ⌘⇧L/C/R align • ⌘⇧T/M/B vertical • ⌘⇧H/V distribute
        </p>
      </div>
    </div>
  );
}
