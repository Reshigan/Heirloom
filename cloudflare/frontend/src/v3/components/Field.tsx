import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

const baseLabel = 'block font-v3mono text-[0.6875rem] tracking-[0.28em] uppercase text-char mb-2';
const baseInput = 'w-full bg-transparent border-0 border-b border-edge focus:border-ink focus:outline-none text-ink font-news text-[1.0625rem] py-2 px-0 placeholder:text-char/50 transition-colors';

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={baseLabel}>{label}</label>
      {children}
      {hint ? <p className="font-news italic text-[0.875rem] text-char mt-2">{hint}</p> : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${baseInput} resize-y leading-[1.65] py-3 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={`${baseInput} cursor-pointer appearance-none ${props.className ?? ''}`}
      style={{
        backgroundImage:
          'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
        backgroundPosition: 'calc(100% - 14px) center, calc(100% - 8px) center',
        backgroundSize: '6px 6px, 6px 6px',
        backgroundRepeat: 'no-repeat',
        ...props.style,
      }}
    >
      {props.children}
    </select>
  );
}
