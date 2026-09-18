import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, icon: Icon, iconColor = 'text-indigo-600', iconBg = 'bg-indigo-50', change, changeType }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={cn('p-3 rounded-xl flex-shrink-0', iconBg)}>
        <Icon className={cn('w-6 h-6', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {change && (
          <p className={cn('text-xs mt-0.5', changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-500')}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
