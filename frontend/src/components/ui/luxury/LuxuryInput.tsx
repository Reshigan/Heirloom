'use client';

interface LuxuryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function LuxuryInput({ label, className = '', ...props }: LuxuryInputProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] tracking-[0.2em] uppercase text-gold-400/50 mb-3">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full px-5 py-4 rounded-xl
          bg-obsidian-900/60 border border-gold-500/20
          text-pearl placeholder-gold-400/30
          focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10
          transition-all duration-300
          ${className}
        `}
      />
    </div>
  );
}

interface LuxuryTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function LuxuryTextarea({ label, className = '', ...props }: LuxuryTextareaProps) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] tracking-[0.2em] uppercase text-gold-400/50 mb-3">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`
          w-full px-5 py-4 rounded-xl resize-none
          bg-obsidian-900/60 border border-gold-500/20
          text-pearl placeholder-gold-400/30
          focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10
          transition-all duration-300
          ${className}
        `}
      />
    </div>
  );
}
