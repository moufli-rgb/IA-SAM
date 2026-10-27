import React, { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button, Field, Input, Sheet, TextArea } from '../components/ui';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; text: string; kind: ToastKind };

type AskOptions = { title: string; description?: string; label?: string; defaultValue?: string; multiline?: boolean; confirmLabel?: string };
type ConfirmOptions = { title: string; description?: string; confirmLabel?: string; danger?: boolean };

interface UiCtx {
  toast: (text: string, kind?: ToastKind) => void;
  ask: (o: AskOptions) => Promise<string | null>;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
}
const Ctx = createContext<UiCtx | null>(null);

export const UiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [askState, setAskState] = useState<(AskOptions & { value: string }) | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: any) => void) | null>(null);

  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const ask = useCallback((o: AskOptions) => {
    setAskState({ ...o, value: o.defaultValue || '' });
    return new Promise<string | null>((r) => (resolver.current = r));
  }, []);
  const confirm = useCallback((o: ConfirmOptions) => {
    setConfirmState(o);
    return new Promise<boolean>((r) => (resolver.current = r));
  }, []);

  const closeAsk = (v: string | null) => {
    resolver.current?.(v);
    setAskState(null);
  };
  const closeConfirm = (v: boolean) => {
    resolver.current?.(v);
    setConfirmState(null);
  };

  return (
    <Ctx.Provider value={{ toast, ask, confirm }}>
      {children}

      <Sheet
        open={!!askState}
        onClose={() => closeAsk(null)}
        title={askState?.title}
        description={askState?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => closeAsk(null)}>Annuler</Button>
            <Button variant="primary" disabled={!askState?.value.trim()} onClick={() => closeAsk(askState!.value.trim())}>
              {askState?.confirmLabel || 'Enregistrer'}
            </Button>
          </>
        }
      >
        {askState && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (askState.value.trim()) closeAsk(askState.value.trim());
            }}
            className="pb-2"
          >
            <Field label={askState.label || 'Texte'}>
              {askState.multiline ? (
                <TextArea autoFocus rows={6} value={askState.value} onChange={(e) => setAskState({ ...askState, value: e.target.value })} />
              ) : (
                <Input autoFocus value={askState.value} onChange={(e) => setAskState({ ...askState, value: e.target.value })} />
              )}
            </Field>
          </form>
        )}
      </Sheet>

      <Sheet
        open={!!confirmState}
        onClose={() => closeConfirm(false)}
        title={confirmState?.title}
        description={confirmState?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => closeConfirm(false)}>Annuler</Button>
            <Button variant={confirmState?.danger ? 'sam' : 'primary'} onClick={() => closeConfirm(true)}>
              {confirmState?.confirmLabel || 'Confirmer'}
            </Button>
          </>
        }
      >
        <div />
      </Sheet>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-xl"
              role="status"
            >
              {t.kind === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-soleil" />}
              {t.kind === 'error' && <AlertTriangle className="h-4 w-4 shrink-0 text-laterite" />}
              {t.kind === 'info' && <Info className="h-4 w-4 shrink-0 opacity-70" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
};

export const useUi = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUi must be used within UiProvider');
  return c;
};
