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
  investmentsTotal: number;
  operationalBalance: number;
  transactions: Transaction[];
  invoiceItems: InvoiceItem[];
  cards: CreditCard[];
  bills: FixedBill[];
  investments: Investment[];
  goals: FinancialGoal[];
}

const PRIMARY_COLOR: [number, number, number] = [0, 230, 118];
const TEXT_COLOR: [number, number, number] = [40, 40, 40];
const MUTED_COLOR: [number, number, number] = [100, 100, 100];

// Helpers
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

function addHeader(doc: jsPDF, isFirstPage: boolean) {
  if (isFirstPage) return;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text('Saldo Real — Relatório Financeiro Mensal', 14, 15);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 18, 196, 18);
}

function addFooter(doc: jsPDF, pageNumber: number, dateStr: string) {
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Emitido em: ${dateStr}`, 14, 285);
  doc.text(`Página ${pageNumber}`, 196, 285, { align: 'right' });
}

function addSectionTitle(doc: jsPDF, title: string, yPos: number) {
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(title, 14, yPos);
  return yPos + 8;
}

function addEmptyState(doc: jsPDF, message: string, yPos: number) {
  doc.setFontSize(12);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(message, 14, yPos);
  return yPos + 10;
}

export function generateMonthlyFinancialReportPdf(data: ReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const emitDate = new Date().toLocaleDateString('pt-BR');
  let currentPage = 1;

  // PAGE 1: Capa
  doc.setFontSize(28);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Saldo Real', 105, 60, { align: 'center' });
  
  doc.setFontSize(22);
  doc.setTextColor(...TEXT_COLOR);
  doc.text('Relatório Financeiro Mensal', 105, 75, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Período analisado: ${data.monthLabel}`, 105, 90, { align: 'center' });
  if (data.userName) {
    doc.text(`Usuário: ${data.userName}`, 105, 100, { align: 'center' });
  }

  // Cards resumo na capa
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setFillColor(245, 255, 250);
  doc.roundedRect(45, 120, 120, 90, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);
  
  const coverMetrics = [
    { label: 'Receita total:', value: formatCurrencyBRL(data.income) },
    { label: 'Gastos lançados:', value: formatCurrencyBRL(data.expense) },
    { label: 'Contas fixas:', value: formatCurrencyBRL(data.fixedBillsTotal) },
    { label: 'Faturas abertas:', value: formatCurrencyBRL(data.openInvoices) },
    { label: 'Sobra prevista:', value: formatCurrencyBRL(data.income - data.expense - data.fixedBillsTotal - data.openInvoices) }
  ];

  let coverY = 135;
  coverMetrics.forEach(m => {
    doc.text(m.label, 55, coverY);
    doc.text(m.value, 155, coverY, { align: 'right' });
    coverY += 14;
  });

  addFooter(doc, currentPage, emitDate);

  // PAGE 2: Resumo Geral
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  let yPos = addSectionTitle(doc, 'Resumo Geral', 30);
  
  const summaryData = [
    ['Receita Total', formatCurrencyBRL(data.income)],
    ['Gastos Totais', formatCurrencyBRL(data.expense)],
    ['Saldo Operacional', formatCurrencyBRL(data.operationalBalance)],
    ['Contas Fixas', formatCurrencyBRL(data.fixedBillsTotal)],
    ['Faturas Abertas', formatCurrencyBRL(data.openInvoices)],
    ['Investimentos / Caixinhas', formatCurrencyBRL(data.investmentsTotal)],
    ['Sobra Prevista', formatCurrencyBRL(data.income - data.expense - data.fixedBillsTotal - data.openInvoices)]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR },
    margin: { left: 14, right: 14 }
  });

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);
  const readingText = "No período analisado, os principais compromissos financeiros estão concentrados em contas fixas e faturas de cartão. A sobra prevista depende da confirmação das entradas pendentes e do pagamento das despesas em aberto.";
  const splitText = doc.splitTextToSize(readingText, 180);
  doc.text(splitText, 14, yPos);

  addFooter(doc, currentPage, emitDate);

  // PAGE 3: Entradas
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Entradas', 30);

  const incomes = safeArray(data.transactions).filter(t => t.type === 'entrada');
  const received = incomes.filter(t => t.status === 'recebido').reduce((sum, t) => sum + t.amount, 0);
  const pending = incomes.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0);

  let biggestIncome = 'Nenhuma';
  if (incomes.length > 0) {
    const maxInc = [...incomes].sort((a, b) => b.amount - a.amount)[0];
    biggestIncome = `${maxInc.description} (${formatCurrencyBRL(maxInc.amount)})`;
  }

  doc.setFontSize(11);
  doc.text(`Total Recebido: ${formatCurrencyBRL(received)}`, 14, yPos);
  doc.text(`Total Pendente: ${formatCurrencyBRL(pending)}`, 80, yPos);
  doc.text(`Maior Fonte: ${biggestIncome}`, 14, yPos + 8);
  yPos += 18;

  if (incomes.length === 0) {
    addEmptyState(doc, 'Nenhuma entrada registrada no período.', yPos);
  } else {
    const incomeRows = incomes.map(t => [
      formatDateBR(t.date),
      t.description,
      t.category?.name || 'Outros',
      getStatusLabel(t.status),
      formatCurrencyBRL(t.amount)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Categoria', 'Status', 'Valor']],
      body: incomeRows,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'Recebido') {
            data.cell.styles.textColor = [0, 150, 0];
          } else {
            data.cell.styles.textColor = [200, 100, 0];
          }
        }
      }
    });
  }
  addFooter(doc, currentPage, emitDate);

  // PAGE 4: Gastos
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Gastos', 30);

  const expenses = safeArray(data.transactions).filter(t => t.type === 'gasto');
  const expPaid = expenses.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.amount, 0);
  const expPending = expenses.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.amount, 0);

  let biggestExpense = 'Nenhum';
  if (expenses.length > 0) {
    const maxExp = [...expenses].sort((a, b) => b.amount - a.amount)[0];
    biggestExpense = `${maxExp.description} (${formatCurrencyBRL(maxExp.amount)})`;
  }

  doc.setFontSize(11);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(`Total Gasto (Pago): ${formatCurrencyBRL(expPaid)}`, 14, yPos);
  doc.text(`Total Pendente: ${formatCurrencyBRL(expPending)}`, 80, yPos);
  doc.text(`Maior Despesa: ${biggestExpense}`, 14, yPos + 8);
  yPos += 18;

  if (expenses.length === 0) {
    addEmptyState(doc, 'Nenhum gasto registrado no período.', yPos);
  } else {
    const expenseRows = expenses.map(t => [
      formatDateBR(t.date),
      t.description,
      t.category?.name || 'Outros',
      getStatusLabel(t.status),
      formatCurrencyBRL(t.amount)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Categoria', 'Status', 'Valor']],
      body: expenseRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 50, 50] }
    });
  }
  addFooter(doc, currentPage, emitDate);

  // PAGE 5: Faturas de Cartão
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Faturas de Cartão', 30);

  const cards = safeArray(data.cards);
  const items = safeArray(data.invoiceItems);

  if (cards.length === 0 || items.length === 0) {
    addEmptyState(doc, 'Nenhuma fatura de cartão no período.', yPos);
  } else {
    const cardSummaryRows = cards.map(c => {
      const cardItems = items.filter(i => i.card_id === c.id);
      const total = cardItems.reduce((sum, i) => sum + i.amount, 0);
      return [
        c.name,
        c.last_digits || '-',
        c.due_day.toString(),
        formatCurrencyBRL(total),
        cardItems.length.toString()
      ];
    });

    doc.setFontSize(14);
    doc.text('Resumo por Cartão', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Cartão', 'Final', 'Vencimento', 'Valor', 'Qtd Compras']],
      body: cardSummaryRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_COLOR }
    });
    
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Detalhes das Compras', 14, yPos);
    yPos += 6;

    const itemRows = items.map(i => {
      const card = cards.find(c => c.id === i.card_id);
      let parcelStr = '-';
      if (i.total_installments > 1) {
        parcelStr = `${i.current_installment} de ${i.total_installments}`;
      }
      return [
        card?.name || 'Desconhecido',
        i.description,
        i.category?.name || 'Outros',
        formatCurrencyBRL(i.amount),
        parcelStr
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Cartão', 'Compra', 'Categoria', 'Valor', 'Parcela']],
      body: itemRows,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR }
    });
  }
  addFooter(doc, currentPage, emitDate);

  // PAGE 6: Contas Fixas
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Contas Fixas', 30);

  const bills = safeArray(data.bills) as DynamicFixedBill[];
  if (bills.length === 0) {
    addEmptyState(doc, 'Nenhuma conta fixa no período.', yPos);
  } else {
    // try to read dynamicStatus or fallback to status
    const paid = bills.filter(b => b.dynamicStatus === 'pago' || b.status === 'pago').reduce((s, b) => s + b.amount, 0);
    const pendingBills = bills.filter(b => b.dynamicStatus !== 'pago' && b.status !== 'pago');
    const pendTotal = pendingBills.reduce((s, b) => s + b.amount, 0);

    doc.setFontSize(11);
    doc.text(`Total do Mês: ${formatCurrencyBRL(paid + pendTotal)}`, 14, yPos);
    doc.text(`Total Pago: ${formatCurrencyBRL(paid)}`, 80, yPos);
    doc.text(`Total Pendente: ${formatCurrencyBRL(pendTotal)}`, 140, yPos);
    yPos += 12;

    const billRows = bills.map(b => [
      b.description,
      b.category?.name || 'Outros',
      `Dia ${b.due_day}`,
      formatCurrencyBRL(b.amount),
      getStatusLabel(b.dynamicStatus || b.status)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status']],
      body: billRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_COLOR }
    });
  }
  addFooter(doc, currentPage, emitDate);

  // PAGE 7: Investimentos / Caixinhas
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Investimentos / Caixinhas', 30);

  const investments = safeArray(data.investments);
  if (investments.length === 0) {
    addEmptyState(doc, 'Nenhum aporte registrado no período.', yPos);
  } else {
    const totalGuardado = investments.reduce((sum, i) => sum + i.current_value, 0);
    const totalAportado = investments.reduce((sum, i) => sum + i.amount_invested, 0);

    doc.setFontSize(11);
    doc.text(`Saldo Guardado: ${formatCurrencyBRL(totalGuardado)}`, 14, yPos);
    doc.text(`Total Aportado: ${formatCurrencyBRL(totalAportado)}`, 80, yPos);
    doc.text(`Quantidade: ${investments.length}`, 140, yPos);
    yPos += 12;

    const invRows = investments.map(i => [
      i.name,
      i.category === 'renda_fixa' ? 'Renda Fixa' : i.category,
      formatCurrencyBRL(i.current_value),
      formatCurrencyBRL(i.amount_invested),
      formatCurrencyBRL(i.monthly_contribution)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Tipo', 'Saldo Atual', 'Total Aportado', 'Aporte Mensal']],
      body: invRows,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR }
    });
  }
  addFooter(doc, currentPage, emitDate);

  // PAGE 8: Metas Financeiras
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Metas Financeiras', 30);

  const goals = safeArray(data.goals);
  if (goals.length === 0) {
    yPos = addEmptyState(doc, 'Nenhuma meta financeira cadastrada neste período.', yPos);
    doc.text('Cadastre metas para acompanhar objetivos como reserva de emergência, viagem, veículo, quitação de dívidas ou compras planejadas.', 14, yPos, { maxWidth: 180 });
  } else {
    const goalRows = goals.map(g => {
      const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
      return [
        g.title,
        formatCurrencyBRL(g.target_amount),
        formatCurrencyBRL(g.current_amount),
        `${pct.toFixed(1)}%`,
        g.deadline ? formatDateBR(g.deadline) : '-'
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'Alvo', 'Atual', 'Concluído', 'Prazo']],
      body: goalRows,
      theme: 'striped',
      headStyles: { fillColor: PRIMARY_COLOR }
    });
  }
  addFooter(doc, currentPage, emitDate);

  // PAGE 9: Análise Final
  doc.addPage();
  currentPage++;
  addHeader(doc, false);
  yPos = addSectionTitle(doc, 'Análise Final', 30);

  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);

  const totalExp = data.expense + data.openInvoices + data.fixedBillsTotal;
  const analysisLines = [
    "Diagnóstico do Mês:",
    `Neste mês, sua receita registrada foi de ${formatCurrencyBRL(data.income)}, com ${formatCurrencyBRL(totalExp)} em despesas totais.`,
    "",
    "Pontos de Atenção:"
  ];

  if (totalExp > data.income) {
    analysisLines.push("- Atenção: As despesas totais superam a receita do mês. Isso pode gerar endividamento.");
  } else {
    analysisLines.push("- Positivo: As receitas são suficientes para cobrir as despesas previstas.");
  }
  
  if (data.goals.length === 0) {
    analysisLines.push("- Nenhuma meta financeira cadastrada. É importante definir objetivos para o futuro.");
  }
  if (data.investmentsTotal === 0) {
    analysisLines.push("- Ausência de aportes ou investimentos registrados. Considere guardar uma parte da renda.");
  }
  
  analysisLines.push("");
  analysisLines.push("Recomendações:");
  analysisLines.push("- Priorize o pagamento de faturas e contas fixas em aberto.");
  analysisLines.push("- Revise gastos em categorias não essenciais.");
  
  const textBody = analysisLines.join('\n');
  const splitAnalysis = doc.splitTextToSize(textBody, 180);
  doc.text(splitAnalysis, 14, yPos);

  addFooter(doc, currentPage, emitDate);

  // Salvar
  const rawMonth = data.monthLabel.replace(/\s+/g, '-').toLowerCase();
  doc.save(`relatorio-financeiro-${rawMonth}.pdf`);
}
