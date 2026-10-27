import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

/**
 * En local (`npm run dev`), sert les fonctions du dossier /api comme le ferait Vercel.
 */
function localApi(): Plugin {
  return {
    name: 'sam-local-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const route = req.url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '');
        try {
          const mod = await server.ssrLoadModule(`/api/${route}.ts`);
          let raw = '';
          for await (const chunk of req) raw += chunk;
          const vreq: any = { method: req.method, headers: req.headers, body: raw ? JSON.parse(raw) : {} };
          const vres: any = {
            status(code: number) { res.statusCode = code; return vres; },
            setHeader(k: string, v: string) { res.setHeader(k, v); },
            json(body: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); },
          };
          await mod.default(vreq, vres);
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: e?.message || 'Erreur API locale' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Rend les variables du .env disponibles aux fonctions /api en local.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), tailwindcss(), localApi()],
  };
});
