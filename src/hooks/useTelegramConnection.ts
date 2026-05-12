import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TelegramConnection } from '../types/financial';

export function useTelegramConnection() {
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnection = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('telegram_connections')
        .select('id, user_id, link_token_hash, token_encrypted, token_generated_at, telegram_user_id, telegram_chat_id, linked_at, created_at, updated_at')
        .maybeSingle();

      if (error) throw error;

      setConnection((data as TelegramConnection | null) ?? null);
    } catch (error) {
      console.error('Error fetching Telegram connection:', error);
      setConnection(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchConnection();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchConnection]);

  return {
    connection,
    isLoading,
    refetch: fetchConnection,
  };
}
