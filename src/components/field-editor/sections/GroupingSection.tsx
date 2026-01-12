import type { EditorTextField } from '../../../types';

interface GroupingSectionProps {
  field: EditorTextField;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
}

export function GroupingSection({ field, onUpdate, onCreateGroup, onUngroup }: GroupingSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Grouping / Chain</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      {field.groupId ? (
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Status</span>
              <span className="text-xs text-primary-400 font-medium">In Group</span>
           </div>
           
           <div className="flex gap-2">
              <div className="flex-1">
                 <label className="block text-xs text-neutral-400 mb-1">Order in Chain</label>
                 <input
                   type="number"
                   value={field.orderInGroup ?? ''}
                   onChange={(e) => {
                     const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                     onUpdate(field.id, { orderInGroup: val });
                   }}
                   placeholder="Auto"
                   className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-neutral-600"
                 />
              </div>
              <div className="flex items-end">
                <button
                  onClick={onUngroup}
                  className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-400 rounded text-xs transition-colors h-[30px]"
                >
                  Ungroup
                </button>
              </div>
           </div>
           <p className="text-[10px] text-neutral-500">
             If order is left empty, elements are sorted by Y position (Auto).
           </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
           <div className="text-xs text-neutral-500">Not part of any chain.</div>
           <button
             onClick={onCreateGroup}
             className="w-full py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:text-primary-400 text-neutral-300 rounded text-xs transition-colors"
           >
             Create Chain / Assign Order
           </button>
        </div>
      )}
    </div>
  );
}
