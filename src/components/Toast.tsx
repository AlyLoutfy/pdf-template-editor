import { useEffect, useState } from 'react';
import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'error';
  visible: boolean;
  show: (message: string, type?: 'success' | 'info' | 'error') => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  show: (message, type = 'info') => {
    // Clear any existing timeout (basic handling, ideally we'd store the timer ID)
    set({ message, type, visible: true });
    // Reset visibility after 4s
    setTimeout(() => set((state) => (state.message === message ? { visible: false } : state)), 5000);
  },
  hide: () => set({ visible: false }),
}));

export function Toast() {
  const { message, type, visible, hide } = useToast();
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Small timeout to ensure DOM mount + reflow happens before we switch class
      // requestAnimationFrame sometimes isn't enough in React 18 strict mode / fast renders
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setShouldRender(false), 500); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  const styles = {
    // ... (keep maps same, but putting them here for context of the replacement)
    success: {
      bg: 'bg-neutral-900/90',
      border: 'border-emerald-500/50',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    info: {
      bg: 'bg-neutral-900/90',
      border: 'border-blue-500/50',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      bg: 'bg-neutral-900/90',
      border: 'border-red-500/50',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  }[type];

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] perspective-1000`}
    >
      <div
        onClick={hide}
        className={`
          flex items-center gap-3 pl-2 pr-4 py-2 rounded-full cursor-pointer
          backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.5)] border
          transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform
          ${styles.bg} ${styles.border}
          ${isAnimatingIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-90 pointer-events-none'}
        `}
      >
        <div className={`p-1.5 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
           {styles.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-neutral-100 leading-tight select-none">{message}</span>
        </div>
        
        {/* Close Button without separator */}
        <button className="text-neutral-500 hover:text-white transition-colors ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
    </div>
  );
}

