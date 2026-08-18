import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Card({ children, className, onClick, style }: CardProps) {
  return (
    <div className={cn('card p-6', className)} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-h3 text-neutral-900 dark:text-neutral-50', className)}>{children}</h3>;
}
