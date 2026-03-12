interface BadgeProps {
  variant: 'yes' | 'no' | 'maybe' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  yes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  no: 'bg-red-100 text-red-800 border-red-200',
  maybe: 'bg-amber-100 text-amber-800 border-amber-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
        border uppercase tracking-wide
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
