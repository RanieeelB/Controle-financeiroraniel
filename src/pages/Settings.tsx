import { useState, type FormEvent } from 'react';
import { CheckCircle, ChevronDown, Plus, Settings as SettingsIcon, Tag } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { createCategory } from '../lib/financialActions';
import type { Category } from '../types/financial';

type CategoryType = Category['type'];

const categoryColors = ['#75ff9e', '#7bd0ff', '#ffba79', '#ffb4ab', '#859585'];
const inputClass = 'w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-outline';
const labelClass = 'block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider';

export function Settings() {
  const { categories, isLoading, refetch } = useCategories();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('gasto');
  const [color, setColor] = useState(categoryColors[0]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Informe o nome da categoria.');
      return;
    }

    setIsSaving(true);
    try {
      await createCategory({ name, type, color });
      setName('');
      setType('gasto');
      setColor(categoryColors[0]);
      await refetch();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível criar a categoria.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-xl">
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-xl">
        <div className="flex items-start justify-between gap-lg mb-lg">
          <div className="flex items-center gap-md">
            <div className="bg-surface-variant p-md rounded-lg">
              <SettingsIcon size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="font-h1 text-[32px] font-semibold text-on-surface">Configurações</h2>
              <p className="font-body-md text-[16px] text-on-surface-variant">
                Ajustes simples para manter seus lançamentos organizados.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[24rem_1fr] gap-xl">
          <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-xl p-lg space-y-md">
            <div className="flex items-center gap-sm">
              <Plus size={20} className="text-primary" />
              <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Nova categoria</h3>
            </div>

            <label>
              <span className={labelClass}>Nome</span>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className={inputClass}
                placeholder="Ex: Academia"
              />
            </label>

            <label>
              <span className={labelClass}>Tipo</span>
              <div className="relative">
                <select
                  value={type}
                  onChange={event => setType(event.target.value as CategoryType)}
                  className={`${inputClass} appearance-none pr-xl`}
                >
                  <option value="entrada">Entrada</option>
                  <option value="gasto">Gasto</option>
                  <option value="ambos">Ambos</option>
                </select>
                <ChevronDown className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none mr-xs" size={18} />
              </div>
            </label>

            <div>
              <span className={labelClass}>Cor</span>
              <div className="flex gap-sm">
                {categoryColors.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`w-8 h-8 rounded-full border transition-transform ${color === option ? 'border-on-surface scale-110' : 'border-outline-variant'}`}
                    style={{ backgroundColor: option }}
                    aria-label={`Cor ${option}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle size={18} />
              <span>{isSaving ? 'Salvando...' : 'Criar categoria'}</span>
            </button>
          </form>

          <div className="bg-surface border border-outline-variant rounded-xl p-lg">
            <div className="flex items-center gap-sm mb-lg">
              <Tag size={20} className="text-primary" />
              <h3 className="font-h2 text-[20px] font-semibold text-on-surface">Categorias cadastradas</h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-md border border-outline-variant/60 rounded-lg px-md py-sm bg-background"
                  >
                    <div className="flex items-center gap-sm min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-on-surface truncate">{category.name}</span>
                    </div>
                    <span className="text-[12px] text-on-surface-variant uppercase">{category.type}</span>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="md:col-span-2 text-on-surface-variant text-center py-xl">
                    Nenhuma categoria cadastrada ainda.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
