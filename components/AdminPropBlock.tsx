import React from 'react';
import { type Admin, type TipoBem } from '../lib/config';
import { formatMoney } from '../lib/calc';

interface AdminPropBlockProps {
  admin: Admin;
  tipoBem: TipoBem;
  credito: string;
  prazo: string;
  taxa: number;
  fundo: number;
  onCreditoChange: (v: string) => void;
  onPrazoChange: (v: string) => void;
  onTaxaChange: (v: number) => void;
  onFundoChange: (v: number) => void;
}

export default function AdminPropBlock({
  admin, tipoBem, credito, prazo, taxa, fundo,
  onCreditoChange, onPrazoChange, onTaxaChange, onFundoChange,
}: AdminPropBlockProps) {
  const isImovel = tipoBem === 'imovel';
  const przMin = isImovel ? 100 : 30;
  const przMax = isImovel ? 240 : 120;

  return (
    <div className="admin-prop-block">
      <div className="admin-prop-block__title">Proposta — {admin.nome}</div>
      <div className="fg-row">
        <div className="fg">
          <label>Valor do Crédito</label>
          <input
            type="text" inputMode="numeric"
            placeholder="Ex: R$ 300.000"
            value={credito}
            onChange={e => onCreditoChange(formatMoney(e.target.value))}
          />
        </div>
        <div className="fg">
          <label>Prazo (meses)</label>
          <input
            type="number" min={przMin} max={przMax}
            placeholder={isImovel ? '180' : '72'}
            value={prazo}
            onChange={e => onPrazoChange(e.target.value)}
          />
          <div className="field-hint">{isImovel ? '100–240 meses' : '30–120 meses'}</div>
        </div>
      </div>
      <div className="fg-row">
        <div className="fg">
          <label>Taxa de Adm. (%)</label>
          <div className="input-wrap">
            <input
              type="number" min={0} max={40} step={0.01}
              value={taxa}
              onChange={e => onTaxaChange(parseFloat(e.target.value) || 0)}
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="fg">
          <label>Fundo de Reserva (%)</label>
          <div className="input-wrap">
            <input
              type="number" min={0} max={10} step={0.01}
              value={fundo}
              onChange={e => onFundoChange(parseFloat(e.target.value) || 0)}
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
