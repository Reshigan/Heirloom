import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // ponytail: resolve theme from the same source LoomShellRoot uses (localStorage "heirloom-theme"),
      // fail-closed to the app default 'light', so the .loom wrapper remaps tokens for the error screen.
      let resolved: 'light' | 'dark' = 'light';
      try {
        const saved = localStorage.getItem('heirloom-theme');
        if (saved === 'dark') resolved = 'dark';
        else if (saved === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) resolved = 'dark';
      } catch {
        /* ignore — keep light default */
      }

      return (
        <div className="loom" data-theme={resolved} style={{ minHeight: '100dvh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)', display: 'block', marginBottom: 20 }}>
              something went wrong
            </span>
            <h1 className="hl-serif" style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 300, color: 'var(--bone)', marginBottom: 16, lineHeight: 1.2 }}>
              An unexpected error occurred.
            </h1>
            <p className="hl-prose" style={{ fontSize: 15, color: 'var(--bone-dim)', marginBottom: 32, lineHeight: 1.7 }}>
              The error has been logged. Try reloading — if it persists, your data is safe.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button onClick={() => window.location.reload()} className="hl-btn" style={{ cursor: 'pointer' }}>
                reload →
              </button>
              <a href="/" className="hl-btn text" style={{ textDecoration: 'none' }}>
                go home
              </a>
            </div>
            {this.state.error && (
              <details style={{ marginTop: 32, borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
                <summary className="hl-mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)', cursor: 'pointer' }}>
                  error detail
                </summary>
                <pre className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
