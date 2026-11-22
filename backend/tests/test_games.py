CATAN = {"title": "Catan", "designer": "Klaus Teuber", "year_published": 1995,
         "min_players": 3, "max_players": 4, "play_time_minutes": 90}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_and_get(client):
    created = client.post("/games", json=CATAN)
    assert created.status_code == 201
    game_id = created.json()["id"]
    fetched = client.get(f"/games/{game_id}")
    assert fetched.status_code == 200
    assert fetched.json()["title"] == "Catan"


def test_list_and_search(client):
    client.post("/games", json=CATAN)
    client.post("/games", json={"title": "Azul"})
    assert [g["title"] for g in client.get("/games").json()] == ["Azul", "Catan"]
    assert [g["title"] for g in client.get("/games", params={"q": "cat"}).json()] == ["Catan"]


def test_update(client):
    game_id = client.post("/games", json=CATAN).json()["id"]
    r = client.put(f"/games/{game_id}", json={**CATAN, "title": "Catan: Seafarers"})
    assert r.status_code == 200
    assert r.json()["title"] == "Catan: Seafarers"


def test_delete(client):
    game_id = client.post("/games", json=CATAN).json()["id"]
    assert client.delete(f"/games/{game_id}").status_code == 204
    assert client.get(f"/games/{game_id}").status_code == 404


def test_not_found(client):
    assert client.get("/games/999").status_code == 404
    assert client.put("/games/999", json=CATAN).status_code == 404
    assert client.delete("/games/999").status_code == 404


def test_validation(client):
    assert client.post("/games", json={"title": ""}).status_code == 422
    bad = {"title": "X", "min_players": 5, "max_players": 2}
    assert client.post("/games", json=bad).status_code == 422
