import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Share, SquarePlus, MoreVertical, Smartphone, X, MonitorDown, Monitor } from 'lucide-react';
import { isIOS, useInstall } from '../lib/install';
import { Button, Sheet, cx } from './ui';

/** Fenêtre d'aide affichée quand le navigateur ne propose pas l'installation automatique (iPhone notamment). */
export const InstallHelp: React.FC = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('sam:install-help', on);
    return () => window.removeEventListener('sam:install-help', on);
  }, []);
  const ios = isIOS();
  const mobile = ios || /Android|Mobi/i.test(navigator.userAgent);
  const mac = !mobile && /Macintosh/.test(navigator.userAgent);
  const safariMac = mac && /Safari/.test(navigator.userAgent) && !/Chrome|Edg/.test(navigator.userAgent);

  const steps = ios
    ? [
        { icon: <Share className="h-5 w-5" />, text: <>Ouvre SAM dans <strong>Safari</strong> (ou Chrome), puis touche le bouton <strong>Partager</strong>.</> },
        { icon: <SquarePlus className="h-5 w-5" />, text: <>Fais défiler et choisis <strong>Sur l’écran d’accueil</strong>.</> },
        { icon: <Smartphone className="h-5 w-5" />, text: <>Touche <strong>Ajouter</strong>. L’icône SAM apparaît avec tes autres apps.</> },
      ]
    : mobile
      ? [
          { icon: <MoreVertical className="h-5 w-5" />, text: <>Dans <strong>Chrome</strong>, touche le menu <strong>⋮</strong> en haut à droite.</> },
          { icon: <SquarePlus className="h-5 w-5" />, text: <>Choisis <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.</> },
          { icon: <Smartphone className="h-5 w-5" />, text: <>Confirme. L’icône SAM apparaît avec tes autres apps.</> },
        ]
      : safariMac
        ? [
            { icon: <Share className="h-5 w-5" />, text: <>Dans <strong>Safari</strong>, ouvre le menu <strong>Fichier</strong> (ou le bouton Partager).</> },
            { icon: <SquarePlus className="h-5 w-5" />, text: <>Choisis <strong>Ajouter au Dock</strong>.</> },
            { icon: <Monitor className="h-5 w-5" />, text: <>SAM s’ouvre ensuite depuis le Dock, dans sa propre fenêtre.</> },
          ]
        : [
            { icon: <MonitorDown className="h-5 w-5" />, text: <>Dans <strong>Chrome</strong> ou <strong>Edge</strong>, clique sur l’icône d’installation à droite de la barre d’adresse.</> },
            { icon: <MoreVertical className="h-5 w-5" />, text: <>Sinon : menu <strong>⋮</strong> (ou <strong>…</strong> dans Edge) → <strong>Caster, enregistrer et partager → Installer la page en tant qu’application</strong> (Chrome) ou <strong>Applications → Installer ce site en tant qu’application</strong> (Edge).</> },
            { icon: <Monitor className="h-5 w-5" />, text: <>SAM apparaît dans le menu Démarrer et peut être épinglée à la barre des tâches. Firefox ne propose pas cette option.</> },
          ];

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title={mobile ? "Ajouter SAM à ton écran d’accueil" : "Installer SAM sur ton ordinateur"}
      description={mobile ? "SAM s’ouvrira comme une vraie app, en plein écran, sans retaper le lien." : "SAM s’ouvrira dans sa propre fenêtre, comme un logiciel, sans retaper le lien."}
      footer={<Button variant="primary" onClick={() => setOpen(false)}>J’ai compris</Button>}
    >
      <ol className="space-y-4 pb-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sheet-2 text-ink">{s.icon}</span>
            <p className="pt-1.5 text-[0.95rem] text-ink">{s.text}</p>
          </li>
        ))}
      </ol>
    </Sheet>
  );
};

/** Bandeau discret sur l'accueil, uniquement sur téléphone et tant que SAM n'est pas installée. */
export const InstallBanner: React.FC<{ className?: string }> = ({ className }) => {
  const { installed, install } = useInstall();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('sam_install_dismissed') === '1';
    } catch {
      return false;
    }
  });
  if (installed || hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem('sam_install_dismissed', '1');
    } catch { /* stockage indisponible */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={cx('flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 md:hidden', className)}
    >
      <img src="/icons/icon-192.png" alt="" className="h-9 w-9 shrink-0 rounded-lg" />
      <p className="min-w-0 flex-1 text-[0.86rem] leading-snug text-ink-2">Ajoute SAM à ton écran d’accueil pour l’ouvrir en un geste.</p>
      <Button size="sm" variant="primary" onClick={() => install()}>Installer</Button>
      <button onClick={dismiss} aria-label="Masquer" className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-sheet-2">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};
