import React from 'react';
import { type Estrategia, type LanceBase } from '../lib/config';
import { brl } from '../lib/calc';

interface LanceInputsProps {
  prefix: string;
  estrategia: Estrategia;
  lanceBase: LanceBase;
  onLanceBaseChange: (base: LanceBase) => void;
  credito: number;
  totalBruto: number;
  llPct: number; onLlPctChange: (v: number) => void;
  lePct: number; onLePctChange: (v: number) => void;
  leLLPct: number; onLeLLPctChange: (v: number) => void;
  lfEmbPct: number; onLfEmbPctChange: (v: number) => void;
  lfRPPct: number; onLfRPPctChange: (v: number) => void;
}

function hint(credito: number, pctVal: number): string {
  if (credito <= 0) return '';
  return `= ${brl(credito * pctVal / 100)} sobre o crédito`;
}

export default function LanceInputs(props: LanceInputsProps) {
  const { estrategia, lanceBase, onLanceBaseChange, credito, totalBruto } = props;

  const showLivre    = estrategia === 'lance_livre';
  const showEmbutido = estrategia === 'lance_livre_embutido';
  const showFixo     = estrategia === 'lance_fixo';
  const showBase     = estrategia !== 'sorteio';

  return (
    <>
      {showLivre && (
        <div className="fg">
          <label>% Lance Livre (recursos próprios)</label>
          <div className="input-wrap">
            <input
              type="number" min={0} max={100} step={1}
              value={props.llPct}
              onChange={e => props.onLlPctChange(parseInt(e.target.value) || 0)}
              placeholder="20"
            />
            <span className="input-suffix">%</span>
          </div>
          {credito > 0 && <div className="field-hint">= {brl(credito * props.llPct / 100)} sobre o crédito</div>}
        </div>
      )}

      {showEmbutido && (
        <div className="fg-row">
          <div className="fg">
            <label>% Lance Embutido</label>
            <div className="input-wrap">
              <input
                type="number" min={0} max={50} step={1}
                value={props.lePct}
                onChange={e => props.onLePctChange(parseInt(e.target.value) || 0)}
                placeholder="25"
              />
              <span className="input-suffix">%</span>
            </div>
            {credito > 0 && <div className="field-hint">= {brl(credito * props.lePct / 100)}</div>}
          </div>
          <div className="fg">
            <label>% Lance Livre</label>
            <div className="input-wrap">
              <input
                type="number" min={0} max={100} step={1}
                value={props.leLLPct}
                onChange={e => props.onLeLLPctChange(parseInt(e.target.value) || 0)}
                placeholder="10"
              />
              <span className="input-suffix">%</span>
            </div>
            {credito > 0 && <div className="field-hint">= {brl(credito * props.leLLPct / 100)}</div>}
          </div>
        </div>
      )}

      {showFixo && (
        <div className="fg-row">
          <div className="fg">
            <label>% Lance Embutido</label>
            <div className="input-wrap">
              <input
                type="number" min={0} max={50} step={1}
                value={props.lfEmbPct}
                onChange={e => props.onLfEmbPctChange(parseInt(e.target.value) || 0)}
                placeholder="25"
              />
              <span className="input-suffix">%</span>
            </div>
            {credito > 0 && <div className="field-hint">= {brl(credito * props.lfEmbPct / 100)}</div>}
          </div>
          <div className="fg">
            <label>% Recursos Próprios</label>
            <div className="input-wrap">
              <input
                type="number" min={0} max={100} step={1}
                value={props.lfRPPct}
                onChange={e => props.onLfRPPctChange(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <span className="input-suffix">%</span>
            </div>
            {credito > 0 && <div className="field-hint">= {brl(credito * props.lfRPPct / 100)}</div>}
          </div>
        </div>
      )}

      {showBase && (
        <div className="fg">
          <label>Base de Cálculo</label>
          <div className="btn-toggle">
            <button
              type="button"
              className={`btn-toggle__opt${lanceBase === 'credito' ? ' active' : ''}`}
              onClick={() => onLanceBaseChange('credito')}
            >
              Sobre o Crédito
            </button>
            <button
              type="button"
              className={`btn-toggle__opt${lanceBase === 'categoria' ? ' active' : ''}`}
              onClick={() => onLanceBaseChange('categoria')}
            >
              Lance Categoria
            </button>
          </div>
          {lanceBase === 'categoria' && totalBruto > 0 && (
            <div className="field-hint">Categoria = {brl(totalBruto)} (crédito + taxas)</div>
          )}
        </div>
      )}
    </>
  );
}
