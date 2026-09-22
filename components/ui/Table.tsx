import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">{children}</thead>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left font-medium', className)}>{children}</th>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>;
}

export function Tr({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={cn('hover:bg-gray-50 transition-colors', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn('px-4 py-3 text-gray-700', className)}>{children}</td>;
}
