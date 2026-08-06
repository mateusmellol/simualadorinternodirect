import React from 'react';
import { type Admin, type Estrategia, type TipoBem, MODAL_LABELS } from '../lib/config';

interface AdminSelectorProps {
  admins: Admin[];
  selectedIds: string[];
  tipoBem: TipoBem;
  estrategia: Estrategia;
  onToggle: (id: string) => void;
}

export default function AdminSelector({ admins, selectedIds, tipoBem, estrategia, onToggle }: AdminSelectorProps) {
  const visiveis = admins.filter(a => a.tipos.includes(tipoBem) && a.modalidades.includes(estrategia));

  return (
    <div className="fg">
      <label>Selecione as Administradoras</label>
      <div className="admin-grid">
        {visiveis.map(admin => {
          const isSelected = selectedIds.includes(admin.id);
          return (
            <div
              key={admin.id}
              className={`admin-card${isSelected ? ' active' : ''}`}
              onClick={() => onToggle(admin.id)}
            >
              <div className="admin-card__check">{isSelected ? '✓' : ''}</div>
              <div className="admin-card__name">{admin.nome}</div>
              <div className="admin-card__chips">
                {admin.modalidades.map(m => (
                  <span key={m} className={`chip${m !== 'sorteio' ? ' chip--gold' : ''}`}>
                    {MODAL_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
