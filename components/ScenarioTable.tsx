import React from 'react';
import { brl, type ScenarioResult } from '../lib/calc';

interface ScenarioTableProps {
  scenarios: ScenarioResult[];
  adminName?: string;
}

export default function ScenarioTable({ scenarios, adminName }: ScenarioTableProps) {
  return (
    <div className="scenario-wrap">
      {adminName && <div className="scenario-admin">{adminName}</div>}
      <table className="scenario-table">
        <thead>
          <tr>
            <th>Cenário</th>
            <th>Referência</th>
            <th>Saldo Devedor</th>
            <th>Prazo Rest.</th>
            <th>Parcela Pós</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s, i) =>
            s.na ? (
              <tr key={i}>
                <td><strong>{s.label}</strong></td>
                <td colSpan={4} className="scenario-na">Prazo insuficiente</td>
              </tr>
            ) : (
              <tr key={i}>
                <td><strong>{s.label}</strong></td>
                <td className="scenario-muted">Mês {s.ref}</td>
                <td>{brl(s.saldo!)}</td>
                <td>{s.prazoRest} meses</td>
                <td className="scenario-parcela">{brl(s.parcelaPos!)}/mês</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
