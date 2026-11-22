const BASE = "/api"; // nginx (prod) and the Vite dev server both proxy /api to the backend

export function formatError(body, status) {
  const detail = body?.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join("; ");
  if (typeof detail === "string") return detail;
  return `Request failed (${status})`;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatError(body, res.status));
  }
  return res.status === 204 ? null : res.json();
}

export const getHealth = () => request("/health");
export const listGames = (q = "") =>
  request(`/games${q ? `?q=${encodeURIComponent(q)}` : ""}`);
export const createGame = (game) =>
  request("/games", { method: "POST", body: JSON.stringify(game) });
export const updateGame = (id, game) =>
  request(`/games/${id}`, { method: "PUT", body: JSON.stringify(game) });
export const deleteGame = (id) => request(`/games/${id}`, { method: "DELETE" });
