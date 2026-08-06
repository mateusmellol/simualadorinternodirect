export interface StepDef {
  id: string;
  label: string;
}

// ── Simulação Rápida (6 steps) ──
export const RAPIDA_STEPS: StepDef[] = [
  { id: 'tipo',       label: 'Tipo de Bem' },
  { id: 'credito',    label: 'Crédito e Prazo' },
  { id: 'taxas',      label: 'Taxa e Fundo' },
  { id: 'estrategia', label: 'Estratégia de Contemplação' },
  { id: 'projecao',   label: 'Projeção' },
  { id: 'resultado',  label: 'Resultado' },
];

// ── Simulação Detalhada (6 steps) ──
export const DETALHADA_STEPS: StepDef[] = [
  { id: 'd-tipo',       label: 'Tipo de Bem' },
  { id: 'd-admins',     label: 'Administradoras' },
  { id: 'd-config',     label: 'Dados por Administradora' },
  { id: 'd-estrategia', label: 'Estratégia de Contemplação' },
  { id: 'd-projecao',   label: 'Projeção' },
  { id: 'd-resultado',  label: 'Resultado' },
];
