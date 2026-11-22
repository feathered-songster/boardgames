import { createGame, deleteGame, getHealth, listGames, updateGame } from "./api.js";

const $ = (id) => document.getElementById(id);
const form = $("game-form");
let editingId = null;

// Box-spine color derived from the title, so each game keeps its own edge color.
const spine = (title) => {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
};

const showError = (msg) => {
  $("error").textContent = msg ?? "";
  $("error").hidden = !msg;
};

function formToGame() {
  const d = Object.fromEntries(new FormData(form));
  const num = (v) => (v === "" || v == null ? null : Number(v));
  return {
    title: d.title.trim(),
    designer: d.designer.trim() || null,
    year_published: num(d.year_published),
    min_players: Number(d.min_players),
    max_players: Number(d.max_players),
    play_time_minutes: num(d.play_time_minutes),
    description: d.description.trim() || null,
  };
}

function startEdit(game) {
  editingId = game.id;
  for (const [k, v] of Object.entries(game)) if (form.elements[k]) form.elements[k].value = v ?? "";
  $("form-title").textContent = `Edit ${game.title}`;
  $("save").textContent = "Save changes";
  $("cancel").hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

function resetForm() {
  editingId = null;
  form.reset();
  $("form-title").textContent = "Add a game";
  $("save").textContent = "Add game";
  $("cancel").hidden = true;
  showError();
}

function render(games) {
  const list = $("games");
  list.replaceChildren();
  $("empty").hidden = games.length > 0;
  for (const g of games) {
    const li = document.createElement("li");
    li.style.setProperty("--spine", spine(g.title));
    const players = g.min_players === g.max_players ? g.min_players : `${g.min_players}-${g.max_players}`;
    const meta = [g.designer, g.year_published, `${players} players`, g.play_time_minutes && `${g.play_time_minutes} min`]
      .filter(Boolean)
      .join(", ");
    li.innerHTML = `<div><strong></strong><small></small><p></p></div><div class="row-actions"><button data-act="edit">Edit</button><button data-act="delete" class="danger">Delete</button></div>`;
    li.querySelector("strong").textContent = g.title;
    li.querySelector("small").textContent = meta;
    li.querySelector("p").textContent = g.description ?? "";
    li.querySelector('[data-act="edit"]').onclick = () => startEdit(g);
    li.querySelector('[data-act="delete"]').onclick = async () => {
      if (!confirm(`Delete ${g.title}?`)) return;
      await run(() => deleteGame(g.id));
    };
    list.append(li);
  }
}

async function refresh() {
  render(await listGames($("search").value.trim()));
}

async function run(action) {
  try {
    showError();
    await action();
    await refresh();
  } catch (e) {
    showError(e.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const game = formToGame();
  await run(async () => {
    await (editingId ? updateGame(editingId, game) : createGame(game));
    resetForm();
  });
});
$("cancel").onclick = resetForm;
$("search").addEventListener("input", () => run(() => Promise.resolve()));

$("version").textContent = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";
getHealth().then((h) => ($("api-version").textContent = h.version)).catch(() => {});
run(() => Promise.resolve());
