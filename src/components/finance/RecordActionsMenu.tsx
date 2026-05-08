import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface RecordActionsMenuProps {
  label: string;
  deleteLabel?: string;
  onDelete: () => Promise<void>;
}

export function RecordActionsMenu({ label, deleteLabel = 'Excluir', onDelete }: RecordActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = 176;
    const menuHeight = 92;
    const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
    const opensAbove = rect.bottom + menuHeight + 8 > window.innerHeight;
    const top = opensAbove ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4;

    setMenuPosition({ top, left });
    setIsOpen(true);
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
      window.alert('Não foi possível excluir este lançamento. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="inline-flex justify-end">
      <button
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-label={`Ações de ${label}`}
        className="text-on-surface-variant hover:text-primary transition-all p-xs rounded-md hover:bg-surface-variant"
        disabled={isDeleting}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        type="button"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 w-[11rem] overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high shadow-xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            className="flex w-full items-center gap-sm px-md py-sm text-left text-[14px] text-on-surface-variant cursor-not-allowed"
            disabled
            type="button"
          >
            <Pencil size={16} />
            Editar em breve
          </button>
          <button
            className="flex w-full items-center gap-sm px-md py-sm text-left text-[14px] text-error hover:bg-error/10 disabled:cursor-wait disabled:opacity-60"
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
