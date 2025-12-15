import type { EditorTextField } from '../../../types';

interface PositionSectionProps {
  field: EditorTextField;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
}

export function PositionSection({ field, onUpdate }: PositionSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Position</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">X Position</label>
          <input
            type="number"
            value={Math.round(field.x)}
            onChange={(e) =>
              onUpdate(field.id, {
                x: parseInt(e.target.value) || 0,
                isHorizontallyCentered: false,
              })
            }
            disabled={field.isHorizontallyCentered}
            className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-primary-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Y Position</label>
          <input
            type="number"
            value={Math.round(field.y)}
            onChange={(e) =>
              onUpdate(field.id, {
                y: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="horizontalCenter"
          checked={field.isHorizontallyCentered}
          onChange={(e) =>
            onUpdate(field.id, {
              isHorizontallyCentered: e.target.checked,
            })
          }
          className="w-3.5 h-3.5 rounded bg-neutral-800 border-neutral-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
        />
        <label htmlFor="horizontalCenter" className="text-xs text-neutral-300">
          Center Horizontally
        </label>
      </div>
    </div>
  );
}
