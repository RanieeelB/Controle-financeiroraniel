import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

interface RecordActionsMenuProps {
  label: string;
  deleteLabel?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onDelete: () => Promise<void>;
  onDeleteFocusFallback?: () => void;
}

export function RecordActionsMenu({
  label,
  deleteLabel = 'Excluir',
  primaryActionLabel,
  onPrimaryAction,
  onDelete,
  onDeleteFocusFallback,
}: RecordActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<'trigger' | 'delete' | null>(null);
  const isDeleteFocusPendingRef = useRef(false);
  const deleteFocusFallbackRef = useRef(onDeleteFocusFallback);

  useEffect(() => {
    deleteFocusFallbackRef.current = onDeleteFocusFallback;
  }, [onDeleteFocusFallback]);

  useEffect(() => () => {
    if (isDeleteFocusPendingRef.current) {
      deleteFocusFallbackRef.current?.();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
      ?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isDeleting || !pendingFocusRef.current) return;

    const target = pendingFocusRef.current;
    pendingFocusRef.current = null;
    isDeleteFocusPendingRef.current = false;
    if (target === 'trigger') {
      buttonRef.current?.focus();
    } else {
      deleteButtonRef.current?.focus();
    }
  });

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || isDeleting) return;
      event.preventDefault();
      pendingFocusRef.current = 'trigger';
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDeleting, isOpen]);

  function handlePrimaryAction() {
    pendingFocusRef.current = 'trigger';
    setIsOpen(false);
    if (onPrimaryAction) {
      onPrimaryAction();
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    isDeleteFocusPendingRef.current = true;
    pendingFocusRef.current = 'trigger';
    setIsDeleting(true);
    try {
      await onDelete();
      pendingFocusRef.current = 'trigger';
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting record:', error);
      window.alert('Não foi possível excluir. Tente novamente.');
      isDeleteFocusPendingRef.current = false;
      pendingFocusRef.current = 'delete';
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Ações de ${label}`}
        className="text-on-surface-variant hover:text-primary transition-all p-xs rounded-md hover:bg-surface-variant"
        disabled={isDeleting}
        onClick={() => {
          if (isOpen) pendingFocusRef.current = 'trigger';
          setIsOpen(!isOpen);
        }}
        type="button"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div
          id={menuId}
          ref={menuRef}
          aria-label={`Ações de ${label}`}
          className="absolute right-0 top-full mt-1 z-50 w-[11rem] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high shadow-xl"
          role="menu"
        >
          {onPrimaryAction && (
            <button
              className="flex w-full items-center gap-sm px-md py-sm text-left text-[14px] text-primary hover:bg-primary/10 disabled:opacity-60"
              disabled={isDeleting}
              onClick={handlePrimaryAction}
              role="menuitem"
              type="button"
            >
              <Pencil size={16} />
              {primaryActionLabel || 'Editar'}
            </button>
          )}
          <button
            ref={deleteButtonRef}
            className="flex w-full items-center gap-sm px-md py-sm text-left text-[14px] text-error hover:bg-error/10 disabled:opacity-60"
            disabled={isDeleting}
            onClick={handleDelete}
            role="menuitem"
            type="button"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Excluindo...' : deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}
