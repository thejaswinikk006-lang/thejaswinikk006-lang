import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

const ICONS = {
  warning: AlertTriangle,
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
};

export default function AlertBanner({ variant = 'info', title, children }) {
  const Icon = ICONS[variant] || Info;

  return (
    <div className={`alert alert-${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-body">{children}</div>
      </div>
    </div>
  );
}
