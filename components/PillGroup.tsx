import React from 'react';
import { Home, Car } from 'lucide-react';
import { type TipoBem } from '../lib/config';

interface PillGroupProps {
  value: TipoBem;
  onChange: (tipo: TipoBem) => void;
}

const ITEMS = [
  { id: 'imovel'  as TipoBem, icon: <Home size={28} />,  title: 'Imóvel',  desc: 'Residencial ou comercial' },
  { id: 'veiculo' as TipoBem, icon: <Car  size={28} />, title: 'Veículo', desc: 'Leve ou pesado' },
];

export default function PillGroup({ value, onChange }: PillGroupProps) {
  return (
    <div className="sel-cards-row">
      {ITEMS.map(item => (
        <button
          key={item.id}
          type="button"
          className={`sel-card${value === item.id ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          <span className="sel-card__icon">{item.icon}</span>
          <span className="sel-card__title">{item.title}</span>
          <span className="sel-card__desc">{item.desc}</span>
        </button>
      ))}
    </div>
  );
}
