import React, { forwardRef, useEffect, useId, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Loader2 } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------------------------------------------------------------- Button */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'sam' | 'danger' | 'success';
type BtnSize = 'sm' | 'md' | 'lg';

const btnBase =
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-[background,color,opacity,transform] duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-ink text-paper hover:opacity-90',
  secondary: 'bg-sheet text-ink border border-line hover:bg-sheet-2',
  ghost: 'text-ink-2 hover:text-ink hover:bg-sheet-2',
  sam: 'bg-adire text-on-adire hover:opacity-90',
  danger: 'text-laterite hover:bg-laterite-soft',
  success: 'bg-feuille text-white hover:opacity-90',
};
const btnSizes: Record<BtnSize, string> = {
  sm: 'h-8 px-3 text-[0.86rem] rounded-lg',
  md: 'h-10 px-4 text-[0.92rem] rounded-xl',
  lg: 'h-11 px-5 text-[0.95rem] rounded-xl',
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean; icon?: ReactNode }
>(({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }, ref) => (
  <button
    ref={ref}
    className={cx(btnBase, btnVariants[variant], btnSizes[size], className)}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
  </button>
));

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' | 'on-rail' }
> = ({ label, tone = 'default', className, children, ...rest }) => (
  <button
    aria-label={label}
    title={label}
    className={cx(
      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition active:scale-95',
      tone === 'danger' && 'text-ink-3 hover:text-laterite hover:bg-laterite-soft',
      tone === 'default' && 'text-ink-2 hover:text-ink hover:bg-sheet-2',
      tone === 'on-rail' && 'text-rail-ink hover:text-ink hover:bg-rail-2',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

/* ---------------------------------------------------------------- Surfaces */
export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement> & { tone?: 'sheet' | 'sam' | 'soleil' | 'plain' }> = ({
  tone = 'sheet',
  className,
  ...rest
}) => (
  <div
    className={cx(
      'rounded-[var(--radius-panel)]',
      tone === 'sheet' && 'bg-sheet border border-line',
      tone === 'sam' && 'bg-adire-soft/70',
      tone === 'soleil' && 'bg-soleil-soft',
      className,
    )}
    {...rest}
  />
);

export const PageHeader: React.FC<{ title: string; description?: ReactNode; actions?: ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <header className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
    <div className="max-w-2xl">
      <h1 className="text-[1.45rem] leading-tight font-semibold tracking-[-0.015em] text-ink md:text-[1.7rem]">
        {title}
      </h1>
      {description && <p className="mt-1.5 text-[0.95rem] text-ink-2">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export const SectionTitle: React.FC<{ children: ReactNode; action?: ReactNode; className?: string }> = ({
  children,
  action,
  className,
}) => (
  <div className={cx('mb-3 flex items-center justify-between gap-3', className)}>
    <h2 className="text-[0.98rem] font-semibold text-ink">{children}</h2>
    {action}
  </div>
);

/* ---------------------------------------------------------------- Badges */
export type Tone = 'neutral' | 'adire' | 'laterite' | 'soleil' | 'feuille';
const toneCls: Record<Tone, string> = {
  neutral: 'bg-sheet-2 text-ink-2',
  adire: 'bg-adire-soft text-adire',
  laterite: 'bg-laterite-soft text-laterite',
  soleil: 'bg-soleil-soft text-[color-mix(in_oklab,var(--color-soleil)_45%,var(--color-ink))]',
  feuille: 'bg-feuille-soft text-feuille',
};
export const Badge: React.FC<{ tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }> = ({
  tone = 'neutral',
  children,
  className,
  icon,
}) => (
  <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.76rem] font-medium', toneCls[tone], className)}>
    {icon}
    {children}
  </span>
);

/* ---------------------------------------------------------------- Segmented control (pilule animée) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cx('scrollbar-none inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl bg-sheet-2 p-1', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative shrink-0 rounded-lg font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-[0.82rem]' : 'px-3.5 py-1.5 text-[0.88rem]',
              active ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-sheet shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && <span className="text-ink-3 tabular-nums">{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Formulaires */
export const Field: React.FC<{ label: string; hint?: string; children: ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className,
}) => (
  <label className={cx('block', className)}>
    <span className="mb-1.5 block text-[0.86rem] font-medium text-ink-2">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[0.8rem] text-ink-3">{hint}</span>}
  </label>
);

const inputCls =
  'w-full rounded-xl border border-line bg-sheet px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-3 transition focus:border-ink-3 focus:outline-none';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cx(inputCls, className)} {...p} />
));
export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cx(inputCls, 'leading-relaxed', className)} {...p} />,
);
export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, ...p }) => (
  <select className={cx(inputCls, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239a9caa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
    {...p}
  />
);

/* ---------------------------------------------------------------- Le sceau de SAM : un petit soleil */
export const SamMark: React.FC<{ size?: number; thinking?: boolean; className?: string }> = ({
  size = 32,
  thinking,
  className,
}) => {
  const reduce = useReducedMotion();
  return (
    <span
      className={cx('relative inline-flex shrink-0 items-center justify-center rounded-full bg-sheet-2', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size * 0.78} height={size * 0.78}>
        <motion.g
          animate={thinking && !reduce ? { rotate: 360 } : { rotate: 0 }}
          transition={thinking ? { repeat: Infinity, duration: 5, ease: 'linear' } : { duration: 0.4 }}
          style={{ originX: '20px', originY: '20px' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.line
              key={i}
              x1="20" y1="6" x2="20" y2="9.5"
              stroke="var(--color-soleil)" strokeWidth="2.4" strokeLinecap="round"
              transform={`rotate(${i * 45} 20 20)`}
              animate={thinking && !reduce ? { opacity: [0.25, 1, 0.25] } : { opacity: 1 }}
              transition={thinking ? { repeat: Infinity, duration: 1.2, delay: i * 0.1 } : undefined}
            />
          ))}
        </motion.g>
        <circle cx="20" cy="20" r="7" fill="var(--color-soleil)" />
      </svg>
    </span>
  );
};

/* ---------------------------------------------------------------- Markdown */
export const Markdown: React.FC<{ children: string; className?: string }> = ({ children, className }) => (
  <div className={cx('prose-sam', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ a: ({ node, ...p }) => <a {...p} target="_blank" rel="noreferrer" /> }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

/* ---------------------------------------------------------------- Sheet / Dialog responsive */
export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg';
}> = ({ open, onClose, title, description, children, footer, width = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cx(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] border border-line bg-sheet shadow-2xl md:rounded-[20px]',
              width === 'md' ? 'md:max-w-xl' : 'md:max-w-3xl',
            )}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line md:hidden" />
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-2 md:px-7 md:pt-6">
                <div>
                  {title && <h2 className="text-[1.1rem] font-semibold">{title}</h2>}
                  {description && <p className="mt-1 text-[0.92rem] text-ink-2">{description}</p>}
                </div>
                <IconButton label="Fermer" onClick={onClose} className="-mt-1 -mr-2">
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-3 md:px-7">{children}</div>
            {footer && (
              <div className="pb-safe px-5 py-3 md:px-7 md:pb-6">
                <div className="flex flex-wrap justify-end gap-2">{footer}</div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ---------------------------------------------------------------- État vide */
export const Empty: React.FC<{ title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode }> = ({
  title,
  body,
  action,
  icon,
}) => (
  <div className="flex flex-col items-center rounded-[var(--radius-panel)] bg-sheet-2/60 px-6 py-12 text-center">
    {icon && <div className="mb-3 text-ink-3">{icon}</div>}
    <p className="font-semibold text-ink">{title}</p>
    {body && <p className="mt-1 max-w-sm text-sm text-ink-2">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ---------------------------------------------------------------- Chargement IA */
export const Thinking: React.FC<{ label: string; detail?: string }> = ({ label, detail }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 py-2"
  >
    <SamMark size={28} thinking />
    <div>
      <p className="text-[0.95rem] font-medium text-ink">{label}</p>
      {detail && <p className="text-sm text-ink-3">{detail}</p>}
    </div>
  </motion.div>
);

/* ---------------------------------------------------------------- Barre de progression */
export const Progress: React.FC<{ value: number; tone?: 'soleil' | 'feuille' | 'adire'; className?: string }> = ({
  value,
  tone = 'soleil',
  className,
}) => (
  <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-sheet-2', className)}>
    <motion.div
      className={cx('h-full rounded-full', tone === 'soleil' && 'bg-soleil', tone === 'feuille' && 'bg-feuille', tone === 'adire' && 'bg-adire')}
      initial={{ width: 0 }}
      animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  </div>
);
