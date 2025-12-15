import { Link, useParams, useLocation } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { clsx } from 'clsx';
import { useState } from 'react';

export function ProjectSidebar() {
  const { developers, compounds } = useProjectStore();
  const { developerId, compoundId } = useParams();
  const location = useLocation();
  const [expandedDevs, setExpandedDevs] = useState<Record<string, boolean>>({});

  const toggleExpand = (devId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDevs(prev => ({ ...prev, [devId]: !prev[devId] }));
  };

  // Auto-expand active developer
  if (developerId && !expandedDevs[developerId] && expandedDevs[developerId] === undefined) {
    setExpandedDevs(prev => ({ ...prev, [developerId]: true }));
  }
  // Auto-expand developer of active compound
  if (compoundId) {
    const comp = compounds.find(c => c.id === compoundId);
    if (comp && !expandedDevs[comp.developerId] && expandedDevs[comp.developerId] === undefined) {
      setExpandedDevs(prev => ({ ...prev, [comp.developerId]: true }));
    }
  }

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-neutral-800">
        <Link to="/" className="text-lg font-bold text-white flex items-center gap-2 hover:text-primary-400 transition-colors">
          <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          PDF Editor
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Developers
        </div>
        
        {developers.map(dev => {
          const devCompounds = compounds.filter(c => c.developerId === dev.id);
          const isExpanded = expandedDevs[dev.id] || false;
          const isActive = location.pathname === `/developer/${dev.id}`;

          return (
            <div key={dev.id} className="mb-1">
              <div className={clsx(
                "flex items-center gap-1 rounded-md transition-colors group",
                isActive ? "bg-primary-900/20 text-blue-200" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              )}>
                <button 
                  onClick={(e) => toggleExpand(dev.id, e)}
                  className="p-1.5 hover:bg-white/5 rounded"
                >
                   <svg className={clsx("w-3 h-3 transition-transform", isExpanded ? "rotate-90" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                </button>
                <Link to={`/developer/${dev.id}`} className="flex-1 py-1.5 text-sm font-medium truncate block">
                  {dev.name}
                </Link>
              </div>

              {isExpanded && (
                <div className="ml-4 pl-2 border-l border-neutral-800 mt-1 space-y-0.5">
                   {devCompounds.length === 0 && (
                     <div className="text-xs text-neutral-600 py-1 pl-2 italic">No compounds</div>
                   )}
                   {devCompounds.map(comp => (
                     <Link 
                       key={comp.id}
                       to={`/compound/${comp.id}`}
                       className={clsx(
                         "block py-1.5 px-2 rounded-md text-sm truncate transition-colors",
                         location.pathname === `/compound/${comp.id}` 
                           ? "bg-neutral-800 text-primary-400" 
                           : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                       )}
                     >
                       {comp.name}
                     </Link>
                   ))}
                </div>
              )}
            </div>
          );
        })}

        {developers.length === 0 && (
           <div className="text-sm text-neutral-600 text-center py-4">
             No developers yet.
             <br />
             Create one in the dashboard.
           </div>
        )}
      </div>
    </div>
  );
}
