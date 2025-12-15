import type { EditorTextField } from '../../../types';

interface PageSectionProps {
  field: EditorTextField;
  numPages: number;
  currentPage: number;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
}

export function PageSection({ field, numPages, currentPage, onUpdate }: PageSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Page</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Page Type</label>
        <div className="relative mb-1.5">
          <select
            value={field.pageReference ? 'dynamic' : 'fixed'}
            onChange={(e) => {
              if (e.target.value === 'fixed') {
                onUpdate(field.id, {
                  page: currentPage - 1,
                  pageReference: undefined,
                });
              } else {
                onUpdate(field.id, {
                  pageReference: '{length - 1}',
                });
              }
            }}
            className="w-full pl-2.5 pr-7 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-primary-500 appearance-none"
          >
            <option value="fixed">Fixed Page</option>
            <option value="dynamic">Dynamic Reference</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {field.pageReference ? (
          <input
            type="text"
            value={field.pageReference}
            onChange={(e) =>
              onUpdate(field.id, {
                pageReference: e.target.value,
              })
            }
            className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-primary-500"
            placeholder="{length - 1}"
          />
        ) : (
          <div className="relative">
            <select
              value={field.page}
              onChange={(e) =>
                onUpdate(field.id, {
                  page: parseInt(e.target.value),
                })
              }
              className="w-full pl-2.5 pr-7 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-primary-500 appearance-none"
            >
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
        )}
      </div>
    </div>
  );
}
