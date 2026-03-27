import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import type { IncomingMessage } from 'http';

function gasProxyPlugin(gasUrl: string): Plugin {
  async function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk: Buffer) => (data += chunk));
      req.on('end', () => resolve(data));
    });
  }

  async function fetchFollowingPost(url: string, init: RequestInit): Promise<Response> {
    const res = await fetch(url, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        return fetch(new URL(location, url).toString(), { redirect: 'follow' });
      }
    }
    return res;
  }

  return {
    name: 'gas-proxy',
    configureServer(server) {
      server.middlewares.use('/gas', async (req, res) => {
        try {
          const incoming = new URL(req.url || '', 'http://localhost');
          const isPost = req.method === 'POST';

          if (isPost) {
            const body = await readBody(req);
            const response = await fetchFollowingPost(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body,
            });
            const text = await response.text();
            res.writeHead(response.status, {
              'Content-Type': response.headers.get('content-type') || 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(text);
          } else {
            const target = gasUrl + incoming.search;
            const response = await fetch(target, { redirect: 'follow' });
            const text = await response.text();
            res.writeHead(response.status, {
              'Content-Type': response.headers.get('content-type') || 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(text);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: msg }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gasUrl = env.VITE_GAS_WEB_APP_URL || '';

  return {
    base: '/second-brain-ai/', // ✅ THIS LINE ADDED

    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['pwa-icon.svg'],
        manifest: {
          name: 'Second Brain AI',
          short_name: 'SecondBrain',
          description: 'AI-powered task management and daily planning',
          theme_color: '#2f3187',
          background_color: '#f8f9fa',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/second-brain-ai/',
          start_url: '/second-brain-ai/',
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-maskable.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/gas/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gas-api',
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              },
            },
          ],
        },
      }),
      ...(gasUrl ? [gasProxyPlugin(gasUrl)] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
