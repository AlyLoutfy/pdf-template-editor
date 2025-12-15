import { useState, useEffect } from 'react';
import type { EditorTextField } from '../../../types';

interface BehaviorSectionProps {
  field: EditorTextField;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
}

export function BehaviorSection({ field, onUpdate }: BehaviorSectionProps) {
  // Extract variable from content (e.g., "{unitId}" from "Unit: {unitId}")
  const extractVariableFromContent = (content: string): string | null => {
    const match = content.match(/\{([^}]+)\}/);
    return match ? match[1] : null;
  };

  const contentVariable = extractVariableFromContent(field.content);
  const contentVariableFormatted = contentVariable ? `{${contentVariable}}` : null;
  
  // State to track if user explicitly unchecked the checkbox
  const [isExplicitlyUnchecked, setIsExplicitlyUnchecked] = useState(false);
  
  // State for custom requires (when checkbox is unchecked)
  const [customRequires, setCustomRequires] = useState(field.requires || '');

  // Update customRequires when field changes
  useEffect(() => {
    if (field) {
      const contentVar = extractVariableFromContent(field.content);
      const contentVarFormatted = contentVar ? `{${contentVar}}` : null;
      if (field.requires && field.requires !== contentVarFormatted) {
        setCustomRequires(field.requires);
        setIsExplicitlyUnchecked(true);
      } else {
        setIsExplicitlyUnchecked(false);
        setCustomRequires('');
      }
    }
  }, [field.id, field.content, field.requires]); 

  // Check if requires matches the content variable (default to true if no requires set and content has variable)
  const isUsingContentVariable = Boolean(contentVariableFormatted && 
    !isExplicitlyUnchecked &&
    (field.requires === contentVariableFormatted || 
     (field.requires === undefined || field.requires === '')));

  // Auto-update requires when content variable changes and we're using content variable
  useEffect(() => {
    if (isUsingContentVariable && contentVariableFormatted && 
        field.requires !== contentVariableFormatted && !isExplicitlyUnchecked) {
      onUpdate(field.id, {
        requires: contentVariableFormatted,
      });
    }
  }, [contentVariableFormatted, field.id, isUsingContentVariable, isExplicitlyUnchecked]); 

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Behavior</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      {/* Conditional Display */}
      <div className="space-y-2">
        {contentVariableFormatted ? (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useContentVariable"
              checked={isUsingContentVariable}
              onChange={(e) => {
                if (e.target.checked) {
                  // Use content variable
                  setIsExplicitlyUnchecked(false);
                  onUpdate(field.id, {
                    requires: contentVariableFormatted,
                  });
                } else {
                  // Use custom variable (keep current or clear)
                  setIsExplicitlyUnchecked(true);
                  onUpdate(field.id, {
                    requires: customRequires || undefined,
                  });
                }
              }}
              className="w-3.5 h-3.5 rounded bg-neutral-800 border-neutral-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="useContentVariable" className="text-xs text-neutral-300 flex-1">
              Show only if {isUsingContentVariable ? contentVariableFormatted : (customRequires || field.requires || contentVariableFormatted)} exists
            </label>
          </div>
        ) : (
          <p className="text-[10px] text-neutral-500 italic">
            Add a variable to content to enable conditional display
          </p>
        )}
        
        {contentVariableFormatted && !isUsingContentVariable && (
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Custom variable
            </label>
            <input
              type="text"
              value={customRequires}
              onChange={(e) => {
                const value = e.target.value;
                setCustomRequires(value);
                setIsExplicitlyUnchecked(true);
                onUpdate(field.id, {
                  requires: value || undefined,
                });
              }}
              className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 font-mono focus:outline-none focus:border-primary-500"
              placeholder="{variableName}"
            />
          </div>
        )}
      </div>

      {/* Formatting */}
      <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
        <input
          type="checkbox"
          id="fullNumber"
          checked={field.isFullNumber}
          onChange={(e) =>
            onUpdate(field.id, {
              isFullNumber: e.target.checked,
            })
          }
          className="w-3.5 h-3.5 rounded bg-neutral-800 border-neutral-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
        />
        <label htmlFor="fullNumber" className="text-xs text-neutral-300">
          Format as full number (with separators)
        </label>
      </div>
    </div>
  );
}
