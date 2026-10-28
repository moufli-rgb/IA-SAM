import type { MessageAttachment } from '../types/sam';

/** Pièce jointe prête à partir vers SAM. */
export type PreparedFile = {
  id: string;
  name: string;
  kind: MessageAttachment['kind'];
  size: number;
  mime: string;
  /** base64 sans préfixe (images et PDF) */
  data?: string;
  /** texte extrait (txt, md, csv, Word…) */
  text?: string;
  /** petite image pour l'aperçu et l'historique */
  thumb?: string;
};

// Une requête Vercel est limitée à 4,5 Mo : on garde une marge.
export const MAX_TOTAL_BYTES = 3_300_000;
const MAX_PDF_BYTES = 3_000_000;
const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|tex|bib|rtf|html?|xml)$/i;

export const ACCEPT = 'image/*,.pdf,.docx,.txt,.md,.csv,.tsv,.json,.tex,.bib';

const readAsDataURL = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsDataURL(b);
  });

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function drawJpeg(img: HTMLImageElement, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', quality);
}

const uid = () => Math.random().toString(36).slice(2, 10);
const b64Size = (b64: string) => Math.floor((b64.length * 3) / 4);

/** Prépare un fichier choisi par l'utilisateur. Lève une erreur lisible si le type n'est pas pris en charge. */
export async function prepareFile(file: File): Promise<PreparedFile> {
  const name = file.name || 'fichier';
  const lower = name.toLowerCase();

  if (file.type.startsWith('image/')) {
    let img: HTMLImageElement;
    try {
      img = await loadImage(file);
    } catch {
      throw new Error(`Impossible de lire l’image « ${name} ». Essaie en JPEG ou PNG.`);
    }
    // Photos réduites à 1600 px : largement assez pour que SAM lise un plan, une coupe ou une page.
    const full = drawJpeg(img, 1600, 0.82);
    const thumb = drawJpeg(img, 320, 0.7);
    const data = full.split(',')[1];
    return { id: uid(), name, kind: 'image', size: b64Size(data), mime: 'image/jpeg', data, thumb };
  }

  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
    if (file.size > MAX_PDF_BYTES) throw new Error(`« ${name} » est trop lourd (${(file.size / 1e6).toFixed(1)} Mo). Maximum 3 Mo par PDF : envoie seulement les pages utiles.`);
    const data = (await readAsDataURL(file)).split(',')[1];
    return { id: uid(), name, kind: 'pdf', size: file.size, mime: 'application/pdf', data };
  }

  if (lower.endsWith('.docx')) {
    const { default: mammoth } = await import('mammoth/mammoth.browser.js');
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const text = value.trim();
    if (!text) throw new Error(`Aucun texte trouvé dans « ${name} ».`);
    return { id: uid(), name, kind: 'doc', size: text.length, mime: 'text/plain', text: text.slice(0, 60_000) };
  }

  if (lower.endsWith('.doc')) {
    throw new Error(`« ${name} » est un ancien format Word (.doc). Enregistre-le en .docx ou en PDF, puis réessaie.`);
  }

  if (file.type.startsWith('text/') || TEXT_EXT.test(lower)) {
    const text = (await file.text()).trim();
    return { id: uid(), name, kind: 'text', size: text.length, mime: 'text/plain', text: text.slice(0, 60_000) };
  }

  throw new Error(`Le format de « ${name} » n’est pas pris en charge. Envoie une image, un PDF, un fichier Word (.docx) ou un texte.`);
}

export const totalSize = (files: PreparedFile[]) => files.reduce((n, f) => n + (f.data ? b64Size(f.data) : f.text?.length || 0), 0);

/** Ce qu'on garde dans l'historique (léger) */
export const toHistory = (f: PreparedFile): MessageAttachment => ({ name: f.name, kind: f.kind, size: f.size, thumb: f.thumb });

/** Ce qu'on envoie au serveur */
export const toPayload = (f: PreparedFile) => (f.text ? { name: f.name, text: f.text } : { name: f.name, mime: f.mime, data: f.data });
