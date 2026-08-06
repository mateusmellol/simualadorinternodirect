import React, { useState, useMemo, useEffect } from 'react';
import {
  type TipoBem, type Estrategia, type LanceBase, type Config, type Admin,
  MODAL_LABELS, FUNDO_DEFAULTS,
} from '../lib/config';
import {
  parseMoney, formatMoney, brl, pct,
  computeCore, computeLance, computeScenarios, computeProjection,
} from '../lib/calc';
import { gerarPDF, type PropostaData } from '../lib/pdf';
import { DETALHADA_STEPS } from '../lib/steps';
import ProgressBar from './ProgressBar';
import PillGroup from './PillGroup';
import StrategyPills from './StrategyPills';
import LanceInputs from './LanceInputs';
import AdminSelector from './AdminSelector';
import AdminPropBlock from './AdminPropBlock';
import ScenarioTable from './ScenarioTable';
import FieldError from './FieldError';

const LS_KEY = 'simulador_detalhada_v1';

interface TabDetalhadaProps {
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

interface AdminState {
  credito: string;
  prazo: string;
  taxa: number;
  fundo: number;
}

export default function TabDetalhada({
  config, step: currentStep, onStepChange: setCurrentStep,
  nome, consultor, onBack, totalSteps,
}: TabDetalhadaProps) {
  const [tipoBem, setTipoBem]         = useState<TipoBem>('imovel');
  const [estrategia, setEstrategia]   = useState<Estrategia>('sorteio');
  const [redutor, setRedutor]         = useState(0);
  const [lanceBase, setLanceBase]     = useState<LanceBase>('credito');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [llPct, setLlPct]             = useState(20);
  const [lePct, setLePct]             = useState(25);
  const [leLLPct, setLeLLPct]         = useState(10);
  const [lfEmbPct, setLfEmbPct]       = useState(25);
  const [lfRPPct, setLfRPPct]         = useState(0);
  const [projMode, setProjMode]       = useState(false);
  const [projMesStr, setProjMesStr]   = useState('');
  const [adminStates, setAdminStates] = useState<Record<string, AdminState>>({});
  const [adminIdx, setAdminIdx]       = useState(0);

  // ── localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.tipoBem)      setTipoBem(d.tipoBem);
      if (d.estrategia)   setEstrategia(d.estrategia);
      if (d.redutor != null) setRedutor(d.redutor);
      if (d.lanceBase)    setLanceBase(d.lanceBase);
      if (d.selectedIds)  setSelectedIds(d.selectedIds);
      if (d.adminStates)  setAdminStates(d.adminStates);
      if (d.llPct  != null) setLlPct(d.llPct);
      if (d.lePct  != null) setLePct(d.lePct);
      if (d.leLLPct != null) setLeLLPct(d.leLLPct);
      if (d.lfEmbPct != null) setLfEmbPct(d.lfEmbPct);
      if (d.lfRPPct != null) setLfRPPct(d.lfRPPct);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        tipoBem, estrategia, redutor, lanceBase,
        selectedIds, adminStates, llPct, lePct, leLLPct, lfEmbPct, lfRPPct,
      }));
    } catch { /* ignore */ }
  }, [tipoBem, estrategia, redutor, lanceBase,
      selectedIds, adminStates, llPct, lePct, leLLPct, lfEmbPct, lfRPPct]);

  function getAdminState(admin: Admin): AdminState {
    if (adminStates[admin.id]) return adminStates[admin.id];
    const isImovel = tipoBem === 'imovel';
    return {
      credito: '', prazo: '',
      taxa:  isImovel ? admin.taxaImovel  : admin.taxaVeiculo,
      fundo: isImovel ? admin.fundoImovel : admin.fundoVeiculo,
    };
  }

  function updateAdminState(id: string, partial: Partial<AdminState>) {
    setAdminStates(prev => ({
      ...prev,
      [id]: { ...getAdminState(config.admins.find(a => a.id === id)!), ...prev[id], ...partial },
    }));
  }

  function handleToggle(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function handleTipoBemChange(tipo: TipoBem) {
    setTipoBem(tipo); setAdminStates({}); setSelectedIds([]);
    setCurrentStep(currentStep + 1);
  }

  // Remove selecionadas que deixaram de suportar tipo ou estratégia
  useEffect(() => {
    setSelectedIds(prev =>
      prev.filter(id => {
        const a = config.admins.find(x => x.id === id);
        return a && a.tipos.includes(tipoBem) && a.modalidades.includes(estrategia);
      })
    );
  }, [tipoBem, estrategia]);

  const selectedAdmins = selectedIds.map(id => config.admins.find(a => a.id === id)!).filter(Boolean);

  function isAdminValid(admin: Admin): boolean {
    const s = getAdminState(admin);
    const cr = parseMoney(s.credito);
    const pr = parseInt(s.prazo) || 0;
    const isImovel = tipoBem === 'imovel';
    return cr > 0 && pr >= (isImovel ? 100 : 30) && pr <= (isImovel ? 240 : 120) && s.taxa > 0;
  }

  const allAdminsValid = useMemo(() =>
    selectedAdmins.length > 0 && selectedAdmins.every(isAdminValid),
  [selectedIds, adminStates, tipoBem]);

  const stepValid = useMemo(() => [
    true,
    selectedIds.length > 0,
    allAdminsValid,
    true,
    true,
    true,
  ], [selectedIds.length, allAdminsValid]);

  function nextStep() {
    if (!stepValid[currentStep]) return;
    if (currentStep < DETALHADA_STEPS.length - 1) setCurrentStep(currentStep + 1);
  }

  useEffect(() => {
    if (adminIdx >= selectedAdmins.length) setAdminIdx(Math.max(0, selectedAdmins.length - 1));
  }, [selectedAdmins.length]);

  const currentAdmin = selectedAdmins[adminIdx] ?? null;

  const firstAdminCredito = selectedAdmins.length > 0 ? parseMoney(getAdminState(selectedAdmins[0]).credito) : 0;
  const firstTotalBruto   = firstAdminCredito > 0
    ? firstAdminCredito * (1 + (getAdminState(selectedAdmins[0]).taxa + getAdminState(selectedAdmins[0]).fundo) / 100) : 0;

  const proposals = useMemo(() => {
    if (selectedAdmins.length === 0 || !allAdminsValid) return null;
    const projMes = projMode ? (parseInt(projMesStr) || 0) : 0;
    return selectedAdmins.map(admin => {
      const state = getAdminState(admin);
      const credito = parseMoney(state.credito);
      const prazo   = parseInt(state.prazo) || 0;
      const taxa    = { admin: state.taxa, fundo: state.fundo };
      const rawBruto = credito * (1 + (state.taxa + state.fundo) / 100);
      const base     = lanceBase === 'categoria' ? rawBruto : credito;
      const lanceEmb = estrategia === 'lance_livre_embutido' ? base * lePct / 100
        : estrategia === 'lance_fixo' ? base * lfEmbPct / 100 : 0;
      const core  = computeCore(taxa, credito, prazo, lanceEmb);
      const lance = computeLance(estrategia, credito, llPct, lePct, leLLPct, lfEmbPct, lfRPPct, lanceBase, core.totalBruto);
      const parcelaReduzida = core.parcelaCheia * (1 - redutor / 100);
      const proj = projMes > 0 && projMes < prazo
        ? computeProjection(core.total, parcelaReduzida, prazo, lance.lanceLivre, projMes) : null;
      const scenarios = computeScenarios(core.total, parcelaReduzida, prazo, lance.lanceLivre);
      return {
        admin: { nome: admin.nome }, credito, prazo,
        taxaAdm: state.taxa, fundo: state.fundo,
        total: core.total, totalBruto: core.totalBruto,
        parcelaCheia: core.parcelaCheia, lance, parcelaReduzida, proj, scenarios,
      } as PropostaData;
    });
  }, [selectedIds, adminStates, tipoBem, estrategia, redutor, lanceBase,
      llPct, lePct, leLLPct, lfEmbPct, lfRPPct, projMode, projMesStr]);

  function limpar() {
    setSelectedIds([]); setAdminStates({});
    setEstrategia('sorteio'); setLanceBase('credito'); setRedutor(0);
    setLlPct(20); setLePct(25); setLeLLPct(10); setLfEmbPct(25); setLfRPPct(0);
    setProjMode(false); setProjMesStr('');
    setAdminIdx(0);
    setCurrentStep(0);
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }

  function handleGerarPDF() {
    if (!proposals) return;
    gerarPDF(proposals, {
      nome: nome || 'Cliente', consultor, tipoBem, estrategia, redutor, lanceBase,
      contato: config.contato, modo: 'detalhada',
    });
  }

  const BackArrow = () => (
    <div className="step-top">
      <button className="back-arrow" onClick={onBack} aria-label="Voltar">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
            <button className="btn btn-gold" onClick={nextStep}>Continuar</button>
          </div>
        </>
      )}

      {/* ── Step 1: Administradoras ── */}
      {currentStep === 1 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Administradoras</h2>
              <AdminSelector
                admins={config.admins}
                selectedIds={selectedIds}
                tipoBem={tipoBem}
                estrategia={estrategia}
                onToggle={handleToggle}
              />
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
            <button className="btn btn-gold" onClick={nextStep} disabled={selectedIds.length === 0}>Continuar</button>
          </div>
        </>
      )}

      {/* ── Step 2: Dados por administradora ── */}
      {currentStep === 2 && currentAdmin && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Dados por Administradora</h2>
              {selectedAdmins.length > 1 && (
                <div className="admin-subnav">
                  <button
                    className="admin-subnav__arrow"
                    onClick={() => setAdminIdx(i => Math.max(0, i - 1))}
                    disabled={adminIdx === 0}
                  >‹</button>
                  <span className="admin-subnav__label">
                    {currentAdmin.nome} ({adminIdx + 1}/{selectedAdmins.length})
                  </span>
                  <button
                    className="admin-subnav__arrow"
                    onClick={() => setAdminIdx(i => Math.min(selectedAdmins.length - 1, i + 1))}
                    disabled={adminIdx === selectedAdmins.length - 1}
                  >›</button>
                </div>
              )}
              <AdminPropBlock
                key={currentAdmin.id}
                admin={currentAdmin}
                tipoBem={tipoBem}
                credito={getAdminState(currentAdmin).credito}
                prazo={getAdminState(currentAdmin).prazo}
                taxa={getAdminState(currentAdmin).taxa}
                fundo={getAdminState(currentAdmin).fundo}
                onCreditoChange={v => updateAdminState(currentAdmin.id, { credito: v })}
                onPrazoChange={v   => updateAdminState(currentAdmin.id, { prazo: v })}
                onTaxaChange={v    => updateAdminState(currentAdmin.id, { taxa: v })}
                onFundoChange={v   => updateAdminState(currentAdmin.id, { fundo: v })}
              />
              {selectedAdmins.length > 1 && (
                <div className="admin-dots">
                  {selectedAdmins.map((a, i) => (
                    <span
                      key={a.id}
                      className={`admin-dot${isAdminValid(a) ? ' done' : ''}${i === adminIdx ? ' current' : ''}`}
                      onClick={() => setAdminIdx(i)}
                      title={a.nome}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
            <button className="btn btn-gold" onClick={nextStep} disabled={!allAdminsValid}>
              {allAdminsValid ? 'Continuar' : `Preencha ${selectedAdmins.filter(a => !isAdminValid(a)).length} adm.`}
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: Estratégia ── */}
      {currentStep === 3 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Estratégia de Contemplação</h2>
              <div className="fg">
                <label htmlFor="d-redutor">Redutor pré-contemplação</label>
                <div className="select-wrap">
                  <select id="d-redutor" value={redutor} onChange={e => setRedutor(parseInt(e.target.value))}>
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
                  <span className="select-arrow">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
              <StrategyPills value={estrategia} onChange={setEstrategia} />
              <LanceInputs
                prefix="d" estrategia={estrategia} lanceBase={lanceBase}
                onLanceBaseChange={setLanceBase} credito={firstAdminCredito} totalBruto={firstTotalBruto}
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
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
            <button className="btn btn-gold" onClick={nextStep}>Continuar</button>
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
                  <button type="button" className={`tab-toggle__opt${!projMode ? ' active' : ''}`} onClick={() => setProjMode(false)}>
                    Cenário amplo
                  </button>
                  <button type="button" className={`tab-toggle__opt${projMode ? ' active' : ''}`} onClick={() => setProjMode(true)}>
                    Mês específico
                  </button>
                </div>
              </div>
              {!projMode && (
                <div className="info-card">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="info-card__icon">
                    <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M9 6v5M9 12.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <div className="info-card__title">O que é o cenário amplo?</div>
                    <div className="info-card__body">
                      A projeção em cenário amplo analisa o comportamento das parcelas ao longo de múltiplos cenários de prazos simultâneos.
                    </div>
                  </div>
                </div>
              )}
              {projMode && (
                <div className="fg">
                  <label htmlFor="d-projmes">Mês projetado para contemplação</label>
                  <input
                    id="d-projmes" type="text" inputMode="numeric"
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
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
            <button className="btn btn-gold" onClick={nextStep}>Ver simulação</button>
          </div>
        </>
      )}

      {/* ── Step 5: Resultado ── */}
      {currentStep === 5 && (
        <>
          <BackArrow />
          <div className="step-body">
            <div className="step-inner">
              <h2 className="step-title">Comparativo</h2>
              {proposals && proposals.length > 0 ? (
                <>
                  <div className={`comp-grid comp-grid--${proposals.length}`}>
                    {proposals.map((pp, i) => {
                      const admin = selectedAdmins[i];
                      return (
                        <div key={admin.id} className="comp-card">
                          <div className="comp-card__head">
                            <span className="comp-card__name">{admin.nome}</span>
                          </div>
                          <div className="comp-row">
                            <span className="comp-label">Crédito</span>
                            <span className="comp-value comp-value--big">{brl(pp.credito)}</span>
                          </div>
                          <div className="comp-row">
                            <span className="comp-label">Parcela{redutor > 0 ? ` (${redutor}% red.)` : ''}</span>
                            <span className="comp-value comp-value--big">
                              {brl(redutor > 0 ? pp.parcelaReduzida : pp.parcelaCheia)}/mês
                            </span>
                          </div>
                          {estrategia !== 'sorteio' && (
                            <>
                              <div className="comp-sep">{MODAL_LABELS[estrategia]}</div>
                              {pp.lance.lanceEmbutido > 0 && (
                                <div className="comp-row">
                                  <span className="comp-label">Lance Embutido</span>
                                  <span className="comp-value">− {brl(pp.lance.lanceEmbutido)}</span>
                                </div>
                              )}
                              {pp.lance.lanceLivre > 0 && (
                                <div className="comp-row">
                                  <span className="comp-label">Lance Livre</span>
                                  <span className="comp-value">− {brl(pp.lance.lanceLivre)}</span>
                                </div>
                              )}
                              <div className="comp-row">
                                <span className="comp-label">Total Lance</span>
                                <span className="comp-value comp-value--gold">
                                  {brl(pp.lance.totalLance)} ({pct(pp.lance.totalLancePct)})
                                </span>
                              </div>
                            </>
                          )}
                          <div className="comp-sep">Condições</div>
                          <div className="comp-row">
                            <span className="comp-label">Taxa · Fundo</span>
                            <span className="comp-value">{pct(pp.taxaAdm)} · {pct(pp.fundo)}</span>
                          </div>
                          <div className="comp-row">
                            <span className="comp-label">Prazo</span>
                            <span className="comp-value">{pp.prazo} meses</span>
                          </div>
                          <div className="comp-row">
                            <span className="comp-label">Total</span>
                            <span className="comp-value">{brl(pp.total)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!projMode && (
                    <div className="card-section">
                      <div className="card-section__title">Parcela Pós-Contemplação — Cenários</div>
                      {proposals.map((pp, i) => (
                        <ScenarioTable
                          key={selectedAdmins[i].id}
                          scenarios={pp.scenarios}
                          adminName={proposals.length > 1 ? selectedAdmins[i].nome : undefined}
                        />
                      ))}
                    </div>
                  )}

                  <p className="disclaimer">Projeção estimada. Valores reais podem variar conforme índice de correção do grupo.</p>

                  <div className="cta-group">
                    <button className="btn btn-gold cta-btn" onClick={handleGerarPDF}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M4 14h8M8 2v8m0 0l3-3m-3 3L5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Gerar Proposta PDF
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={limpar}>Limpar simulação</button>
                  </div>
                </>
              ) : (
                <div className="awaiting-card">
                  <div className="awaiting-card__icon">◆</div>
                  <div className="awaiting-card__title">Dados incompletos</div>
                  <div className="awaiting-card__body">Selecione administradoras e preencha os dados para ver o comparativo</div>
                </div>
              )}
            </div>
          </div>
          <ProgressBar total={totalSteps} current={currentStep} />
          <div className="step-footer">
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
          </div>
        </>
      )}
    </>
  );
}
