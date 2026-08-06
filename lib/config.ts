// ═══ TYPES ══════════════════════════════════════════════════════
export interface TaxaFaixa {
  label: string;
  prazoMin: number;
  prazoMax: number;
  admin: number;
  fundo: number;
}

export type TipoBem = 'imovel' | 'veiculo';
export type Estrategia = 'sorteio' | 'lance_livre' | 'lance_livre_embutido' | 'lance_fixo';
export type LanceBase = 'credito' | 'categoria';

export interface Admin {
  id: string;
  nome: string;
  tipos: TipoBem[];
  modalidades: Estrategia[];
  lanceFixoPct: number | null;
  taxaImovel: number;
  fundoImovel: number;
  taxaVeiculo: number;
  fundoVeiculo: number;
  prazosImovel: number[];
  prazosVeiculo: number[];
  destaque: string;
}

export interface Config {
  senha: string;
  contato: string;
  consultores: string[];
  taxas: {
    imovel: TaxaFaixa[];
    prazos_imovel: number[];
    veiculo: TaxaFaixa[];
    prazos_veiculo: number[];
  };
  admins: Admin[];
}

export interface Scenario {
  label: string;
  ref: number;
}

export interface ConsultorContato {
  tel: string;
  email: string;
}

// ═══ CONSTANTS ══════════════════════════════════════════════════

export const MODAL_LABELS: Record<Estrategia, string> = {
  sorteio: 'Sorteio',
  lance_livre: 'Lance Livre',
  lance_livre_embutido: 'Lance Livre + Embutido',
  lance_fixo: 'Lance Fixo',
};

export const SCENARIOS: Scenario[] = [
  { label: '1 a 12 meses',  ref: 6  },
  { label: '13 a 24 meses', ref: 18 },
  { label: '25 a 36 meses', ref: 30 },
  { label: '37 a 48 meses', ref: 42 },
  { label: '49 a 60 meses', ref: 55 },
];

export const CONSULTOR_CONTATOS: Record<string, ConsultorContato> = {
  'Gabriel Lopes':   { tel: '(11) 97132-3969', email: 'gabriel@directcon.com.br' },
  'Victor Tessaro':  { tel: '(41) 98805-8204', email: 'victor.tessaro@directcon.com.br' },
  'Luan Geffer':     { tel: '(41) 99989-7078', email: 'luan.geffer@directcon.com.br' },
  'Bruno Vieira':    { tel: '(41) 99759-7181', email: 'bruno.vieira@directcon.com.br' },
  'Pablo Camparim':  { tel: '(41) 99827-2178', email: 'pablo.camparim@directcon.com.br' },
  'Shaquille Oniel': { tel: '(41) 99686-0394', email: 'shaquille.oniel@directcon.com.br' },
  'Luis Fellipe':    { tel: '(41) 99969-8527', email: 'luis@directcon.com.br' },
};

export const TAXA_RANGES: Record<TipoBem, { min: number; max: number; default: number }> = {
  imovel:  { min: 9, max: 30, default: 18 },
  veiculo: { min: 9, max: 30, default: 14 },
};

export const PRAZO_RANGES: Record<TipoBem, { min: number; max: number; placeholder: string; label: string }> = {
  imovel:  { min: 100, max: 240, placeholder: 'ex: 180', label: 'Imóvel: 100–240 meses' },
  veiculo: { min: 30,  max: 120, placeholder: 'ex: 72',  label: 'Veículo: 30–120 meses' },
};

export const FUNDO_DEFAULTS: Record<TipoBem, number> = {
  imovel: 2,
  veiculo: 1.5,
};

export const CREDITO_RANGES: Record<TipoBem, { min: number; max: number; step: number; default: number }> = {
  imovel:  { min: 50000, max: 1500000, step: 10000, default: 350000 },
  veiculo: { min: 40000, max: 400000,  step: 5000,  default: 100000 },
};

