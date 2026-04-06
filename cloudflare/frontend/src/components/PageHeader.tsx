import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from './Icons';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, backTo = '/dashboard', backLabel = 'Back to Vault', actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-2 text-paper/65 hover:text-gold transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-light">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
