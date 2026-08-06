import { type Estrategia, type LanceBase, type TipoBem, MODAL_LABELS, CONSULTOR_CONTATOS } from './config';
import { brl, pct, type LanceResult, type ScenarioResult, type ProjResult } from './calc';

// ═══ PROPOSAL DATA ══════════════════════════════════════════════

export interface PropostaData {
  admin: { nome: string } | null;
  credito: number;
  prazo: number;
  taxaAdm: number;
  fundo: number;
  total: number;
  totalBruto: number;
  parcelaCheia: number;
  lance: LanceResult;
  parcelaReduzida: number;
  proj: ProjResult | null;
  scenarios: ScenarioResult[];
}

// ═══ PDF GENERATION ═════════════════════════════════════════════

export function gerarPDF(
  propostas: PropostaData[],
  opts: {
    nome: string;
    consultor: string;
    tipoBem: TipoBem;
    estrategia: Estrategia;
    redutor: number;
    lanceBase: LanceBase;
    contato: string;
    modo: 'rapida' | 'detalhada';
  }
): void {
  const { nome, consultor, tipoBem, estrategia, redutor, lanceBase, contato: defaultContato, modo } = opts;
  const tipoBemLbl = tipoBem === 'imovel' ? 'Imóvel' : 'Veículo';
  const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const P0 = propostas[0];

  // ── Tracking via Google Apps Script ──
  try {
    fetch('https://script.google.com/macros/s/AKfycbwa_ZLeTW9KESkYg0fRkTKDkJL3fWHtHOLnR-FgDi-mKEhu7FgikHwQK8h1IRVy7eZZ8w/exec', {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultor: consultor || '',
        cliente: nome,
        tipoBem: tipoBemLbl,
        credito: 'R$ ' + P0.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        prazo: P0.prazo + ' meses',
        modo,
        estrategia: MODAL_LABELS[estrategia] || estrategia,
        administradoras: propostas.map(x => x.admin ? x.admin.nome : '—').join(', '),
        projecao: P0.proj ? P0.proj.mes + 'º mês' : 'Cenário amplo',
      })
    }).catch(() => {});
  } catch (e) { /* ignore */ }

  // ── Proposal cards ──
  const propCards = propostas.map(pp => {
    const lanceHTML = estrategia !== 'sorteio' && pp.lance.totalLance > 0 ? `
      <div class="sec-lbl">Detalhamento do Lance</div>
      ${lanceBase === 'categoria' ? `<div class="row"><span>Base de cálculo (categoria)</span><b>${brl(pp.totalBruto)}</b></div>` : ''}
      ${pp.lance.lanceEmbutido > 0 ? `<div class="row"><span>Lance embutido (do crédito)</span><b>− ${brl(pp.lance.lanceEmbutido)}</b></div>` : ''}
      ${pp.lance.lanceLivre > 0 ? `<div class="row"><span>Lance livre (recursos próprios)</span><b>− ${brl(pp.lance.lanceLivre)}</b></div>` : ''}
      <div class="row"><span>Total do lance</span><b class="gd">${brl(pp.lance.totalLance)} (${pct(pp.lance.totalLancePct)})</b></div>
      ${pp.lance.lanceEmbutido > 0 ? `<div class="row"><span>Crédito líquido recebido</span><b>${brl(pp.lance.creditoLiquido)}</b></div>` : ''}` : '';

    const posHTML = pp.proj ? `
      <div class="sec-lbl">Parcela Pós-Contemplação — mês ${pp.proj.mes}</div>
      <div class="pos-destaque">${brl(pp.proj.parcela)}<span>/mês</span></div>
      <div class="row"><span>Saldo devedor estimado</span><b>${brl(pp.proj.saldo)}</b></div>
      <div class="row"><span>Prazo restante</span><b>${pp.proj.rest} meses</b></div>` : `
      <div class="sec-lbl">Parcela Pós-Contemplação</div>
      ${pp.scenarios.filter(s => !s.na).map(s => `<div class="row"><span>Contemplação ${s.label.toLowerCase()}</span><b class="gd">${brl(s.parcelaPos!)}/mês</b></div>`).join('')}`;

    return `
    <div class="prop">
      ${pp.admin ? `<div class="prop-admin">🏦 ${pp.admin.nome}</div>` : ''}
      <div class="big-lbl">Crédito Contratado</div>
      <div class="big-val">${brl(pp.credito)}</div>
      <div class="small-note">Consórcio de ${tipoBemLbl} · ${pp.prazo} meses</div>

      <div class="hr"></div>
      <div class="big-lbl">${redutor > 0 ? `Parcela Pré-Contemplação (${redutor}% de redução)` : 'Parcela Pré-Contemplação'}</div>
      <div class="mid-val">${brl(redutor > 0 ? pp.parcelaReduzida : pp.parcelaCheia)}<span>/mês</span></div>
      ${redutor > 0 ? `<div class="small-note">Parcela cheia: ${brl(pp.parcelaCheia)}/mês</div>` : ''}

      ${lanceHTML ? '<div class="hr"></div>' + lanceHTML : ''}

      <div class="hr"></div>
      ${posHTML}

      <div class="hr"></div>
      <div class="row"><span>Taxa de administração</span><b>${pct(pp.taxaAdm)}</b></div>
      <div class="row"><span>Fundo de reserva</span><b>${pct(pp.fundo)}</b></div>
      <div class="row"><span>Total a pagar</span><b>${brl(pp.total)}</b></div>
    </div>`;
  }).join('');

  const contatoStr = (() => {
    const c = CONSULTOR_CONTATOS[consultor];
    return c ? c.tel + ' · ' + c.email : defaultContato.split('\n').join(' · ');
  })();

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta Directcon — ${nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{height:100%}
body{font-family:'Inter','Segoe UI',sans-serif;color:#2B313C;background:#fff;font-size:10.5px;line-height:1.55;padding:12mm 13mm 9mm;display:flex;flex-direction:column}

.top{display:flex;justify-content:space-between;align-items:center;padding-bottom:13px;border-bottom:2.5px solid #ffb715}
.brand{display:flex;align-items:center;gap:11px}
.brand-name{font-size:17px;font-weight:800;letter-spacing:-.02em;color:#111;line-height:1.1}
.brand-name em{color:#ffb715;font-style:normal}
.brand-tag{font-size:7.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;margin-top:2px}
.top-right{text-align:right}
.top-right-t{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#111}
.top-right-s{font-size:8.5px;color:#6b7280;margin-top:2px}

.title-blk{margin:18px 0 4px}
h1{font-size:23px;font-weight:800;letter-spacing:-.02em;color:#111}
h1 em{color:#ffb715;font-style:normal}
.subtitle{font-size:10.5px;color:#6b7280;margin-top:4px}
.subtitle b{color:#111;font-weight:600}

.props{display:grid;grid-template-columns:repeat(${propostas.length},1fr);gap:12px;margin-top:14px}
${propostas.length === 1 ? '.props{max-width:430px;margin-left:auto;margin-right:auto}' : ''}
.prop{border:1.5px solid #e5e7eb;border-radius:13px;padding:15px 17px;background:#fafafa;break-inside:avoid}
.prop-admin{font-size:8.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#ffb715;margin-bottom:9px;padding-bottom:7px;border-bottom:1px dashed #e5e7eb}
.big-lbl{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:#6b7280}
.big-val{font-size:${propostas.length === 3 ? '17px' : '21px'};font-weight:800;letter-spacing:-.02em;color:#111;margin-top:1px}
.mid-val{font-size:${propostas.length === 3 ? '14px' : '17px'};font-weight:800;letter-spacing:-.02em;color:#ffb715;margin-top:1px}
.mid-val span{font-size:9px;font-weight:600;color:#6b7280}
.pos-destaque{font-size:${propostas.length === 3 ? '13px' : '15px'};font-weight:800;color:#111;margin:2px 0 3px}
.pos-destaque span{font-size:8.5px;font-weight:600;color:#6b7280}
.small-note{font-size:8px;color:#6b7280;margin-top:2px}
.hr{height:1px;background:#e5e7eb;margin:9px 0}
.row{display:flex;justify-content:space-between;align-items:baseline;font-size:${propostas.length === 3 ? '8px' : '8.8px'};padding:2.5px 0;color:#374151;gap:8px}
.row b{color:#111;font-weight:700;text-align:right;white-space:nowrap}
.row b.gd{color:#ffb715}
.sec-lbl{font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.13em;color:#6b7280;margin:2px 0 3px}

.strategy-line{margin-top:12px;background:#fff9e6;border:1px solid #e5e7eb;border-radius:9px;padding:9px 14px;font-size:9px;color:#374151;display:flex;gap:18px;flex-wrap:wrap}
.strategy-line b{color:#111}

.spacer{flex:1;min-height:8px}
.disc{font-size:7.5px;color:#6b7280;line-height:1.6;border-left:2.5px solid #ffb715;padding-left:10px;margin-top:10px}
.ftr{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e5e7eb;margin-top:12px;padding-top:10px}
.ftr-consult{font-size:9.5px;font-weight:700;color:#111}
.ftr-contact{font-size:8.5px;color:#6b7280;margin-top:1px}
.ftr-slogan{font-size:10px;font-weight:700;color:#ffb715;font-style:italic}
</style>
</head>
<body>

<div class="top">
  <div class="brand">
    <svg viewBox="0 0 50 58" width="34" height="40" xmlns="http://www.w3.org/2000/svg">
      <path fill="#ffb715" d="M5,1 L5,57 C42,57 49,43 49,29 C49,15 42,1 5,1 Z"/>
      <path fill="#fff" d="M13,13 C36,13 38,22 38,29 C38,36 36,45 13,45 Z"/>
      <polygon fill="#ffb715" points="15,21 35,29 15,37"/>
    </svg>
    <div>
      <div class="brand-name">Directcon <em>Consórcios</em></div>
      <div class="brand-tag">Consultoria Independente · BACEN Autorizado</div>
    </div>
  </div>
  <div class="top-right">
    <div class="top-right-t">Proposta de Consórcio</div>
    <div class="top-right-s">${now} · Validade: 30 dias</div>
  </div>
</div>

<div class="title-blk">
  <h1>Consórcio de <em>${tipoBemLbl}</em></h1>
  <div class="subtitle">Preparada para <b>${nome}</b>${consultor ? ` · Consultor responsável: <b>${consultor}</b>` : ''}</div>
</div>

<div class="props">
${propCards}
</div>

<div class="strategy-line">
  <span>Estratégia de contemplação: <b>${MODAL_LABELS[estrategia]}</b></span>
  ${estrategia !== 'sorteio' ? `<span>Base de cálculo do lance: <b>${lanceBase === 'categoria' ? 'Lance Categoria (crédito + taxas)' : 'Sobre o Crédito'}</b></span>` : ''}
  ${redutor > 0 ? `<span>Redutor pré-contemplação: <b>${redutor}%</b></span>` : ''}
</div>

<div class="spacer"></div>

<p class="disc">Projeção estimada, sem correção de índice. Créditos e parcelas são reajustados conforme o índice do grupo (INCC, IPCA ou IGP-M). A contemplação ocorre por sorteio ou lance, sem data garantida. Seguro prestamista obrigatório após a contemplação. Esta proposta é uma simulação e não representa oferta vinculante.</p>

<div class="ftr">
  <div>
    <div class="ftr-consult">${consultor || 'Directcon Consórcios'}</div>
    <div class="ftr-contact">${contatoStr}</div>
  </div>
  <div class="ftr-slogan">Dê asas ao seu sonho.</div>
</div>

<script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=960,height=720');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
