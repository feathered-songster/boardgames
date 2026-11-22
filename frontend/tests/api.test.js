import { afterEach, describe, expect, it, vi } from "vitest";
import { createGame, deleteGame, formatError, listGames } from "../src/api.js";

const respond = (status, body) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("lists games and encodes the search query", async () => {
    const fetchMock = vi.fn(() => respond(200, []));
    vi.stubGlobal("fetch", fetchMock);
    await listGames("cat an");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games?q=cat%20an");
  });

  it("posts JSON when creating", async () => {
    const fetchMock = vi.fn(() => respond(201, { id: 1, title: "Azul" }));
    vi.stubGlobal("fetch", fetchMock);
    const game = await createGame({ title: "Azul" });
    expect(game.id).toBe(1);
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("returns null for 204 deletes", async () => {
    vi.stubGlobal("fetch", vi.fn(() => respond(204)));
    expect(await deleteGame(1)).toBeNull();
  });

  it("throws readable validation errors", async () => {
    vi.stubGlobal("fetch", vi.fn(() => respond(422, { detail: [{ msg: "bad title" }] })));
    await expect(createGame({})).rejects.toThrow("bad title");
  });

  it("formats unknown errors", () => {
    expect(formatError({}, 500)).toBe("Request failed (500)");
  });
});
