import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { CheckCircle, Settings as SettingsIcon, Wallet, MessageCircle, ShieldCheck, Link2, Copy, ExternalLink, Calculator } from 'lucide-react';
import { upsertSalarySetting, createFinancialTransaction } from '../lib/financialActions';
import { parseCurrencyValue } from '../lib/financialPayloads';
import { useSalarySettings } from '../hooks/useSalarySettings';
import { useTelegramConnection } from '../hooks/useTelegramConnection';
import { supabase } from '../lib/supabase';

const inputClass = 'w-full bg-background border border-outline-variant rounded-lg px-md py-sm text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-outline';
const labelClass = 'block font-label-md text-[13px] font-semibold text-on-surface-variant mb-xs uppercase tracking-wider';

function getBrazilianHolidays(year: number, month: number): Set<string> {
  const holidays = new Set<string>();

  const fixed = [
    [0, 1], [3, 21], [4, 1], [8, 7], [9, 12], [10, 2], [10, 15], [10, 20], [11, 25],
  ];
  for (const [m, d] of fixed) {
    if (m === month) holidays.add(`${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  // Easter-based holidays
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, easterMonth, easterDay);

  const easterBased = [-47, -2, 60]; // Carnaval terça, Sexta-feira Santa, Corpus Christi
  for (const offset of easterBased) {
    const d2 = new Date(easter);
    d2.setDate(d2.getDate() + offset);
    if (d2.getMonth() === month) {
      holidays.add(`${year}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`);
    }
  }
  // Carnaval segunda
  const carnavalMon = new Date(easter);
  carnavalMon.setDate(carnavalMon.getDate() - 48);
  if (carnavalMon.getMonth() === month) {
    holidays.add(`${year}-${String(carnavalMon.getMonth() + 1).padStart(2, '0')}-${String(carnavalMon.getDate()).padStart(2, '0')}`);
  }

  return holidays;
}

function countBusinessDays(year: number, month: number, startDay: number, endDay: number, holidays: Set<string>): number {
  // When startDay > endDay, the period crosses months (e.g., 26 of previous month to 25 of current month)
  if (startDay > endDay) {
    // Period: startDay of previous month → endDay of current month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDayPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
    const lastDayCurr = new Date(year, month + 1, 0).getDate();
    const resolvedStart = Math.min(startDay, lastDayPrev);
    const resolvedEnd = Math.min(endDay, lastDayCurr);

    const prevHolidays = getBrazilianHolidays(prevYear, prevMonth);
    let count = 0;

    // Count days from startDay to end of previous month
    for (let day = resolvedStart; day <= lastDayPrev; day++) {
      const date = new Date(prevYear, prevMonth, day);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      const key = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (prevHolidays.has(key)) continue;
      count++;
    }

    // Count days from 1 to endDay of current month
    for (let day = 1; day <= resolvedEnd; day++) {
      const date = new Date(year, month, day);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (holidays.has(key)) continue;
      count++;
    }

    return count;
  }

  // Same month: startDay to endDay
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const resolvedStart = Math.max(1, Math.min(startDay, lastDayOfMonth));
  const resolvedEnd = Math.max(resolvedStart, Math.min(endDay, lastDayOfMonth));

  let count = 0;
  for (let day = resolvedStart; day <= resolvedEnd; day++) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (holidays.has(key)) continue;
    count++;
  }
  return count;
}

export function Settings() {
  const { salarySetting, isLoading } = useSalarySettings();
  const { connection, isLoading: isLoadingTelegram, refetch: refetchTelegramConnection } = useTelegramConnection();
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDay, setSalaryDay] = useState(5);
  const [dailyRate, setDailyRate] = useState('');
  const [workStartDay, setWorkStartDay] = useState(1);
  const [workEndDay, setWorkEndDay] = useState(30);
  const [paymentDay, setPaymentDay] = useState(10);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunchingSalary, setIsLaunchingSalary] = useState(false);
  const [telegramError, setTelegramError] = useState('');
  const [telegramSuccess, setTelegramSuccess] = useState('');
  const [generatedTelegramToken, setGeneratedTelegramToken] = useState('');
  const [isGeneratingTelegramToken, setIsGeneratingTelegramToken] = useState(false);
  const [isCopyingTelegramToken, setIsCopyingTelegramToken] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!salarySetting) {
        setSalaryAmount('');
        setSalaryDay(5);
        setDailyRate('');
        setWorkStartDay(1);
        setWorkEndDay(30);
        return;
      }

      setSalaryAmount(salarySetting.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setSalaryDay(salarySetting.day_of_month);
      setDailyRate(salarySetting.daily_rate ? salarySetting.daily_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
      setWorkStartDay(salarySetting.work_start_day ?? 1);
      setWorkEndDay(salarySetting.work_end_day ?? 30);
      setPaymentDay(salarySetting.day_of_month);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [salarySetting]);

  const [referenceMonth, setReferenceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const calculatedSalary = useMemo(() => {
    const rate = parseCurrencyValue(dailyRate);
    if (!rate) return null;

    const [year, month] = referenceMonth.split('-').map(Number);
    const monthIndex = month - 1;

    const holidays = getBrazilianHolidays(year, monthIndex);
    const businessDays = countBusinessDays(year, monthIndex, workStartDay, workEndDay, holidays);

    // Payment is in the month after the reference month
    const paymentDate = new Date(year, monthIndex + 1, paymentDay);

    return {
      businessDays,
      total: Math.round((rate * businessDays + Number.EPSILON) * 100) / 100,
      paymentDate,
    };
  }, [dailyRate, workStartDay, workEndDay, referenceMonth, paymentDay]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const rate = parseCurrencyValue(dailyRate);
    const amount = rate && calculatedSalary ? calculatedSalary.total : parseCurrencyValue(salaryAmount);

    if (!amount) {
      setError('Informe um valor de salário ou valor por dia útil maior que zero.');
      return;
    }
    if (salaryDay < 1 || salaryDay > 31) {
      setError('Informe um dia do mês entre 1 e 31.');
      return;
    }

    setIsSaving(true);
    try {
      await upsertSalarySetting({
        amount,
        dayOfMonth: salaryDay,
        dailyRate: rate,
        workStartDay: rate ? workStartDay : null,
        workEndDay: rate ? workEndDay : null,
      });
      setSuccessMessage('Salário principal salvo com sucesso.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o salário principal.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLaunchSalary() {
    if (!calculatedSalary || isLaunchingSalary) return;
    setIsLaunchingSalary(true);
    setError('');
    setSuccessMessage('');

    try {
      const payDate = calculatedSalary.paymentDate;
      const dateStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`;

      await createFinancialTransaction({
        type: 'entrada',
        description: 'Salário',
        amount: calculatedSalary.total,
        date: dateStr,
        paymentMethod: 'transferencia',
      });
      setSuccessMessage(`Salário de R$ ${calculatedSalary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} lançado para ${payDate.toLocaleDateString('pt-BR')}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível lançar o salário.');
    } finally {
      setIsLaunchingSalary(false);
    }
  }

  async function handleGenerateTelegramToken() {
    setTelegramError('');
    setTelegramSuccess('');
    setGeneratedTelegramToken('');
    setIsGeneratingTelegramToken(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Sua sessão expirou. Entre novamente para gerar o token do Telegram.');
      }

      const response = await fetch('/api/telegram/link-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const rawResponse = await response.text();
      let payload: { ok?: boolean; token?: string; error?: string } = {};

      if (rawResponse.trim()) {
        try {
          payload = JSON.parse(rawResponse) as { ok?: boolean; token?: string; error?: string };
        } catch {
          throw new Error('A rota do Telegram não retornou JSON válido. Verifique o deploy e a configuração da Vercel.');
        }
      }

      if (!response.ok || !payload.ok || !payload.token) {
        throw new Error(payload.error || 'Não foi possível gerar o token do Telegram.');
      }

      setGeneratedTelegramToken(payload.token);
      setTelegramSuccess('Token do Telegram pronto. Agora você pode copiar e enviar ao bot.');
      await refetchTelegramConnection();
    } catch (submitError) {
      setTelegramError(submitError instanceof Error ? submitError.message : 'Não foi possível gerar o token do Telegram.');
    } finally {
      setIsGeneratingTelegramToken(false);
    }
  }

  async function fetchExistingTelegramToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch('/api/telegram/link-token', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return;
      const payload = await response.json() as { ok?: boolean; token?: string | null };
      if (payload.ok && payload.token) {
        setGeneratedTelegramToken(payload.token);
      }
    } catch {
      // Silent fallback: the screen still works without showing the stored token.
    }
  }

  async function handleCopyTelegramToken() {
    if (!generatedTelegramToken) return;

    setIsCopyingTelegramToken(true);
    setTelegramError('');
    try {
      await navigator.clipboard.writeText(generatedTelegramToken);
      setTelegramSuccess('Token copiado. Agora envie no bot do Telegram.');
    } catch {
      setTelegramError('Não foi possível copiar o token automaticamente.');
    } finally {
      setIsCopyingTelegramToken(false);
    }
  }

  const isTelegramLinked = Boolean(connection?.telegram_user_id && connection?.linked_at);
  const hasGeneratedTelegramToken = Boolean(connection?.token_generated_at && !isTelegramLinked);
  const canGenerateTelegramToken = !isTelegramLinked && !hasGeneratedTelegramToken && !isLoadingTelegram;

  useEffect(() => {
    if (hasGeneratedTelegramToken && !generatedTelegramToken) {
      const timeout = window.setTimeout(() => {
        void fetchExistingTelegramToken();
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [generatedTelegramToken, hasGeneratedTelegramToken]);

  return (
    <div className="flex flex-col gap-xl min-w-0">
      <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md sm:p-lg lg:p-xl min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start gap-md mb-lg">
          <div className="bg-surface-variant p-lg rounded-full w-fit">
            <SettingsIcon size={32} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-h1 text-[24px] sm:text-[32px] font-semibold text-on-surface mb-sm">Configurações</h2>
            <p className="font-body-md text-[15px] sm:text-[16px] text-on-surface-variant max-w-[44rem]">
              Defina o salário principal da conta para o app criar automaticamente uma entrada pendente todo mês e melhorar o planejamento financeiro do dashboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,32rem)_1fr] gap-lg">
          <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-xl p-md sm:p-lg space-y-md min-w-0">
            <div className="flex items-center gap-sm">
              <Wallet size={20} className="text-primary" />
              <h3 className="font-h2 text-[22px] font-semibold text-on-surface">Salário principal</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <label>
                <span className={labelClass}>Valor mensal (fixo)</span>
                <input
                  value={salaryAmount}
                  onChange={event => setSalaryAmount(event.target.value)}
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="0,00"
                  disabled={!!parseCurrencyValue(dailyRate)}
                />
              </label>

              <label>
                <span className={labelClass}>Dia do mês (pagamento)</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={salaryDay}
                  onChange={event => setSalaryDay(Number(event.target.value))}
                  className={`${inputClass} text-center`}
                />
              </label>
            </div>

            <div className="border-t border-outline-variant pt-md space-y-md">
              <div className="flex items-center gap-sm">
                <Calculator size={18} className="text-secondary" />
                <h4 className="font-label-md text-[14px] font-semibold text-on-surface">Cálculo por dia útil</h4>
              </div>
              <p className="text-[13px] text-on-surface-variant">
                Preencha o valor por dia útil para calcular automaticamente o salário mensal com base nos dias úteis (excluindo fins de semana e feriados).
              </p>

              <label>
                <span className={labelClass}>Valor / dia útil</span>
                <input
                  value={dailyRate}
                  onChange={event => setDailyRate(event.target.value)}
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </label>

              <div className="grid grid-cols-3 gap-md">
                <label>
                  <span className={labelClass}>Dia início</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={workStartDay}
                    onChange={event => setWorkStartDay(Number(event.target.value))}
                    className={`${inputClass} text-center`}
                  />
                </label>
                <label>
                  <span className={labelClass}>Dia fechamento</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={workEndDay}
                    onChange={event => setWorkEndDay(Number(event.target.value))}
                    className={`${inputClass} text-center`}
                  />
                </label>
                <label>
                  <span className={labelClass}>Dia recebimento</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDay}
                    onChange={event => { setPaymentDay(Number(event.target.value)); setSalaryDay(Number(event.target.value)); }}
                    className={`${inputClass} text-center`}
                  />
                </label>
              </div>

              <label>
                <span className={labelClass}>Mês de referência</span>
                <input
                  type="month"
                  value={referenceMonth}
                  onChange={event => setReferenceMonth(event.target.value)}
                  className={inputClass}
                />
              </label>

              {calculatedSalary && (
                <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-md py-sm">
                  <p className="text-[13px] text-on-surface-variant">
                    Período ({new Date(referenceMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}): <strong className="text-on-surface">{calculatedSalary.businessDays} dias úteis</strong>
                  </p>
                  <p className="text-[16px] font-semibold text-on-surface mt-xs">
                    Salário estimado: R$ {calculatedSalary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[13px] text-on-surface-variant mt-xs">
                    Recebimento: <strong className="text-on-surface">{calculatedSalary.paymentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleLaunchSalary()}
                    disabled={isLaunchingSalary}
                    className="mt-md w-full px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-secondary rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11"
                  >
                    <CheckCircle size={18} />
                    <span>{isLaunchingSalary ? 'Lançando...' : 'Lançar salário'}</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-md py-sm text-[14px] text-on-surface">
                {successMessage}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || isSaving}
                className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
              >
                <CheckCircle size={18} />
                <span>{isSaving ? 'Salvando...' : salarySetting ? 'Atualizar salário' : 'Salvar salário'}</span>
              </button>
            </div>
          </form>

          <div className="bg-surface border border-outline-variant rounded-xl p-md sm:p-lg space-y-md min-w-0">
            <h3 className="font-h2 text-[22px] font-semibold text-on-surface">Como isso funciona</h3>
            <div className="space-y-sm text-[15px] text-on-surface-variant">
              <p>O app cria uma entrada pendente automática para o mês visualizado com o valor do seu salário principal.</p>
              <p>Esse lançamento aparece em Entradas e entra no planejamento do dashboard para mostrar quanto deve sobrar depois dos gastos.</p>
              <p>Outras rendas extras continuam sendo registradas manualmente como lançamentos normais.</p>
            </div>

            <div className="rounded-lg border border-outline-variant bg-background px-md py-md">
              <p className="text-[13px] uppercase tracking-wider text-on-surface-variant mb-xs">Configuração atual</p>
              {salarySetting ? (
                <div className="space-y-xs">
                  <p className="text-on-surface">Salário: <strong>R$ {salarySetting.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                  <p className="text-on-surface-variant">Geração mensal no dia {salarySetting.day_of_month}</p>
                </div>
              ) : (
                <p className="text-on-surface-variant">Nenhum salário principal configurado ainda.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,32rem)_1fr] gap-lg mt-lg">
          <div className="bg-surface border border-outline-variant rounded-xl p-md sm:p-lg space-y-md min-w-0">
            <div className="flex items-center gap-sm">
              <MessageCircle size={20} className="text-primary" />
              <h3 className="font-h2 text-[22px] font-semibold text-on-surface">Telegram</h3>
            </div>

            <p className="text-[15px] text-on-surface-variant">
              Gere um token único para vincular seu Telegram ao app. Depois da conexão, o bot reconhecerá sua conta automaticamente.
            </p>

            <div className="rounded-lg border border-outline-variant bg-background px-md py-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
              <div className="min-w-0">
                <p className="text-[13px] uppercase tracking-wider text-on-surface-variant mb-xs">Bot oficial</p>
                <p className="text-on-surface font-medium truncate">@Saldo_real_bot</p>
              </div>
              <a
                href="https://t.me/Saldo_real_bot"
                target="_blank"
                rel="noreferrer"
                className="px-md py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs min-h-11 w-full sm:w-auto"
              >
                <ExternalLink size={18} />
                <span>Abrir bot</span>
              </a>
            </div>

            {telegramError && (
              <div className="rounded-lg border border-error/40 bg-error-container/20 px-md py-sm text-on-error-container text-[14px]">
                {telegramError}
              </div>
            )}

            {telegramSuccess && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-md py-sm text-[14px] text-on-surface">
                {telegramSuccess}
              </div>
            )}

            {generatedTelegramToken && (
              <div className="rounded-lg border border-primary/30 bg-background px-md py-md">
                <p className="text-[13px] uppercase tracking-wider text-on-surface-variant mb-xs">Token gerado</p>
                <p className="font-mono text-[14px] break-all text-on-surface">{generatedTelegramToken}</p>
                <p className="text-[13px] text-on-surface-variant mt-sm">Esse token aparece apenas uma vez na geração inicial, mas fica disponível aqui para copiar novamente. Ele é único por conta e não pode ser alterado nem regenerado.</p>
                <div className="flex justify-end mt-md">
                  <button
                    type="button"
                    onClick={() => void handleCopyTelegramToken()}
                    disabled={isCopyingTelegramToken}
                    className="px-md py-sm font-label-md text-[14px] font-semibold text-on-surface bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
                  >
                    <Copy size={18} />
                    <span>{isCopyingTelegramToken ? 'Copiando...' : 'Copiar token'}</span>
                  </button>
                </div>
              </div>
            )}

            {canGenerateTelegramToken && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleGenerateTelegramToken()}
                  disabled={isGeneratingTelegramToken}
                  className="px-lg py-sm font-label-md text-[14px] font-semibold text-background bg-primary rounded-lg hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
                >
                  <ShieldCheck size={18} />
                  <span>{isGeneratingTelegramToken ? 'Gerando...' : 'Gerar token de acesso'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-surface border border-outline-variant rounded-xl p-md sm:p-lg space-y-md min-w-0">
            <div className="flex items-center gap-sm">
              <Link2 size={20} className="text-primary" />
              <h3 className="font-h2 text-[22px] font-semibold text-on-surface">Status da conexão</h3>
            </div>

            <div className="rounded-lg border border-outline-variant bg-background px-md py-md">
              {isTelegramLinked ? (
                <div className="space-y-xs">
                  <p className="text-on-surface"><strong>Telegram conectado</strong></p>
                  <p className="text-on-surface-variant text-[14px]">Seu bot já está vinculado a esta conta e não precisa mais pedir token.</p>
                </div>
              ) : hasGeneratedTelegramToken ? (
                <div className="space-y-xs">
                  <p className="text-on-surface"><strong>Token gerado aguardando vinculação</strong></p>
                  <p className="text-on-surface-variant text-[14px]">Abra o bot no Telegram, envie `/start` e depois informe o token gerado nesta conta.</p>
                </div>
              ) : (
                <div className="space-y-xs">
                  <p className="text-on-surface"><strong>Telegram ainda não conectado</strong></p>
                  <p className="text-on-surface-variant text-[14px]">Gere seu token de acesso para iniciar a vinculação com o bot.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
