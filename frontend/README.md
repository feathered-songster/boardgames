# frontend

Vanilla JS + Vite UI, served by nginx in production. nginx proxies `/api/*` to the `backend` service.

```bash
npm install
npm run dev     # http://localhost:5173, proxies /api to localhost:8000
npm test
```
