import { useCallback, useEffect, useState } from 'react';
import { ensureDefaultCategories } from '../lib/financialActions';
import { supabase } from '../lib/supabase';
import type { Category } from '../types/financial';

export function useCategories(type?: 'entrada' | 'gasto') {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      await ensureDefaultCategories();

      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (type) {
        query = query.in('type', [type, 'ambos']);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCategories((data ?? []) as Category[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchCategories();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchCategories]);

  return { categories, isLoading, refetch: fetchCategories };
}
