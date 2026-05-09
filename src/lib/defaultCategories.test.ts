import { describe, expect, it } from 'vitest';
import {
  buildCategoryPayload,
  defaultCategories,
  getMissingDefaultCategories,
} from './defaultCategories';

describe('defaultCategories', () => {
  it('includes the requested expense categories', () => {
    const names = defaultCategories
      .filter(category => category.type !== 'entrada')
      .map(category => category.name);

    expect(names).toEqual(expect.arrayContaining(['Estudo', 'Transporte', 'Lazer', 'iFood']));
  });

  it('includes useful income categories', () => {
    const names = defaultCategories
      .filter(category => category.type !== 'gasto')
      .map(category => category.name);

    expect(names).toEqual(expect.arrayContaining(['Salario', 'Freela', 'Rendimentos']));
  });

  it('uses valid category types and colors', () => {
    expect(defaultCategories.every(category => ['entrada', 'gasto', 'ambos'].includes(category.type))).toBe(true);
    expect(defaultCategories.every(category => /^#[0-9a-f]{6}$/i.test(category.color))).toBe(true);
  });

  it('normalizes a category creation payload', () => {
    expect(buildCategoryPayload({
      name: '  Curso ',
      type: 'gasto',
      color: '#7bd0ff',
      icon: '',
    })).toEqual({
      name: 'Curso',
      type: 'gasto',
      color: '#7bd0ff',
      icon: 'tag',
    });
  });

  it('finds default categories that do not exist yet', () => {
    const missing = getMissingDefaultCategories([
      { name: 'Estudo', type: 'gasto' },
      { name: 'Outros', type: 'ambos' },
    ]);

    expect(missing.some(category => category.name === 'Estudo' && category.type === 'gasto')).toBe(false);
    expect(missing.some(category => category.name === 'Transporte' && category.type === 'gasto')).toBe(true);
  });
});
