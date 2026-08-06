import React from 'react';
import { brl, pct, type LanceResult } from '../lib/calc';
import { type Estrategia } from '../lib/config';

interface LanceCardProps {
  estrategia: Estrategia;
  credito: number;
  lance: LanceResult;
}

export default function LanceCard({ estrategia, credito, lance }: LanceCardProps) {
  if (estrategia === 'sorteio') return null;

  return (
    <div className="lance-card">
      <div className="lance-card__title">Análise do Lance</div>
      <div className="lance-card__rows">
        <div className="lance-row">
          <span>Crédito Contratado</span>
          <span>{brl(credito)}</span>
        </div>
        {lance.lanceBase === 'categoria' && (
          <div className="lance-row lance-row--gold">
            <span>Base: Lance Categoria</span>
            <span>{brl(lance.base)}</span>
          </div>
        )}
        {estrategia === 'lance_livre' && (
          <div className="lance-row">
            <span>Lance Livre (recursos próprios)</span>
            <span>− {brl(lance.lanceLivre)} ({pct(lance.lanceLivre / credito * 100)})</span>
          </div>
        )}
        {estrategia === 'lance_livre_embutido' && (
          <>
            <div className="lance-row">
              <span>Lance Embutido (do crédito)</span>
              <span>− {brl(lance.lanceEmbutido)}</span>
            </div>
            {lance.lanceLivre > 0 && (
              <div className="lance-row">
                <span>Lance Livre (recursos próprios)</span>
                <span>− {brl(lance.lanceLivre)}</span>
              </div>
            )}
            <div className="lance-row lance-row--total">
              <span>Total do Lance</span>
              <span>{brl(lance.totalLance)} ({pct(lance.totalLancePct)})</span>
            </div>
            <div className="lance-row">
              <span>Crédito Líquido Recebido</span>
              <span>{brl(lance.creditoLiquido)}</span>
            </div>
          </>
        )}
        {estrategia === 'lance_fixo' && (
          <>
            {lance.lanceEmbutido > 0 && (
              <div className="lance-row">
                <span>Lance Embutido (do crédito)</span>
                <span>− {brl(lance.lanceEmbutido)}</span>
              </div>
            )}
            {lance.lanceLivre > 0 && (
              <div className="lance-row">
                <span>Recursos Próprios</span>
                <span>− {brl(lance.lanceLivre)}</span>
              </div>
            )}
            <div className="lance-row lance-row--total">
              <span>Total do Lance</span>
              <span>{brl(lance.totalLance)} ({pct(lance.totalLancePct)})</span>
            </div>
            {lance.lanceEmbutido > 0 && (
              <div className="lance-row">
                <span>Crédito Líquido Recebido</span>
                <span>{brl(lance.creditoLiquido)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
