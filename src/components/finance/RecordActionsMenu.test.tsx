// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordActionsMenu } from './RecordActionsMenu';

describe('RecordActionsMenu', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses Editar as the default primary label when a callback exists', () => {
    render(
      <RecordActionsMenu
        label="Academia"
        onPrimaryAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ações de Academia' }));

    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeTruthy();
  });

  it('shows the supplied primary action alongside delete', () => {
    const onPrimaryAction = vi.fn();
    render(
      <RecordActionsMenu
        label="Academia"
        primaryActionLabel="Marcar como pago"
        onPrimaryAction={onPrimaryAction}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ações de Academia' }));
    const primaryAction = screen.getByRole('button', { name: 'Marcar como pago' });

    expect(primaryAction).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeTruthy();

    fireEvent.click(primaryAction);

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull();
  });

  it('renders a delete-only menu when no primary callback exists', () => {
    render(
      <RecordActionsMenu
        label="Abatimento: Aluguel"
        deleteLabel="Excluir abatimento"
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ações de Abatimento: Aluguel' }));

    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Marcar como/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Excluir abatimento' })).toBeTruthy();
  });

  it('confirms and invokes delete from a delete-only menu', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <RecordActionsMenu
        label="Abatimento: Aluguel"
        deleteLabel="Excluir abatimento"
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ações de Abatimento: Aluguel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir abatimento' }));

    expect(confirm).toHaveBeenCalledWith(
      'Excluir Abatimento: Aluguel? Essa ação não pode ser desfeita.',
    );
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Excluir abatimento' })).toBeNull());
  });
});