// ═══ DEFAULT CONFIG ═════════════════════════════════════════════

export const DEFAULT_CONFIG: Config = {
  senha: 'DirectCon2025',
  contato: '(11) 9999-0000\ncontato@directcon.com.br\nwww.directcon.com.br',
  consultores: ['Victor Tessaro','Luan Geffer','Luis Fellipe','Gabriel Lopes','Pablo Camparim','Bruno Vieira'],
  taxas: {
    imovel: [
      { label: '200–240 meses', prazoMin: 200, prazoMax: 240, admin: 22,   fundo: 2   },
      { label: '150–199 meses', prazoMin: 150, prazoMax: 199, admin: 18.5, fundo: 2   },
      { label: '120–149 meses', prazoMin: 120, prazoMax: 149, admin: 17,   fundo: 2   },
      { label: '60–119 meses',  prazoMin: 60,  prazoMax: 119, admin: 16,   fundo: 2   },
    ],
    prazos_imovel: [60, 80, 100, 120, 150, 180, 200, 220, 240],
    veiculo: [
      { label: '72–100 meses', prazoMin: 72, prazoMax: 100, admin: 17,  fundo: 1.5 },
      { label: '48–71 meses',  prazoMin: 48, prazoMax: 71,  admin: 14,  fundo: 1.5 },
      { label: '24–47 meses',  prazoMin: 24, prazoMax: 47,  admin: 12,  fundo: 1.5 },
    ],
    prazos_veiculo: [24, 36, 48, 60, 72, 84, 100],
  },
  admins: [
    { id: 'servopa',   nome: 'Servopa',        tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido'],                lanceFixoPct: null, taxaImovel: 21,   fundoImovel: 2, taxaVeiculo: 16,   fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Forte presença no Sul/Sudeste' },
    { id: 'santander', nome: 'Santander',       tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido','lance_fixo'],   lanceFixoPct: 25,   taxaImovel: 22,   fundoImovel: 2, taxaVeiculo: 17,   fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Lance Fixo 25% · Ampla rede' },
    { id: 'itau',      nome: 'Itaú',            tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido'],                lanceFixoPct: null, taxaImovel: 21.5, fundoImovel: 2, taxaVeiculo: 16.5, fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Solidez e tradição' },
    { id: 'cnp',       nome: 'CNP',             tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido'],                lanceFixoPct: null, taxaImovel: 20,   fundoImovel: 2, taxaVeiculo: 15,   fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Taxas competitivas' },
    { id: 'bb',        nome: 'Banco do Brasil',  tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido','lance_fixo'],   lanceFixoPct: 30,   taxaImovel: 22,   fundoImovel: 2, taxaVeiculo: 17,   fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Lance Fixo 30% · Maior rede' },
    { id: 'porto',     nome: 'Porto Seguro',     tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido'],                lanceFixoPct: null, taxaImovel: 20.5, fundoImovel: 2, taxaVeiculo: 15.5, fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Excelente custo-benefício' },
    { id: 'mycon',     nome: 'Mycon',            tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido'],                lanceFixoPct: null, taxaImovel: 19,   fundoImovel: 2, taxaVeiculo: 14,   fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: '100% digital · Taxas baixas' },
    { id: 'ancora',    nome: 'Âncora',           tipos: ['imovel','veiculo'], modalidades: ['sorteio','lance_livre','lance_livre_embutido'],                lanceFixoPct: null, taxaImovel: 20,   fundoImovel: 2, taxaVeiculo: 15,   fundoVeiculo: 1.5, prazosImovel: [60,80,100,120,150,180,200,220,240], prazosVeiculo: [24,36,48,60,72,84,100], destaque: 'Especialista em lance' },
  ],
};

// ═══ LOAD / SAVE CONFIG ═════════════════════════════════════════

const STORAGE_KEY = 'dc_cfg3';

export function loadConfig(): Config {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s) as Config;
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function saveConfigToStorage(cfg: Config): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}
