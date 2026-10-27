import { useEffect, useRef, useState } from 'react';

/** Dictée vocale (Web Speech API). Ajoute le texte reconnu via onText. */
export function useDictation(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const cb = useRef(onText);
  cb.current = onText;
  const supported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    if (!supported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'fr-FR';
    rec.onresult = (e: any) => {
      let t = '';
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t.trim()) cb.current(t.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => rec.abort?.();
  }, [supported]);

  const toggle = () => {
    if (!recRef.current) return false;
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      try {
        recRef.current.start();
        setListening(true);
      } catch { /* déjà démarré */ }
    }
    return true;
  };
  return { listening, toggle, supported };
}
