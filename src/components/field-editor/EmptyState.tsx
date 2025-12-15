export function EmptyState() {
  return (
    <div key="empty" className="field-editor p-4 animate-slide-in-right">
      <h3 className="text-sm font-medium text-neutral-400 mb-4">Properties</h3>
      <div className="text-sm text-neutral-500 text-center py-8">
        <svg className="w-12 h-12 mx-auto mb-3 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <p>Select a text field to edit its properties</p>
        <p className="text-xs mt-2 text-neutral-600">
          Click on a field or use the Text tool (T) to add new fields
        </p>
      </div>
    </div>
  );
}
