import type { ReactNode } from 'react';
interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      <div className="flex-1 overflow-auto relative flex flex-col min-w-0">
         {children}
      </div>
    </div>
  );
}
