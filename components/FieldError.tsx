import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="field-err" role="alert" aria-live="polite">
      <AlertCircle size={12} style={{ flexShrink: 0 }} />
      {msg}
    </div>
  );
}
