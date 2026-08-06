import { type Config, type TipoBem, type Estrategia, type LanceBase, SCENARIOS } from './config';

// ═══ FORMATTING ═════════════════════════════════════════════════

const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (v: number): string => brlFormatter.format(v);
export const pct = (v: number): string => (+v).toFixed(1) + '%';

// ═══ MONEY MASK ═════════════════════════════════════════════════

export function parseMoney(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatMoney(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return 'R$ ' + parseInt(digits, 10).toLocaleString('pt-BR');
}

// ═══ TAXA HELPERS ═══════════════════════════════════════════════

export function getTaxaMedia(cfg: Config, tipo: TipoBem, prazo: number) {
  const faixas = cfg.taxas[tipo];
  for (const g of faixas) {
    if (prazo >= g.prazoMin && prazo <= g.prazoMax) return g;
  }
  return faixas[faixas.length - 1];
}

export function getTaxaAdmin(admin: { taxaImovel: number; fundoImovel: number; taxaVeiculo: number; fundoVeiculo: number }, tipo: TipoBem) {
  return tipo === 'imovel'
    ? { admin: admin.taxaImovel, fundo: admin.fundoImovel }
    : { admin: admin.taxaVeiculo, fundo: admin.fundoVeiculo };
}

// ═══ CORE CALCULATION ═══════════════════════════════════════════

export interface CoreResult {
  total: number;
  totalBruto: number;
  parcelaCheia: number;
  taxa: { admin: number; fundo: number };
}

export function computeCore(
  taxa: { admin: number; fundo: number },
  credito: number,
  prazo: number,
  lanceEmbutido: number = 0
): CoreResult {
  const totalBruto = credito * (1 + (taxa.admin + taxa.fundo) / 100);
  const parcelaCheia = totalBruto / prazo;
  const total = totalBruto - lanceEmbutido;
  return { total, totalBruto, parcelaCheia, taxa };
}

// ═══ LANCE CALCULATION ══════════════════════════════════════════

export interface LanceResult {
  lanceEmbutido: number;
  lanceLivre: number;
  creditoLiquido: number;
  totalLance: number;
  totalLancePct: number;
  base: number;
  lanceBase: LanceBase;
}

export function computeLance(
  estrategia: Estrategia,
  credito: number,
  llPct: number,
  lePct: number,
  leLLPct: number,
  lfEmbPct: number,
  lfRPPct: number,
  lanceBase: LanceBase = 'credito',
  totalBruto: number = 0
): LanceResult {
  const base = lanceBase === 'categoria' ? totalBruto : credito;
  let lanceEmbutido = 0, lanceLivre = 0, creditoLiquido = credito;

  if (estrategia === 'lance_livre') {
    lanceLivre = base * (llPct / 100);
  } else if (estrategia === 'lance_livre_embutido') {
    lanceEmbutido = base * (lePct / 100);
    lanceLivre = base * (leLLPct / 100);
    creditoLiquido = credito - lanceEmbutido;
  } else if (estrategia === 'lance_fixo') {
    lanceEmbutido = base * (lfEmbPct / 100);
    lanceLivre = base * (lfRPPct / 100);
    creditoLiquido = credito - lanceEmbutido;
  }

  const totalLance = lanceEmbutido + lanceLivre;
  const totalLancePct = credito > 0 ? (totalLance / credito) * 100 : 0;

  return { lanceEmbutido, lanceLivre, creditoLiquido, totalLance, totalLancePct, base, lanceBase };
}

// ═══ SCENARIO CALCULATION ═══════════════════════════════════════

export interface ScenarioResult {
  label: string;
  ref: number;
  na?: boolean;
  paid?: number;
  saldo?: number;
  prazoRest?: number;
  parcelaPos?: number;
}

export function computeScenarios(
  total: number,
  parcelaReduzida: number,
  prazo: number,
  lanceLivreR: number = 0
): ScenarioResult[] {
  return SCENARIOS.map(s => {
    if (s.ref >= prazo) return { ...s, na: true };
    const paid = parcelaReduzida * s.ref;
    const saldo = Math.max(total - paid - lanceLivreR, 0);
    const prazoRest = prazo - s.ref;
    const parcelaPos = prazoRest > 0 ? saldo / prazoRest : 0;
    return { ...s, paid, saldo, prazoRest, parcelaPos };
  });
}

// ═══ PROJECTION (specific month) ════════════════════════════════

export interface ProjResult {
  mes: number;
  saldo: number;
  rest: number;
  parcela: number;
}

export function computeProjection(
  total: number,
  parcelaReduzida: number,
  prazo: number,
  lanceLivre: number,
  projMes: number
): ProjResult | null {
  if (projMes <= 0 || projMes >= prazo) return null;
  const saldo = Math.max(total - parcelaReduzida * projMes - lanceLivre, 0);
  const rest = prazo - projMes;
  const parcela = rest > 0 ? saldo / rest : 0;
  return { mes: projMes, saldo, rest, parcela };
}

// ═══ BUILD LANCE HTML (for PDF) ═════════════════════════════════

export function buildLanceHTML(
  estrategia: Estrategia,
  credito: number,
  lance: LanceResult
): string {
  if (estrategia === 'sorteio') return '';
  const rows: string[] = [];
  rows.push(`<div class="lance-row"><span>Crédito Contratado</span><span>${brl(credito)}</span></div>`);
  if (lance.lanceBase === 'categoria') {
    rows.push(`<div class="lance-row" style="color:#F2B324"><span>⚡ Base: Lance Categoria</span><span>${brl(lance.base)}</span></div>`);
  }
  if (estrategia === 'lance_livre') {
    rows.push(`<div class="lance-row"><span>Lance Livre (recursos próprios)</span><span>− ${brl(lance.lanceLivre)} (${pct(lance.lanceLivre / credito * 100)})</span></div>`);
  }
  if (estrategia === 'lance_livre_embutido') {
    rows.push(`<div class="lance-row"><span>Lance Embutido (do crédito)</span><span>- ${brl(lance.lanceEmbutido)}</span></div>`);
    if (lance.lanceLivre > 0) rows.push(`<div class="lance-row"><span>Lance Livre (recursos próprios)</span><span>− ${brl(lance.lanceLivre)}</span></div>`);
    rows.push(`<div class="lance-row"><span>Total do Lance</span><span>${brl(lance.totalLance)} (${pct(lance.totalLancePct)})</span></div>`);
    rows.push(`<div class="lance-row"><span>Crédito Líquido Recebido</span><span>${brl(lance.creditoLiquido)}</span></div>`);
  }
  if (estrategia === 'lance_fixo') {
    if (lance.lanceEmbutido > 0) rows.push(`<div class="lance-row"><span>Lance Embutido (do crédito)</span><span>- ${brl(lance.lanceEmbutido)}</span></div>`);
    if (lance.lanceLivre > 0) rows.push(`<div class="lance-row"><span>Recursos Próprios</span><span>− ${brl(lance.lanceLivre)}</span></div>`);
    rows.push(`<div class="lance-row"><span>Total do Lance</span><span>${brl(lance.totalLance)} (${pct(lance.totalLancePct)})</span></div>`);
    if (lance.lanceEmbutido > 0) rows.push(`<div class="lance-row"><span>Crédito Líquido Recebido</span><span>${brl(lance.creditoLiquido)}</span></div>`);
  }
  return rows.join('');
}
