import type { CSSProperties, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

/**
 * CosmicField — a label + input/textarea. Transparent fill, a bottom filament
 * border that warms on focus, a mono uppercase label. The input idiom for the
 * form-heavy rooms (Compose, Settings, auth).
 */
export function CosmicField({
  label,
  multiline = false,
  className = '',
  style,
  ...rest
}: {
  label?: string;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={className} style={{ display: 'block', ...style }}>
      {label && <span className="cosmic-field-label">{label}</span>}
      {multiline ? (
        <textarea
          className="cosmic-field-input"
          style={{ resize: 'vertical', minHeight: 120, lineHeight: 1.6 }}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input className="cosmic-field-input" {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </label>
  );
}
