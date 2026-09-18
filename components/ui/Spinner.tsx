import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );
}
