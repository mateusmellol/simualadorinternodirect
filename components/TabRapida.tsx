import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Info, Download } from 'lucide-react';
import {
  type TipoBem, type Estrategia, type LanceBase, type Config,
  TAXA_RANGES, PRAZO_RANGES, FUNDO_DEFAULTS, CREDITO_RANGES,
} from '../lib/config';
import {
  parseMoney, formatMoney, brl, pct,
  computeCore, computeLance, computeScenarios, computeProjection,
} from '../lib/calc';
import { gerarPDF, type PropostaData } from '../lib/pdf';
import { RAPIDA_STEPS } from '../lib/steps';
import ProgressBar from './ProgressBar';
import PillGroup from './PillGroup';
import StrategyPills from './StrategyPills';
import LanceInputs from './LanceInputs';
import LanceCard from './LanceCard';
import ScenarioTable from './ScenarioTable';
import FieldError from './FieldError';

const LS_KEY = 'simulador_rapida_v1';

const ESTRATEGIA_LABEL: Record<Estrategia, string> = {
  sorteio: 'Sorteio',
  lance_livre: 'Lance Livre',
  lance_livre_embutido: 'Lance Embutido',
  lance_fixo: 'Lance Fixo',
};

interface TabRapidaProps {
  config: Config;
  consultores: string[];
  step: number;
  onStepChange: (s: number) => void;
  direction: number;
  nome: string;
  consultor: string;
  onBack: () => void;
  totalSteps: number;
}

