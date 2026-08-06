import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock } from 'lucide-react';
import {
  type Config, type Admin, type Estrategia,
  MODAL_LABELS, saveConfigToStorage,
} from '../lib/config';

interface ConfigPanelProps {
  config: Config;
  onSave: (cfg: Config) => void;
  onClose: () => void;
}

const EASE = [0.4, 0, 0.2, 1] as const;
const ESTRATEGIAS: Estrategia[] = ['sorteio', 'lance_livre', 'lance_livre_embutido', 'lance_fixo'];

export default function ConfigPanel({ config, onSave, onClose }: ConfigPanelProps) {
  const [locked, setLocked]     = useState(true);
  const [pw, setPw]             = useState('');
  const [pwError, setPwError]   = useState(false);
  const [draft, setDraft]       = useState<Config>(() => JSON.parse(JSON.stringify(config)));
  const [saved, setSaved]       = useState(false);
  const [novaSenha, setNovaSenha] = useState('');

  function handleCheckPW() {
    if (pw === config.senha) {
      setLocked(false);
      setPwError(false);
      setPw('');
    } else {
      setPwError(true);
      setPw('');
    }
  }

  function updateAdmin(i: number, partial: Partial<Admin>) {
    setDraft(d => {
      const admins = d.admins.map((a, idx) => idx === i ? { ...a, ...partial } : a);
      return { ...d, admins };
    });
  }

  function toggleMod(i: number, mod: Estrategia, checked: boolean) {
    setDraft(d => {
      const admins = d.admins.map((a, idx) => {
        if (idx !== i) return a;
        const modalidades = checked
          ? [...a.modalidades, mod]
          : a.modalidades.filter(m => m !== mod);
        return { ...a, modalidades };
      });
      return { ...d, admins };
    });
  }

  function handleSave() {
    const cfg = { ...draft };
    if (novaSenha.trim()) cfg.senha = novaSenha.trim();
    saveConfigToStorage(cfg);
    onSave(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <motion.div
      className="screen-content"
      style={{ position: 'absolute', inset: 0, background: 'var(--c-surface)', zIndex: 10 }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {/* Header */}
      <div className="step-top" style={{ justifyContent: 'space-between' }}>
        <button className="back-arrow" onClick={onClose} aria-label="Fechar">
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>Configurações</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="step-body">
        <div className="step-inner" style={{ gap: 24 }}>

          {/* ── Lock screen ── */}
          {locked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, paddingTop: 24 }}>
              <Lock size={40} style={{ color: 'var(--c-muted)' }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Área restrita</p>
                <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>Insira a senha de gestão para continuar.</p>
              </div>
              <div className="fg" style={{ width: '100%' }}>
                <input
                  type="password"
                  placeholder="Senha de gestão"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setPwError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleCheckPW()}
                  aria-invalid={pwError}
                  style={{ borderColor: pwError ? '#ef4444' : undefined }}
                />
                {pwError && <span className="field-err">Senha incorreta.</span>}
              </div>
              <button className="btn btn-gold btn-full" style={{ height: 'var(--h-btn)', fontSize: 15, fontWeight: 600 }} onClick={handleCheckPW}>Acessar</button>
            </div>
          ) : (

            /* ── Config form ── */
            <>
              {/* Consultores */}
              <div className="fg">
                <label>Consultores <span className="field-optional">(um por linha)</span></label>
                <textarea
                  rows={5}
                  style={{ height: 'auto', padding: '10px 16px', resize: 'vertical' }}
                  value={draft.consultores.join('\n')}
                  onChange={e => setDraft(d => ({ ...d, consultores: e.target.value.split('\n') }))}
                />
              </div>

              {/* Contato */}
              <div className="fg">
                <label>Contato <span className="field-optional">(para o PDF)</span></label>
                <textarea
                  rows={3}
                  style={{ height: 'auto', padding: '10px 16px', resize: 'vertical' }}
                  value={draft.contato}
                  onChange={e => setDraft(d => ({ ...d, contato: e.target.value }))}
                />
              </div>

              {/* Admins */}
              <div className="fg">
                <label>Administradoras</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {draft.admins.map((admin, i) => (
                    <div key={admin.id} className="admin-prop-block">
                      <div className="admin-prop-block__title">{admin.nome}</div>

                      <div className="fg-row">
                        <div className="fg">
                          <label>Taxa Imóvel (%)</label>
                          <div className="input-wrap">
                            <input
                              type="number" step="0.1"
                              value={admin.taxaImovel}
                              onChange={e => updateAdmin(i, { taxaImovel: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="input-suffix">%</span>
                          </div>
                        </div>
                        <div className="fg">
                          <label>Taxa Veículo (%)</label>
                          <div className="input-wrap">
                            <input
                              type="number" step="0.1"
                              value={admin.taxaVeiculo}
                              onChange={e => updateAdmin(i, { taxaVeiculo: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="input-suffix">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="fg">
                        <label>Lance Fixo (%) <span className="field-optional">vazio = não oferece</span></label>
                        <div className="input-wrap">
                          <input
                            type="number" step="1"
                            placeholder="—"
                            value={admin.lanceFixoPct ?? ''}
                            onChange={e => updateAdmin(i, { lanceFixoPct: e.target.value ? parseInt(e.target.value) : null })}
                          />
                          <span className="input-suffix">%</span>
                        </div>
                      </div>

                      <div className="fg">
                        <label>Modalidades</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 4 }}>
                          {ESTRATEGIAS.map(mod => (
                            <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 400, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={admin.modalidades.includes(mod)}
                                onChange={e => toggleMod(i, mod, e.target.checked)}
                              />
                              {MODAL_LABELS[mod]}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nova senha */}
              <div className="fg">
                <label>Nova senha <span className="field-optional">vazio = manter atual</span></label>
                <input
                  type="password"
                  placeholder="Nova senha..."
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                />
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-gold" onClick={handleSave}>
                  {saved ? 'Salvo!' : 'Salvar'}
                </button>
                <button className="btn btn-outline" onClick={() => { setLocked(true); setNovaSenha(''); }}>
                  Bloquear
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
