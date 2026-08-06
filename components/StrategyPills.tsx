import React from 'react';
import { Dices, Clock, TrendingUp, Bookmark } from 'lucide-react';
import { type Estrategia } from '../lib/config';

interface StrategyPillsProps {
  value: Estrategia;
  onChange: (s: Estrategia) => void;
}

const STRATEGIES: { id: Estrategia; icon: React.ReactNode; title: string; desc: string }[] = [
  { id: 'sorteio',              icon: <Dices      size={24} />, title: 'Sorteio',        desc: 'Contemplação via loteria' },
  { id: 'lance_livre',          icon: <Clock      size={24} />, title: 'Lance Livre',    desc: 'Oferta de maior percentual' },
  { id: 'lance_livre_embutido', icon: <TrendingUp size={24} />, title: 'Lance Embutido', desc: 'Usa parte do próprio crédito' },
  { id: 'lance_fixo',           icon: <Bookmark   size={24} />, title: 'Lance Fixo',     desc: 'Percentual predefinido' },
];

export default function StrategyPills({ value, onChange }: StrategyPillsProps) {
  return (
    <div className="fg">
      <label>Tipo de Lance</label>
      <div className="strategy-grid">
        {STRATEGIES.map(s => (
          <button
            key={s.id}
            type="button"
            className={`strat-card${value === s.id ? ' active' : ''}`}
            onClick={() => onChange(s.id)}
          >
            <span className="strat-card__icon">{s.icon}</span>
            <span className="strat-card__title">{s.title}</span>
            <span className="strat-card__desc">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
