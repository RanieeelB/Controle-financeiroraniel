import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Transaction,
  InvoiceItem,
  CreditCard,
  FixedBill,
  DynamicFixedBill,
  Investment,
  FinancialGoal
} from '../types/financial';

export interface ReportData {
  monthLabel: string;
  userName?: string;
  income: number;
  expense: number;
  openInvoices: number;
  fixedBillsTotal: number;
  unpaidFixedBills: number;
  investmentsTotal: number;
  operationalBalance: number;
  transactions: Transaction[];
  invoiceItems: InvoiceItem[];
  cards: CreditCard[];
  bills: FixedBill[];
  investments: Investment[];
  goals: FinancialGoal[];
}

// Cores do tema
const C = {
  primary: [0, 230, 118] as [number, number, number],
  secondary: [0, 166, 224] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [251, 191, 36] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  purple: [168, 85, 247] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  light: [243, 244, 246] as [number, number, number],
};

export const formatCurrencyBRL = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pago: 'Pago',
    recebido: 'Recebido',
    pendente: 'Pendente',
    atrasado: 'Atrasado'
  };
  return map[status] || status;
};

export const safeArray = <T,>(arr?: T[] | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

// Helper para setTextColor com array
function setColor(doc: jsPDF, color: [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

// Helper para setFillColor com array
function setFillColor(doc: jsPDF, color: [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

// Desenhar card com borda colorida
function drawMetricCard(doc: jsPDF, x: number, y: number, width: number, height: number, label: string, value: string, color: [number, number, number], icon: string) {
  setFillColor(doc, C.light);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  setFillColor(doc, color);
  doc.roundedRect(x, y, 4, height, 2, 2, 'F');

  doc.setFontSize(14);
  setColor(doc, color);
  doc.text(icon, x + 10, y + 12);

  doc.setFontSize(8);
  setColor(doc, C.muted);
  doc.text(label.toUpperCase(), x + 20, y + 9);

  doc.setFontSize(13);
  setColor(doc, C.text);
  doc.text(value, x + 20, y + 20);
}

// Desenhar barra de progresso
function drawProgressBar(doc: jsPDF, x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) {
  setFillColor(doc, C.light);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');

  const fillWidth = (width - 2) * Math.min(percentage, 100) / 100;
  if (fillWidth > 0) {
    setFillColor(doc, color);
    doc.roundedRect(x + 1, y + 1, fillWidth, height - 2, 1, 1, 'F');
  }
}

// Desenhar indicador circular com texto
function drawScoreIndicator(doc: jsPDF, x: number, y: number, value: number, label: string, color: [number, number, number]) {
  // Fundo do card
  setFillColor(doc, C.light);
  doc.roundedRect(x, y, 40, 50, 3, 3, 'F');

  // Número grande
  doc.setFontSize(18);
  setColor(doc, color);
  doc.text(`${Math.round(value)}`, x + 20, y + 25, { align: 'center' });

  // Label
  doc.setFontSize(7);
  setColor(doc, C.muted);
  doc.text(label, x + 20, y + 35, { align: 'center' });

  // Indicador visual (barra vertical)
  const barHeight = 20 * Math.min(value / 100, 1);
  setFillColor(doc, color);
  doc.roundedRect(x + 17, y + 40 - barHeight, 6, barHeight, 1, 1, 'F');
}

// Título de seção com destaque
function addSectionTitle(doc: jsPDF, title: string, emoji: string) {
  setFillColor(doc, C.primary);
  doc.roundedRect(14, 25, 182, 14, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${emoji} ${title}`, 18, 34);
}

// Footer
function addFooter(doc: jsPDF, dateStr: string) {
  doc.setFontSize(8);
  setColor(doc, C.muted);
  doc.text(`Gerado em ${dateStr} | Saldo Real`, 105, 287, { align: 'center' });
}

export function generateMonthlyFinancialReportPdf(data: ReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const emitDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ==================== PÁGINA 1: CAPA ====================
  // Background escuro premium
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 297, 'F');

  // Elementos decorativos
  doc.setFillColor(0, 230, 118, 20);
  doc.circle(185, 35, 50, 'F');
  doc.setFillColor(0, 166, 224, 15);
  doc.circle(25, 260, 40, 'F');

  // Logo
  doc.setFontSize(12);
  setColor(doc, C.primary);
  doc.text('SALDO REAL', 105, 35, { align: 'center' });

  // Título principal
  doc.setFontSize(40);
  doc.setTextColor(255, 255, 255);
  doc.text('Relatório', 105, 65, { align: 'center' });
  setColor(doc, C.primary);
  doc.text('Financeiro', 105, 82, { align: 'center' });

  // Período
  doc.setFontSize(16);
  doc.setTextColor(200, 200, 200);
  doc.text(data.monthLabel, 105, 100, { align: 'center' });

  // Cards de métricas principais
  const cardWidth = 85;
  const cardHeight = 32;
  const startX = 20;
  const startY = 130;
  const gapX = 10;
  const gapY = 8;

  const mainMetrics = [
    { label: 'Receitas', value: formatCurrencyBRL(data.income), color: C.success, icon: '↑' },
    { label: 'Despesas', value: formatCurrencyBRL(data.expense), color: C.danger, icon: '↓' },
    { label: 'Contas Fixas', value: formatCurrencyBRL(data.fixedBillsTotal), color: C.secondary, icon: '☰' },
    { label: 'Faturas Abertas', value: formatCurrencyBRL(data.openInvoices), color: C.warning, icon: '◈' },
    { label: 'Investimentos', value: formatCurrencyBRL(data.investmentsTotal), color: C.purple, icon: '◆' },
    { label: 'Sobra Final', value: formatCurrencyBRL(data.operationalBalance), color: C.primary, icon: '✓' },
  ];

  mainMetrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    drawMetricCard(doc, x, y, cardWidth, cardHeight, metric.label, metric.value, metric.color, metric.icon);
  });

  // Indicadores de score
  const healthScore = data.income > 0 ? Math.min(100, Math.max(0, (data.operationalBalance / data.income) * 100 + 50)) : 50;
  const savingsRate = data.income > 0 ? Math.max(0, ((data.income - data.expense - data.unpaidFixedBills) / data.income) * 100) : 0;

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Indicadores', 105, 250, { align: 'center' });

  drawScoreIndicator(doc, 45, 258, healthScore, 'SAÚDE', healthScore >= 70 ? C.success : healthScore >= 40 ? C.warning : C.danger);
  drawScoreIndicator(doc, 85, 258, savingsRate, 'POUPANÇA', savingsRate >= 20 ? C.success : savingsRate >= 0 ? C.warning : C.danger);
  drawScoreIndicator(doc, 125, 258, data.goals.length > 0 ? Math.min(100, (data.goals.filter(g => g.current_amount >= g.target_amount).length / data.goals.length) * 100) : 0, 'METAS', C.primary);

  addFooter(doc, emitDate);

  // ==================== PÁGINA 2: ENTRADAS ====================
  doc.addPage();
  addSectionTitle(doc, 'Entradas', '💰');

  const incomes = safeArray(data.transactions).filter(t => t.type === 'entrada');
  const received = incomes.filter(t => t.status === 'recebido').reduce((sum, t) => sum + t.amount, 0);
  const pending = incomes.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0);

  let yPos = 48;
  drawMetricCard(doc, 14, yPos, 56, 24, 'Recebido', formatCurrencyBRL(received), C.success, '✓');
  drawMetricCard(doc, 74, yPos, 56, 24, 'Pendente', formatCurrencyBRL(pending), C.warning, '⏳');
  drawMetricCard(doc, 134, yPos, 56, 24, 'Total', formatCurrencyBRL(data.income), C.primary, '═');

  yPos = 82;

  if (incomes.length === 0) {
    doc.setFontSize(12);
    setColor(doc, C.muted);
    doc.text('Nenhuma entrada registrada neste período.', 105, yPos, { align: 'center' });
  } else {
    const incomeRows = incomes.map(t => [
      formatDateBR(t.date),
      t.description.length > 28 ? t.description.substring(0, 28) + '…' : t.description,
      t.category?.name || 'Outros',
      t.status === 'recebido' ? '✓' : '○',
      formatCurrencyBRL(t.amount)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Categoria', 'St', 'Valor']],
      body: incomeRows,
      theme: 'striped',
      headStyles: { fillColor: C.success, textColor: [255, 255, 255] },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'right' }
      },
      styles: { fontSize: 9 }
    });
  }

  addFooter(doc, emitDate);

  // ==================== PÁGINA 3: GASTOS ====================
  doc.addPage();
  addSectionTitle(doc, 'Gastos', '💸');

  const expenses = safeArray(data.transactions).filter(t => t.type === 'gasto');
  const expPaid = expenses.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.amount, 0);
  const expPending = expenses.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0);

  yPos = 48;
  drawMetricCard(doc, 14, yPos, 56, 24, 'Pagos', formatCurrencyBRL(expPaid), C.success, '✓');
  drawMetricCard(doc, 74, yPos, 56, 24, 'Pendentes', formatCurrencyBRL(expPending), C.warning, '⏳');
  drawMetricCard(doc, 134, yPos, 56, 24, 'Total', formatCurrencyBRL(data.expense), C.danger, '═');

  yPos = 82;

  if (expenses.length === 0) {
    doc.setFontSize(12);
    setColor(doc, C.muted);
    doc.text('Nenhum gasto registrado neste período.', 105, yPos, { align: 'center' });
  } else {
    const expenseRows = expenses.map(t => {
      let statusIcon = '○';
      if (t.status === 'pago') statusIcon = '✓';
      return [
        formatDateBR(t.date),
        t.description.length > 28 ? t.description.substring(0, 28) + '…' : t.description,
        t.category?.name || 'Outros',
        statusIcon,
        formatCurrencyBRL(t.amount)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Categoria', 'St', 'Valor']],
      body: expenseRows,
      theme: 'striped',
      headStyles: { fillColor: C.danger, textColor: [255, 255, 255] },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'right' }
      },
      styles: { fontSize: 9 }
    });
  }

  addFooter(doc, emitDate);

  // ==================== PÁGINA 4: CARTÕES ====================
  doc.addPage();
  addSectionTitle(doc, 'Cartões de Crédito', '💳');

  const cards = safeArray(data.cards);
  const items = safeArray(data.invoiceItems);

  yPos = 48;

  if (cards.length === 0 || items.length === 0) {
    doc.setFontSize(12);
    setColor(doc, C.muted);
    doc.text('Nenhuma fatura de cartão neste período.', 105, yPos, { align: 'center' });
  } else {
    cards.forEach((c, index) => {
      const cardItems = items.filter(i => i.card_id === c.id);
      const total = cardItems.reduce((sum, i) => sum + i.amount, 0);
      const y = yPos + index * 24;
      const name = c.name + (c.last_digits ? ` •••${c.last_digits}` : '');
      drawMetricCard(doc, 14, y, 182, 21, name.length > 25 ? name.substring(0, 25) + '…' : name, formatCurrencyBRL(total), C.warning, '◈');
    });

    yPos = yPos + cards.length * 24 + 12;

    doc.setFontSize(10);
    setColor(doc, C.text);
    doc.text('Detalhes das compras:', 14, yPos);
    yPos += 8;

    const itemRows = items.map(i => {
      const card = cards.find(c => c.id === i.card_id);
      let parcelStr = 'À vista';
      if (i.total_installments > 1) {
        parcelStr = `${i.current_installment}/${i.total_installments}`;
      }
      return [
        card?.name?.substring(0, 10) || '—',
        i.description.length > 22 ? i.description.substring(0, 22) + '…' : i.description,
        i.category?.name || 'Outros',
        formatCurrencyBRL(i.amount),
        parcelStr
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Cartão', 'Compra', 'Categoria', 'Valor', 'Parcela']],
      body: itemRows,
      theme: 'striped',
      headStyles: { fillColor: C.secondary, textColor: [255, 255, 255] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' }
      },
      styles: { fontSize: 8 }
    });
  }

  addFooter(doc, emitDate);

  // ==================== PÁGINA 5: CONTAS FIXAS ====================
  doc.addPage();
  addSectionTitle(doc, 'Contas Fixas', '📋');

  const bills = safeArray(data.bills) as DynamicFixedBill[];
  yPos = 48;

  if (bills.length === 0) {
    doc.setFontSize(12);
    setColor(doc, C.muted);
    doc.text('Nenhuma conta fixa cadastrada.', 105, yPos, { align: 'center' });
  } else {
    const paid = bills.filter(b => b.dynamicStatus === 'pago' || b.status === 'pago').reduce((s, b) => s + b.amount, 0);
    const pendTotal = bills.filter(b => b.dynamicStatus !== 'pago' && b.status !== 'pago').reduce((s, b) => s + b.amount, 0);

    drawMetricCard(doc, 14, yPos, 56, 24, 'Pagas', formatCurrencyBRL(paid), C.success, '✓');
    drawMetricCard(doc, 74, yPos, 56, 24, 'Pendentes', formatCurrencyBRL(pendTotal), C.warning, '⏳');
    drawMetricCard(doc, 134, yPos, 56, 24, 'Total', formatCurrencyBRL(paid + pendTotal), C.secondary, '═');

    yPos = 82;

    const billRows = bills.map(b => {
      const status = b.dynamicStatus || b.status;
      let statusIcon = '○';
      if (status === 'pago') statusIcon = '✓';
      else if (status === 'atrasado') statusIcon = '⚠';
      return [
        b.description.length > 25 ? b.description.substring(0, 25) + '…' : b.description,
        b.category?.name || 'Outros',
        `Dia ${b.due_day}`,
        formatCurrencyBRL(b.amount),
        statusIcon
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Categoria', 'Venc.', 'Valor', 'St']],
      body: billRows,
      theme: 'striped',
      headStyles: { fillColor: C.secondary, textColor: [255, 255, 255] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' }
      },
      styles: { fontSize: 9 }
    });
  }

  addFooter(doc, emitDate);

  // ==================== PÁGINA 6: INVESTIMENTOS ====================
  doc.addPage();
  addSectionTitle(doc, 'Investimentos & Caixinhas', '🏦');

  const investments = safeArray(data.investments);
  yPos = 48;

  if (investments.length === 0) {
    doc.setFontSize(12);
    setColor(doc, C.muted);
    doc.text('Nenhum investimento ou caixinha registrada.', 105, yPos, { align: 'center' });
  } else {
    const totalGuardado = investments.reduce((sum, i) => sum + i.current_value, 0);
    const totalAportado = investments.reduce((sum, i) => sum + i.amount_invested, 0);
    const rendimento = totalGuardado - totalAportado;
    const rendimentoPct = totalAportado > 0 ? (rendimento / totalAportado) * 100 : 0;

    drawMetricCard(doc, 14, yPos, 56, 24, 'Guardado', formatCurrencyBRL(totalGuardado), C.purple, '◆');
    drawMetricCard(doc, 74, yPos, 56, 24, 'Aportado', formatCurrencyBRL(totalAportado), C.secondary, '═');
    drawMetricCard(doc, 134, yPos, 56, 24, 'Rendimento', `${rendimentoPct >= 0 ? '+' : ''}${rendimentoPct.toFixed(1)}%`, rendimento >= 0 ? C.success : C.danger, rendimento >= 0 ? '↑' : '↓');

    yPos = 82;

    const invRows = investments.map(i => {
      const retPct = i.amount_invested > 0 ? ((i.current_value - i.amount_invested) / i.amount_invested) * 100 : 0;
      const retIcon = retPct >= 0 ? '↑' : '↓';
      return [
        i.name,
        i.category === 'renda_fixa' ? 'Caixinha' : i.category.charAt(0).toUpperCase() + i.category.slice(1),
        formatCurrencyBRL(i.current_value),
        formatCurrencyBRL(i.amount_invested),
        `${retIcon} ${retPct.toFixed(1)}%`
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Tipo', 'Saldo', 'Aportado', 'Rend.']],
      body: invRows,
      theme: 'striped',
      headStyles: { fillColor: C.purple, textColor: [255, 255, 255] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      },
      styles: { fontSize: 9 }
    });
  }

  addFooter(doc, emitDate);

  // ==================== PÁGINA 7: METAS ====================
  doc.addPage();
  addSectionTitle(doc, 'Metas Financeiras', '🎯');

  const goals = safeArray(data.goals);
  yPos = 48;

  if (goals.length === 0) {
    doc.setFontSize(12);
    setColor(doc, C.muted);
    doc.text('Nenhuma meta financeira cadastrada.', 105, yPos, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Defina metas para reserva de emergência,', 105, yPos + 15, { align: 'center' });
    doc.text('viagens, veículo ou compras planejadas!', 105, yPos + 22, { align: 'center' });
  } else {
    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
    const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    drawMetricCard(doc, 14, yPos, 56, 24, 'Meta Total', formatCurrencyBRL(totalTarget), C.primary, '◎');
    drawMetricCard(doc, 74, yPos, 56, 24, 'Acumulado', formatCurrencyBRL(totalSaved), C.success, '◆');
    drawMetricCard(doc, 134, yPos, 56, 24, 'Progresso', `${overallProgress.toFixed(0)}%`, overallProgress >= 50 ? C.success : C.warning, overallProgress >= 100 ? '✓' : '◐');

    yPos = 82;

    goals.forEach((g, index) => {
      const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      const barY = yPos + index * 32;

      doc.setFontSize(10);
      setColor(doc, C.text);
      doc.text(g.title, 14, barY);

      setColor(doc, pct >= 100 ? C.success : pct >= 50 ? C.warning : C.danger);
      doc.text(`${pct.toFixed(0)}%`, 196, barY, { align: 'right' });

      drawProgressBar(doc, 14, barY + 3, 182, 8, pct, pct >= 100 ? C.success : pct >= 50 ? C.warning : C.primary);

      doc.setFontSize(8);
      setColor(doc, C.muted);
      doc.text(`${formatCurrencyBRL(g.current_amount)} de ${formatCurrencyBRL(g.target_amount)}`, 14, barY + 18);
      if (g.deadline) {
        doc.text(`Prazo: ${formatDateBR(g.deadline)}`, 196, barY + 18, { align: 'right' });
      }
    });
  }

  addFooter(doc, emitDate);

  // ==================== PÁGINA 8: ANÁLISE ====================
  doc.addPage();
  addSectionTitle(doc, 'Análise & Recomendações', '📊');

  yPos = 48;

  // Scores
  const totalExp = data.expense + data.unpaidFixedBills;
  const finalSavingsRate = data.income > 0 ? ((data.income - totalExp) / data.income) * 100 : 0;
  const finalHealthScore = Math.min(100, Math.max(0, finalSavingsRate + 50));

  doc.setFontSize(12);
  setColor(doc, C.text);
  doc.text('Índices de Desempenho', 105, yPos, { align: 'center' });
  yPos += 12;

  drawScoreIndicator(doc, 40, yPos, finalHealthScore, 'SAÚDE', finalHealthScore >= 70 ? C.success : finalHealthScore >= 40 ? C.warning : C.danger);
  drawScoreIndicator(doc, 90, yPos, Math.max(0, finalSavingsRate * 5), 'POUPANÇA', finalSavingsRate >= 20 ? C.success : finalSavingsRate >= 0 ? C.warning : C.danger);
  drawScoreIndicator(doc, 140, yPos, Math.min(100, (data.expense / (data.income || 1)) * 100), 'GASTOS', (data.expense / (data.income || 1)) <= 0.7 ? C.success : C.danger);

  yPos += 60;

  // Análise
  doc.setFontSize(11);
  setColor(doc, C.text);
  doc.text('Diagnóstico do Mês:', 14, yPos);
  yPos += 10;

  if (finalSavingsRate >= 20) {
    doc.setFontSize(10);
    setColor(doc, C.success);
    doc.text('✓ Ótimo! Você está pouparando ' + finalSavingsRate.toFixed(1) + '% da sua renda.', 14, yPos);
  } else if (finalSavingsRate >= 0) {
    doc.setFontSize(10);
    setColor(doc, C.warning);
    doc.text('◐ Você está pouparando ' + savingsRate.toFixed(1) + '% da renda. Tente chegar a 20%.', 14, yPos);
  } else {
    doc.setFontSize(10);
    setColor(doc, C.danger);
    doc.text('⚠ Suas despesas estão superando receitas em ' + Math.abs(savingsRate).toFixed(1) + '%.', 14, yPos);
  }

  yPos += 12;

  if (data.goals.length > 0) {
    const completedGoals = data.goals.filter(g => g.current_amount >= g.target_amount).length;
    if (completedGoals > 0) {
      doc.setFontSize(10);
      setColor(doc, C.success);
      doc.text(`🎉 ${completedGoals} meta(s) concluída(s)!`, 14, yPos);
      yPos += 10;
    }
  }

  if (data.investmentsTotal > 0) {
    doc.setFontSize(10);
    setColor(doc, C.primary);
    doc.text(`💰 Total investido: ${formatCurrencyBRL(data.investmentsTotal)}`, 14, yPos);
    yPos += 10;
  }

  if (data.openInvoices > 0) {
    doc.setFontSize(10);
    setColor(doc, C.warning);
    doc.text(`💳 Faturas abertas: ${formatCurrencyBRL(data.openInvoices)}`, 14, yPos);
    yPos += 10;
  }

  yPos += 10;

  // Recomendações
  doc.setFontSize(11);
  setColor(doc, C.text);
  doc.text('Recomendações:', 14, yPos);
  yPos += 8;

  const recommendations = [
    'Revise gastos desnecessários e procure reduzir 10%.',
    'Mantenha uma reserva de emergência de 3-6 meses.',
    'Continue investindo regularmente, mesmo valores pequenos.',
    'Pague faturas e contas em dia para evitar juros.',
  ];

  recommendations.forEach((rec, index) => {
    doc.setFontSize(9);
    setColor(doc, C.muted);
    doc.text(`${index + 1}. ${rec}`, 14, yPos + (index * 7));
  });

  addFooter(doc, emitDate);

  // Salvar
  const rawMonth = data.monthLabel.replace(/\s+/g, '-').toLowerCase();
  doc.save(`relatorio-financeiro-${rawMonth}.pdf`);
}