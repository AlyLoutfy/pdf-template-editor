import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel",
  variant = 'warning' 
}: ConfirmModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Delay to allow DOM insertion before animating in
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false); // Start exit animation
      // Wait for animation to finish before removing from DOM
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  const styles = {
    danger: {
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-600 hover:bg-red-500',
      buttonShadow: 'shadow-red-900/20',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    warning: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      buttonBg: 'bg-amber-600 hover:bg-amber-500 text-neutral-900',
      buttonShadow: 'shadow-amber-900/20',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-600 hover:bg-blue-500',
      buttonShadow: 'shadow-blue-900/20',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }[variant];

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'
      }`}
    >
      <div 
        className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
          isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
              {styles.icon}
              <div className={`absolute inset-0 ${styles.iconBg} rounded-full animate-ping opacity-20`} />
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
          </div>
          <p className="text-neutral-400 leading-relaxed mb-8 ml-14">
            {message}
          </p>
          <div className="flex justify-end gap-3 mt-8 relative z-50">
            <button
              onMouseDown={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 onClose();
              }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              onMouseDown={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 onConfirm();
                 onClose();
              }}
              className={`px-4 py-2 ${styles.buttonBg} font-bold rounded-lg cursor-pointer shadow-lg`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
