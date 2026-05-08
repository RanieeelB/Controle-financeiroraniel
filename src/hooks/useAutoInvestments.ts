import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createInvestmentDeposit } from '../lib/financialActions';
import type { Investment } from '../types/financial';

export function useAutoInvestments() {
  useEffect(() => {
    async function processAutoInvestments() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const userId = session.user.id;
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      // 1. Fetch investments that have a monthly contribution and haven't been processed this month
      const { data: investments, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .gt('monthly_contribution', 0)
        .or(`last_auto_contribution_at.is.null,last_auto_contribution_at.lt.${currentMonthKey}`);

      if (error || !investments || investments.length === 0) return;

      for (const rawInv of investments) {
        // Convert string decimals from database to numbers for calculations
        const investment: Investment = {
          ...rawInv,
          amount_invested: Number(rawInv.amount_invested),
          current_value: Number(rawInv.current_value),
          monthly_contribution: Number(rawInv.monthly_contribution),
        } as any;

        try {
          // 2. Create the deposit
          await createInvestmentDeposit({
            investment,
            investmentId: investment.id,
            amount: investment.monthly_contribution,
            date: currentMonthKey, // Set to the 1st of the month
            notes: 'Aporte mensal automático (Dia 1)',
          });

          // 3. Update the last_auto_contribution_at date
          await supabase
            .from('investments')
            .update({ last_auto_contribution_at: currentMonthKey })
            .eq('id', investment.id);

          console.log(`Auto investment processed for: ${investment.name}`);
        } catch (err) {
          console.error(`Failed to process auto investment for ${investment.name}:`, err);
        }
      }
    }

    // Run once on load
    processAutoInvestments();
  }, []);
}
