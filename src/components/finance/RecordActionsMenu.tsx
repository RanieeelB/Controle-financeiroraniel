import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface RecordActionsMenuProps {
  label: string;
  deleteLabel?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onDelete: () => Promise<void>;
}

export function RecordActionsMenu({
  label,
  deleteLabel = 'Excluir',
  primaryActionLabel,
  onPrimaryAction,
  onDelete,
}: RecordActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  function handlePrimaryAction() {
    setIsOpen(false);
    if (onPrimaryAction) {
      onPrimaryAction();
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting record:', error);
      window.alert('Não foi possível excluir. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-label={`Ações de ${label}`}
        className="text-on-surface-variant hover:text-primary transition-all p-xs rounded-md hover:bg-surface-variant"
        disabled={isDeleting}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 z-50 w-[11rem] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high shadow-xl"
        >
          <button
            className="flex w-full items-center gap-sm px-md py-sm text-left text-[14px] text-primary hover:bg-primary/10 disabled:opacity-60"
            disabled={isDeleting}
            onClick={handlePrimaryAction}
            type="button"
          >
            <Pencil size={16} />
            {primaryActionLabel || 'Editar'}
          </button>
          <button
            className="flex w-full items-center gap-sm px-md py-sm text-left text-[14px] text-error hover:bg-error/10 disabled:opacity-60"
            disabled={isDeleting}
            onClick={handleDelete}
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