export default function TabRapida({
  config, step: currentStep, onStepChange: setCurrentStep,
  nome, consultor, onBack, totalSteps,
}: TabRapidaProps) {
  const [tipoBem, setTipoBem]     = useState<TipoBem>('imovel');
  const [creditoStr, setCreditoStr] = useState('');
  const [prazoStr, setPrazoStr]   = useState('');
  const [taxaAdm, setTaxaAdm]     = useState(TAXA_RANGES.imovel.default);
  const [fundoAdm, setFundoAdm]   = useState(FUNDO_DEFAULTS.imovel);
  const [redutor, setRedutor]     = useState(0);
  const [estrategia, setEstrategia] = useState<Estrategia>('sorteio');
  const [lanceBase, setLanceBase] = useState<LanceBase>('credito');
  const [llPct, setLlPct]         = useState(20);
  const [lePct, setLePct]         = useState(25);
  const [leLLPct, setLeLLPct]     = useState(10);
  const [lfEmbPct, setLfEmbPct]   = useState(25);
  const [lfRPPct, setLfRPPct]     = useState(0);
  const [projMode, setProjMode]   = useState(false);
  const [projMesStr, setProjMesStr] = useState('');
  const [touched, setTouched]     = useState<Record<string, boolean>>({});

  function touch(field: string) {
    setTouched(t => ({ ...t, [field]: true }));
  }

  // ── Restore from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.tipoBem)          setTipoBem(d.tipoBem);
      if (d.creditoStr)       setCreditoStr(d.creditoStr);
      if (d.prazoStr)         setPrazoStr(d.prazoStr);
      if (d.taxaAdm  != null) setTaxaAdm(d.taxaAdm);
      if (d.fundoAdm != null) setFundoAdm(d.fundoAdm);
      if (d.redutor  != null) setRedutor(d.redutor);
      if (d.estrategia)       setEstrategia(d.estrategia);
      if (d.lanceBase)        setLanceBase(d.lanceBase);
      if (d.llPct    != null) setLlPct(d.llPct);
      if (d.lePct    != null) setLePct(d.lePct);
      if (d.leLLPct  != null) setLeLLPct(d.leLLPct);
      if (d.lfEmbPct != null) setLfEmbPct(d.lfEmbPct);
      if (d.lfRPPct  != null) setLfRPPct(d.lfRPPct);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line

  // ── Persist to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        tipoBem, creditoStr, prazoStr, taxaAdm, fundoAdm,
        redutor, estrategia, lanceBase, llPct, lePct, leLLPct, lfEmbPct, lfRPPct,
      }));
    } catch { /* ignore */ }
  }, [tipoBem, creditoStr, prazoStr, taxaAdm, fundoAdm,
      redutor, estrategia, lanceBase, llPct, lePct, leLLPct, lfEmbPct, lfRPPct]);

  // ── Derived ──
  const credito = parseMoney(creditoStr);
  const prazo   = parseInt(prazoStr) || 0;
  const pr      = PRAZO_RANGES[tipoBem];
  const cr      = CREDITO_RANGES[tipoBem];
  const prazoOk = prazo >= pr.min && prazo <= pr.max;
  const hasResult = credito > 0 && prazoOk;

  const fieldErrors = useMemo(() => ({
    credito: touched.credito && credito <= 0
      ? creditoStr.length === 0 ? 'Informe o valor do crédito' : 'Valor inválido (ex: R$ 300.000)' : '',
    prazo: touched.prazo && (prazoStr.length === 0 || !prazoOk)
      ? prazoStr.length === 0 ? 'Informe o prazo em meses'
        : `Prazo deve ser entre ${pr.min} e ${pr.max} meses` : '',
    taxaAdm: touched.taxaAdm && taxaAdm <= 0 ? 'Informe a taxa de administração' : '',
  }), [touched, credito, creditoStr, prazoStr, prazoOk, pr, taxaAdm]);

  const stepValid = useMemo(() => [
    true,
    credito > 0 && prazoOk,
    taxaAdm > 0,
    true,
    true,
    true,
  ], [credito, prazoOk, taxaAdm]);

  function nextStep() {
    if (!stepValid[currentStep]) {
      const STEP_FIELDS: Record<number, string[]> = { 1: ['credito', 'prazo'], 2: ['taxaAdm'] };
      const fields = STEP_FIELDS[currentStep] ?? [];
      if (fields.length) setTouched(t => ({ ...t, ...Object.fromEntries(fields.map(f => [f, true])) }));
      return;
    }
    if (currentStep < RAPIDA_STEPS.length - 1) setCurrentStep(currentStep + 1);
  }

  const sliderPct = credito > 0
    ? Math.min(100, Math.max(0, ((credito - cr.min) / (cr.max - cr.min)) * 100))
    : 0;

  function handleTipoBemChange(tipo: TipoBem) {
    setTipoBem(tipo);
    setTaxaAdm(TAXA_RANGES[tipo].default);
    setFundoAdm(FUNDO_DEFAULTS[tipo]);
    setPrazoStr('');
    const newCr = CREDITO_RANGES[tipo];
    if (credito > 0 && (credito < newCr.min || credito > newCr.max)) {
      setCreditoStr(formatMoney(String(newCr.default)));
    }
    setCurrentStep(currentStep + 1);
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCreditoStr(formatMoney(String(parseInt(e.target.value))));
  }

  function limpar() {
    setCreditoStr(''); setPrazoStr('');
    setTaxaAdm(TAXA_RANGES[tipoBem].default);
    setFundoAdm(FUNDO_DEFAULTS[tipoBem]);
    setRedutor(0); setEstrategia('sorteio'); setLanceBase('credito');
    setLlPct(20); setLePct(25); setLeLLPct(10); setLfEmbPct(25); setLfRPPct(0);
    setProjMode(false); setProjMesStr('');
    setTouched({});
    setCurrentStep(0);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }

  // ── Calculation ──
  const rawTotalBruto = credito * (1 + (taxaAdm + fundoAdm) / 100);
  const result = useMemo(() => {
    if (!hasResult || taxaAdm <= 0) return null;
    const taxa = { admin: taxaAdm, fundo: fundoAdm };
    const base = lanceBase === 'categoria' ? rawTotalBruto : credito;
    const lanceEmbutidoVal = estrategia === 'lance_livre_embutido' ? base * lePct / 100
      : estrategia === 'lance_fixo' ? base * lfEmbPct / 100 : 0;
    const core = computeCore(taxa, credito, prazo, lanceEmbutidoVal);
    const lance = computeLance(estrategia, credito, llPct, lePct, leLLPct, lfEmbPct, lfRPPct, lanceBase, core.totalBruto);
    const parcelaReduzida = core.parcelaCheia * (1 - redutor / 100);
    const projMes = parseInt(projMesStr) || 0;
    const proj = projMode ? computeProjection(core.total, parcelaReduzida, prazo, lance.lanceLivre, projMes) : null;
    const scenarios = computeScenarios(core.total, parcelaReduzida, prazo, lance.lanceLivre);
    return { core, lance, parcelaReduzida, proj, scenarios };
  }, [hasResult, credito, prazo, taxaAdm, fundoAdm, redutor, estrategia, lanceBase,
      llPct, lePct, leLLPct, lfEmbPct, lfRPPct, projMode, projMesStr]);

  function handleGerarPDF() {
    if (!result) return;
    const proposta: PropostaData = {
      admin: null, credito, prazo, taxaAdm, fundo: fundoAdm,
      total: result.core.total, totalBruto: result.core.totalBruto,
      parcelaCheia: result.core.parcelaCheia, lance: result.lance,
      parcelaReduzida: result.parcelaReduzida, proj: result.proj, scenarios: result.scenarios,
    };
    gerarPDF([proposta], {
      nome: nome || 'Cliente', consultor, tipoBem, estrategia, redutor, lanceBase,
      contato: config.contato, modo: 'rapida',
    });
  }

  const isLastStep = currentStep >= RAPIDA_STEPS.length - 1;

  const BackArrow = () => (
    <div className="step-top">
      <button className="back-arrow" onClick={onBack} aria-label="Voltar">
        <ChevronLeft size={16} />
      </button>
    </div>
  );

  // ── Render ──
  return (
    <>
      {/* ── Step 0: Tipo de Bem ── */}
      {currentStep === 0 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Tipo de Bem</h2>
              <PillGroup value={tipoBem} onChange={handleTipoBemChange} />
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-gold btn-full" onClick={nextStep}>Continuar</button>
          </div>
        </>
      )}

      {/* ── Step 1: Crédito e Prazo ── */}
      {currentStep === 1 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Crédito e Prazo</h2>
              <div className={`fg${fieldErrors.credito ? ' fg--error' : ''}`}>
                <label htmlFor="r-credito">Valor do crédito</label>
                <input
                  id="r-credito" type="text" inputMode="numeric" autoComplete="off"
                  placeholder="Ex: R$ 300.000"
                  value={creditoStr}
                  onChange={e => setCreditoStr(formatMoney(e.target.value))}
                  onBlur={() => touch('credito')}
                  aria-invalid={!!fieldErrors.credito}
                />
                <input
                  type="range"
                  min={cr.min} max={cr.max} step={cr.step}
                  value={credito || cr.min}
                  onChange={handleSliderChange}
                  className="credit-slider"
                  style={{ '--slider-pct': `${sliderPct}%` } as React.CSSProperties}
                />
                <div className="slider-labels">
                  <span>R$ {cr.min.toLocaleString('pt-BR')}</span>
                  <span>R$ {cr.max.toLocaleString('pt-BR')}</span>
                </div>
                <FieldError msg={fieldErrors.credito} />
              </div>
              <div className={`fg${fieldErrors.prazo ? ' fg--error' : ''}`}>
                <label htmlFor="r-prazo">Prazo (meses)</label>
                <input
                  id="r-prazo" type="text" inputMode="numeric" autoComplete="off"
                  placeholder={pr.placeholder}
                  value={prazoStr}
                  onChange={e => setPrazoStr(e.target.value)}
                  onBlur={() => touch('prazo')}
                  aria-invalid={!!fieldErrors.prazo}
                />
                {!fieldErrors.prazo && (
                  <div className="field-hint">Prazo sugerido: {pr.min} a {pr.max} meses</div>
                )}
                <FieldError msg={fieldErrors.prazo} />
              </div>
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-gold btn-full" onClick={nextStep}>Continuar</button>
          </div>
        </>
      )}

      {/* ── Step 2: Taxa e Fundo ── */}
      {currentStep === 2 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Taxa e Fundo</h2>
              <div className={`fg${fieldErrors.taxaAdm ? ' fg--error' : ''}`}>
                <label htmlFor="r-taxa">Taxa de administração (%)</label>
                <div className="input-wrap">
                  <input
                    id="r-taxa" type="text" inputMode="decimal" autoComplete="off"
                    placeholder={String(TAXA_RANGES[tipoBem].default)}
                    value={taxaAdm}
                    onChange={e => setTaxaAdm(parseFloat(e.target.value) || 0)}
                    onBlur={() => touch('taxaAdm')}
                    aria-invalid={!!fieldErrors.taxaAdm}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {!fieldErrors.taxaAdm && (
                  <div className="field-hint">Média de mercado: {TAXA_RANGES[tipoBem].min}% a {TAXA_RANGES[tipoBem].max}%</div>
                )}
                <FieldError msg={fieldErrors.taxaAdm} />
              </div>
              <div className="fg">
                <label htmlFor="r-fundo">
                  Fundo de reserva (%) <span className="field-optional">opcional</span>
                </label>
                <div className="input-wrap">
                  <input
                    id="r-fundo" type="text" inputMode="decimal" autoComplete="off"
                    placeholder="2,00"
                    value={fundoAdm}
                    onChange={e => setFundoAdm(parseFloat(e.target.value) || 0)}
                  />
                  <span className="input-suffix">%</span>
                </div>
                <div className="field-hint">Média de mercado: 0% a 5%</div>
              </div>
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-gold btn-full" onClick={nextStep}>Continuar</button>
          </div>
        </>
      )}

      {/* ── Step 3: Estratégia de Contemplação ── */}
      {currentStep === 3 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Estratégia de Contemplação</h2>
              <div className="fg">
                <label htmlFor="r-redutor">Redutor pré-contemplação</label>
                <div className="select-wrap">
                  <select
                    id="r-redutor"
                    value={redutor}
                    onChange={e => setRedutor(parseInt(e.target.value))}
                  >
                    <option value={0}>0% (cheia integral)</option>
                    <option value={5}>5% de redução</option>
                    <option value={15}>15% de redução</option>
                    <option value={20}>20% de redução</option>
                    <option value={25}>25% de redução</option>
                    <option value={30}>30% de redução</option>
                    <option value={35}>35% de redução</option>
                    <option value={40}>40% de redução</option>
                    <option value={45}>45% de redução</option>
                    <option value={50}>50% de redução (meia parcela)</option>
                  </select>
                  <span className="select-arrow"><ChevronDown size={16} /></span>
                </div>
              </div>
              <StrategyPills value={estrategia} onChange={setEstrategia} />
              <LanceInputs
                prefix="r" estrategia={estrategia} lanceBase={lanceBase}
                onLanceBaseChange={setLanceBase} credito={credito} totalBruto={rawTotalBruto}
                llPct={llPct} onLlPctChange={setLlPct}
                lePct={lePct} onLePctChange={setLePct}
                leLLPct={leLLPct} onLeLLPctChange={setLeLLPct}
                lfEmbPct={lfEmbPct} onLfEmbPctChange={setLfEmbPct}
                lfRPPct={lfRPPct} onLfRPPctChange={setLfRPPct}
              />
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-gold btn-full" onClick={nextStep}>Continuar</button>
          </div>
        </>
      )}

      {/* ── Step 4: Projeção ── */}
      {currentStep === 4 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Projeção</h2>
              <div className="fg">
                <label>Escolha a visualização</label>
                <div className="tab-toggle">
                  <button
                    type="button"
                    className={`tab-toggle__opt${!projMode ? ' active' : ''}`}
                    onClick={() => setProjMode(false)}
                  >
                    Cenário amplo
                  </button>
                  <button
                    type="button"
                    className={`tab-toggle__opt${projMode ? ' active' : ''}`}
                    onClick={() => setProjMode(true)}
                  >
                    Mês específico
                  </button>
                </div>
              </div>
              {!projMode && (
                <div className="info-card">
                  <Info size={18} className="info-card__icon" />
                  <div>
                    <div className="info-card__title">O que é o cenário amplo?</div>
                    <div className="info-card__body">
                      A projeção em cenário amplo analisa o comportamento das parcelas, taxas e amortizações
                      ao longo de múltiplos cenários de prazos simultâneos. Ideal para comparar planos de longo prazo.
                    </div>
                  </div>
                </div>
              )}
              {projMode && (
                <div className="fg">
                  <label htmlFor="r-projmes">Mês projetado para contemplação</label>
                  <input
                    id="r-projmes" type="text" inputMode="numeric"
                    placeholder="Ex: 36"
                    value={projMesStr}
                    onChange={e => setProjMesStr(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-gold btn-full" onClick={nextStep}>Ver simulação</button>
          </div>
        </>
      )}

      {/* ── Step 5: Resultado ── */}
      {currentStep === 5 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Resultado</h2>

              <div className="resumo-card">
                <div className="resumo-card__title">Resumo da simulação</div>
                {[
                  ['Cliente', nome || '—'],
                  ['Tipo de bem', tipoBem === 'imovel' ? 'Imóvel' : 'Veículo'],
                  ['Crédito', credito > 0 ? brl(credito) : '—'],
                  ['Prazo', prazo > 0 ? `${prazo} meses` : '—'],
                  ['Taxa total', pct(taxaAdm + fundoAdm)],
                  ['Estratégia', ESTRATEGIA_LABEL[estrategia]],
                  ...(redutor > 0 ? [['Redutor', `${redutor}% pré-contemplação`]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="resumo-row">
                    <span className="resumo-row__label">{label}</span>
                    <span className="resumo-row__value">{value}</span>
                  </div>
                ))}
              </div>

              {hasResult && result ? (
                <>
                  <div className="result-duo">
                    <div className="result-box">
                      <div className="result-box__label">Crédito Contratado</div>
                      <div className="result-box__value">{brl(credito)}</div>
                      <div className="result-box__sub">
                        Consórcio de {tipoBem === 'imovel' ? 'Imóvel' : 'Veículo'} · {prazo} meses
                      </div>
                    </div>
                    <div className="result-box result-box--primary">
                      <div className="result-box__label">
                        {redutor > 0 ? `Parcela pré-contemplação (${redutor}% red.)` : 'Parcela pré-contemplação'}
                      </div>
                      <div className="result-box__value result-box__value--gold">
                        {brl(redutor > 0 ? result.parcelaReduzida : result.core.parcelaCheia)}/mês
                      </div>
                      {redutor > 0 && (
                        <div className="result-box__sub">Parcela cheia: {brl(result.core.parcelaCheia)}</div>
                      )}
                    </div>
                  </div>

                  <LanceCard estrategia={estrategia} credito={credito} lance={result.lance} />

                  {projMode && result.proj && (
                    <div className="proj-card">
                      <div className="proj-card__label">Parcela Pós-Contemplação — Mês {result.proj.mes}</div>
                      <div className="proj-card__value">{brl(result.proj.parcela)}<span>/mês</span></div>
                      <div className="proj-card__sub">
                        Saldo estimado: {brl(result.proj.saldo)} · Prazo restante: {result.proj.rest} meses
                      </div>
                    </div>
                  )}

                  {!projMode && (
                    <div className="card-section">
                      <div className="card-section__title">Parcela Pós-Contemplação — Cenários</div>
                      <ScenarioTable scenarios={result.scenarios} />
                    </div>
                  )}

                  <div className="result-meta">
                    <span>Taxa: <strong>{pct(taxaAdm)}</strong></span>
                    <span>Fundo: <strong>{pct(fundoAdm)}</strong></span>
                    <span>Total: <strong>{brl(result.core.total)}</strong></span>
                  </div>

                  <p className="disclaimer">
                    Projeção estimada. Valores reais podem variar conforme índice de correção do grupo (INCC, IPCA ou IGP-M).
                  </p>

                  <div className="cta-group">
                    <button className="btn btn-gold cta-btn" onClick={handleGerarPDF}>
                      <Download size={15} />
                      Gerar Proposta PDF
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={limpar}>Limpar simulação</button>
                  </div>
                </>
              ) : (
                <div className="awaiting-card">
                  <div className="awaiting-card__icon">◆</div>
                  <div className="awaiting-card__title">Dados incompletos</div>
                  <div className="awaiting-card__body">Preencha o crédito e o prazo para ver a simulação</div>
                </div>
              )}
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
        </>
      )}
    </>
  );
}
