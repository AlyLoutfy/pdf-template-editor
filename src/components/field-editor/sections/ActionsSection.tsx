
interface ActionsSectionProps {
  onCopyStyles: () => void;
  onPasteStyles: () => void;
  onDelete: () => void;
  hasCopiedStyles: boolean;
}

export function ActionsSection({ onCopyStyles, onPasteStyles, onDelete, hasCopiedStyles }: ActionsSectionProps) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Actions</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onCopyStyles}
          className="flex-1 py-1.5 px-2 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
          title="Copy styles (⌘C)"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
        {hasCopiedStyles && (
             <button
              onClick={onPasteStyles}
              className="flex-1 py-1.5 px-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
              title="Paste styles (⌘V)"
             >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Paste
             </button>
        )}
      </div>

      <button
        onClick={onDelete}
        className="w-full py-1.5 px-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs transition-colors mt-2"
      >
        Delete Field
      </button>
    </div>
  );
}
