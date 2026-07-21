// src/components/common/KPICard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

/**
 * KPI Card component
 * @param {string} label
 * @param {number} value
 * @param {string} format - 'currency' | 'number' | 'percent'
 * @param {ReactNode} icon
 * @param {string} iconBg - CSS background for icon wrapper
 * @param {string} iconColor - CSS color for icon
 * @param {number} trend - percentage change (optional)
 * @param {string} trendLabel
 * @param {string} accentColor - CSS color for top border
 */
export function KPICard({
  label,
  value = 0,
  format = 'currency',
  icon: Icon,
  iconBg = 'var(--brand-bg)',
  iconColor = 'var(--brand-500)',
  trend,
  trendLabel = 'vs last month',
  accentColor,
  subtitle,
  onClick,
}) {
  const displayValue = () => {
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percent') return `${(value || 0).toFixed(1)}%`;
    return new Intl.NumberFormat('en-IN').format(value || 0);
  };

  const trendDir = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div
      className="kpi-card fade-in"
      style={{ '--card-accent': accentColor, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {Icon && (
        <div className="kpi-icon" style={{ background: iconBg }}>
          <Icon size={20} color={iconColor} />
        </div>
      )}

      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{displayValue()}</div>

      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {subtitle}
        </div>
      )}

      {trend !== undefined && (
        <div className={`kpi-trend ${trendDir}`}>
          <TrendIcon size={12} />
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
