const STORAGE_KEY = "lancamentosFinanceiros";

const form = document.getElementById("form-lancamento");
const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const tipoInput = document.getElementById("tipo");
const lista = document.getElementById("lista-lancamentos");
const saldoEl = document.getElementById("saldo");
const totalReceitasEl = document.getElementById("total-receitas");
const totalDespesasEl = document.getElementById("total-despesas");

let lancamentos = carregarLancamentos();
render();
registrarServiceWorker();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const descricao = descricaoInput.value.trim();
  const valor = Number.parseFloat(valorInput.value);
  const tipo = tipoInput.value;

  if (!descricao || !Number.isFinite(valor) || valor <= 0) {
    return;
  }

  lancamentos.unshift({
    id: crypto.randomUUID(),
    descricao,
    valor,
    tipo,
  });

  salvarLancamentos();
  form.reset();
  tipoInput.value = "receita";
  descricaoInput.focus();
  render();
});

lista.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.dataset.action !== "remover") {
    return;
  }

  const id = target.dataset.id;
  lancamentos = lancamentos.filter((lancamento) => lancamento.id !== id);
  salvarLancamentos();
  render();
});

function carregarLancamentos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.descricao === "string" &&
        Number.isFinite(item.valor) &&
        (item.tipo === "receita" || item.tipo === "despesa"),
    );
  } catch {
    return [];
  }
}

function salvarLancamentos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lancamentos));
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function render() {
  lista.innerHTML = "";

  let totalReceitas = 0;
  let totalDespesas = 0;

  for (const lancamento of lancamentos) {
    const li = document.createElement("li");

    const tipoClasse = lancamento.tipo === "receita" ? "receita" : "despesa";
    if (lancamento.tipo === "receita") {
      totalReceitas += lancamento.valor;
    } else {
      totalDespesas += lancamento.valor;
    }

    li.innerHTML = `
      <div>
        <strong>${escapeHtml(lancamento.descricao)}</strong>
        <small>${lancamento.tipo === "receita" ? "Receita" : "Despesa"}</small>
      </div>
      <div>
        <span class="${tipoClasse}">${
      lancamento.tipo === "receita" ? "+" : "-"
    } ${formatarMoeda(lancamento.valor)}</span>
        <button type="button" data-action="remover" data-id="${lancamento.id}" aria-label="Remover lançamento">✕</button>
      </div>
    `;

    lista.append(li);
  }

  const saldo = totalReceitas - totalDespesas;
  saldoEl.textContent = formatarMoeda(saldo);
  totalReceitasEl.textContent = formatarMoeda(totalReceitas);
  totalDespesasEl.textContent = formatarMoeda(totalDespesas);
}

function registrarServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
