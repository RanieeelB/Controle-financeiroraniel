import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

export interface ModalShellProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalShell({ title, subtitle, onClose, children }: ModalShellProps) {
  useLockBodyScroll();

  return createPortal(
    <div className="fixed inset-0 z-[999] isolate flex items-stretch sm:items-center justify-center bg-background/85 backdrop-blur-md p-0 sm:p-md overflow-hidden">
      <div className="w-full sm:max-w-[36rem] h-[100dvh] sm:h-auto sm:max-h-[90dvh] bg-surface-container-low border border-outline-variant rounded-none sm:rounded-xl shadow-2xl overflow-hidden relative flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
        <div className="flex items-start justify-between gap-md px-md sm:px-lg py-md border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h2 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-surface">{title}</h2>
            <p className="font-body-md text-[14px] sm:text-[15px] text-on-surface-variant">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Fechar modal"
          >
            <X size={22} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
