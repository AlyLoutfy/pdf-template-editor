import { useState, useEffect } from 'react';
import { type EditorTextField, AVAILABLE_VARIABLES } from '../../../types';
import { replacePlaceholders } from '../../../utils/dummyData';

interface ContentSectionProps {
  field: EditorTextField;
  onUpdate: (id: string, updates: Partial<EditorTextField>) => void;
}

export function ContentSection({ field, onUpdate }: ContentSectionProps) {
  const [isVariableDropdownOpen, setIsVariableDropdownOpen] = useState(false);

  // Close dropdown when selected field changes
  useEffect(() => {
    setIsVariableDropdownOpen(false);
  }, [field.id]);

  // Group variables by category
  const variablesByCategory = AVAILABLE_VARIABLES.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_VARIABLES>);

  // Get all available variable names for validation
  const availableVariableNames = new Set(AVAILABLE_VARIABLES.map(v => v.var));

  // Parse content and highlight valid/invalid variables
  const parseContentWithVariables = (content: string) => {
    const parts: Array<{ text: string; isVariable: boolean; isValid: boolean; variableName?: string }> = [];
    const regex = /\{([^}]+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: content.substring(lastIndex, match.index),
          isVariable: false,
          isValid: false,
        });
      }
      
      const variableName = match[1];
      const variableWithBraces = `{${variableName}}`;
      const isValid = availableVariableNames.has(variableWithBraces);
      parts.push({
        text: match[0],
        isVariable: true,
        isValid,
        variableName,
      });
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < content.length) {
      parts.push({
        text: content.substring(lastIndex),
        isVariable: false,
        isValid: false,
      });
    }
    
    return parts.length > 0 ? parts : [{ text: content, isVariable: false, isValid: false }];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-neutral-800"></div>
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Content</span>
        <div className="h-px flex-1 bg-neutral-800"></div>
      </div>
      
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Text Content</label>
        <div className="relative">
          {/* Invisible input for actual value */}
          <input
            type="text"
            value={field.content}
            onChange={(e) => {
              onUpdate(field.id, { content: e.target.value });
            }}
            className="absolute inset-0 w-full px-2.5 py-1.5 bg-transparent text-transparent caret-neutral-200 text-xs font-mono focus:outline-none z-10"
            placeholder=""
          />
          {/* Syntax-highlighted overlay */}
          <div
            className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs font-mono min-h-[32px] pointer-events-none"
          >
            {field.content ? (
              parseContentWithVariables(field.content).map((part, index) => {
                if (part.isVariable) {
                  return (
                    <span
                      key={index}
                      className={part.isValid ? 'text-green-400' : 'text-red-400'}
                    >
                      {part.text}
                    </span>
                  );
                }
                return <span key={index} className="text-neutral-200">{part.text}</span>;
              })
            ) : (
              <span className="text-neutral-500">e.g. &quot;Offer Issued: {'{issuanceDate}'}&quot;</span>
            )}
          </div>
        </div>
        
        {/* Preview with actual values */}
        {field.content && (
          <div className="mt-1.5 px-2 py-1 bg-neutral-950 rounded border border-neutral-800">
            <div className="text-[9px] text-neutral-500 mb-0.5">Preview:</div>
            <div 
              className="text-xs break-words text-white leading-tight"
              style={{ fontSize: `${Math.min(field.size * 0.6, 13)}px` }}
            >
              {replacePlaceholders(field.content) || <span className="text-neutral-600 italic">Empty</span>}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <button
            onClick={() => setIsVariableDropdownOpen(!isVariableDropdownOpen)}
            className="w-full px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:bg-neutral-750 hover:border-neutral-600 transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Insert Variable
            </span>
            <svg className={`w-3 h-3 transition-transform ${isVariableDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {isVariableDropdownOpen && (
            <>
              <div 
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-md shadow-xl max-h-64 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {Object.entries(variablesByCategory).map(([category, vars]) => (
                  <div key={category} className="py-1">
                    <div className="px-3 py-1.5 text-[10px] font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-700">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    {vars.map((v) => (
                      <button
                        key={v.var}
                        onClick={() => {
                          const selectedVariable = v.var;
                          onUpdate(field.id, { 
                            content: selectedVariable,
                            requires: selectedVariable
                          });
                          setIsVariableDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsVariableDropdownOpen(false)}
              />
            </>
          )}
        </div>
        <button
          onClick={() => onUpdate(field.id, { content: '' })}
          className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 border border-neutral-700 rounded transition-colors"
          title="Clear content"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
