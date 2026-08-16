// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
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

    const trigger = screen.getByRole('button', { name: 'Ações de Academia' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');

    fireEvent.click(trigger);

    const menu = screen.getByRole('menu', { name: 'Ações de Academia' });
    expect(menu.id).not.toBe('');
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);

    const edit = screen.getByRole('menuitem', { name: 'Editar' });
    expect(edit).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeTruthy();
    expect(document.activeElement).toBe(edit);
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

    const trigger = screen.getByRole('button', { name: 'Ações de Academia' });
    fireEvent.click(trigger);
    const primaryAction = screen.getByRole('menuitem', { name: 'Marcar como pago' });

    expect(primaryAction).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeTruthy();

    fireEvent.click(primaryAction);

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
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

    expect(screen.queryByRole('menuitem', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Marcar como/ })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Excluir abatimento' })).toBeTruthy();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    render(
      <RecordActionsMenu
        label="Academia"
        onPrimaryAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Ações de Academia' });

    fireEvent.click(trigger);
    const firstItem = screen.getByRole('menuitem', { name: 'Editar' });
    expect(document.activeElement).toBe(firstItem);

    fireEvent.keyDown(firstItem, { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
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

    const trigger = screen.getByRole('button', { name: 'Ações de Abatimento: Aluguel' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir abatimento' }));

    expect(confirm).toHaveBeenCalledWith(
      'Excluir Abatimento: Aluguel? Essa ação não pode ser desfeita.',
    );
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps a failed delete open, enabled, and focused for retry', async () => {
    const error = new Error('delete failed');
    const onDelete = vi.fn().mockRejectedValue(error);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <RecordActionsMenu
        label="Abatimento: Aluguel"
        deleteLabel="Excluir abatimento"
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ações de Abatimento: Aluguel' }));
    const deleteItem = screen.getByRole('menuitem', { name: 'Excluir abatimento' });
    fireEvent.click(deleteItem);

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Não foi possível excluir. Tente novamente.'));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith('Error deleting record:', error);
    expect(screen.getByRole('menu')).toBeTruthy();
    expect((deleteItem as HTMLButtonElement).disabled).toBe(false);
    expect(document.activeElement).toBe(deleteItem);
  });

  it('uses the focus fallback when a successful delete unmounts its trigger', async () => {
    const focusFallback = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    function Harness() {
      const [isVisible, setIsVisible] = useState(true);
      return isVisible ? (
        <RecordActionsMenu
          label="Academia"
          onDelete={async () => setIsVisible(false)}
          onDeleteFocusFallback={focusFallback}
        />
      ) : <button type="button">Destino estável</button>;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Academia' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Excluir' }));

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(focusFallback).toHaveBeenCalledTimes(1);
  });

  it('does not use the delete fallback when a primary action unmounts the menu', () => {
    const focusFallback = vi.fn();

    function Harness() {
      const [isVisible, setIsVisible] = useState(true);
      return isVisible ? (
        <RecordActionsMenu
          label="Academia"
          onPrimaryAction={() => setIsVisible(false)}
          onDelete={vi.fn()}
          onDeleteFocusFallback={focusFallback}
        />
      ) : <button type="button">Destino estável</button>;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Academia' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));

    expect(screen.queryByRole('menu')).toBeNull();
    expect(focusFallback).not.toHaveBeenCalled();
  });
});
