import type { EditorTextField } from '../../../types';

interface TypographySectionProps {
  field: EditorTextField;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
}

export function TypographySection({ field, onUpdate }: TypographySectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Typography</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      <div>
        <label className="block text-xs text-neutral-400 mb-1">
          Font Size: {field.size}px
        </label>
        <input
          type="range"
          min="8"
          max="72"
          value={field.size}
          onChange={(e) =>
            onUpdate(field.id, {
              size: parseInt(e.target.value),
            })
          }
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
              style={{ backgroundColor: field.color }}
            />
            <input
              type="color"
              value={field.color}
              onChange={(e) =>
                onUpdate(field.id, { color: e.target.value })
              }
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
          <input
            type="text"
            value={field.color}
            onChange={(e) =>
              onUpdate(field.id, { color: e.target.value })
            }
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
                onClick={() =>
                  onUpdate(field.id, { color })
                }
                className="flex-1 h-7 rounded-md border-2 border-neutral-600 hover:border-primary-400 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
