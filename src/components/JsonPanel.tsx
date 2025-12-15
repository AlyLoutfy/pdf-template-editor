import { useMemo, useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { exportToLegacyJSON, exportToV2JSON } from '../utils/jsonExporter';

export function JsonPanel() {
  const {
    textFields,
    imageFields,
    paymentPlans,
    numPages,
    jsonTab,
    setJsonTab,
  } = useEditorStore();

  const [copied, setCopied] = useState(false);

  const legacyJson = useMemo(
    () => exportToLegacyJSON(textFields, imageFields, paymentPlans, numPages),
    [textFields, imageFields, paymentPlans, numPages]
  );

  const v2Json = useMemo(
    () => exportToV2JSON(textFields, imageFields, paymentPlans, numPages),
    [textFields, imageFields, paymentPlans, numPages]
  );

  const currentJson = jsonTab === 'legacy' ? legacyJson : v2Json;
  const formattedJson = JSON.stringify(currentJson, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-1 bg-neutral-800 rounded-md p-0.5">
          <button
            onClick={() => setJsonTab('legacy')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              jsonTab === 'legacy'
                ? 'bg-primary-500 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Legacy JSON
          </button>
          <button
            onClick={() => setJsonTab('v2')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              jsonTab === 'v2'
                ? 'bg-primary-500 text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            V2 JSON
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {textFields.length} text fields, {imageFields.length} images
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-neutral-100 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* JSON Content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs font-mono text-neutral-300 leading-relaxed">
          <code>{formattedJson}</code>
        </pre>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-neutral-800 text-xs text-neutral-500">
        {jsonTab === 'legacy' ? (
          <span>Compatible with existing offer generation system</span>
        ) : (
          <span>New V2 format - organized by page with hex colors</span>
        )}
      </div>
    </div>
  );
}






