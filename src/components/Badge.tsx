import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'orange' | 'purple';
  size?: 'sm' | 'md';
}

const variantClasses = {
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium border rounded',
        size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        variantClasses[variant]
      )}
    >
      {children}
    </span>
  );
}

export function QualityBadge({ level }: { level: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    A: { variant: 'green', label: 'A级 优选' },
    B: { variant: 'blue', label: 'B级 备选' },
    C: { variant: 'yellow', label: 'C级 限制' },
    D: { variant: 'red', label: 'D级 禁用' },
  };
  const cfg = map[level] || { variant: 'gray', label: level };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active: { variant: 'green', label: '在用' },
    pending: { variant: 'yellow', label: '待审' },
    deprecated: { variant: 'red', label: '停用' },
    review: { variant: 'orange', label: '审核中' },
    approved: { variant: 'green', label: '已通过' },
    rejected: { variant: 'red', label: '已驳回' },
    reviewing: { variant: 'purple', label: '审核中' },
    open: { variant: 'yellow', label: '待处理' },
    processing: { variant: 'blue', label: '处理中' },
    resolved: { variant: 'green', label: '已解决' },
  };
  const cfg = map[status] || { variant: 'gray', label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
