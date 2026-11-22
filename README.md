# Board games catalog (monorepo)

```
backend/    FastAPI + SQLAlchemy CRUD API     -> PyPI (boardgames-catalog-api) + Docker Hub (boardgames-api)
frontend/   Vite + vanilla JS UI behind nginx -> Docker Hub (boardgames-web)
docker-compose.yml       production-style stack (Postgres + published images, versions pinned in .env)
docker-compose.dev.yml   builds from this checkout (also used by CI)
```

## Run it

```bash
cp .env.example .env    # set POSTGRES_PASSWORD (and DOCKERHUB_USERNAME for the prod file)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# http://localhost:8080 (API docs: http://localhost:8000/docs)
```

## GitHub setup

```bash
gh auth login
DOCKERHUB_TOKEN=... RELEASE_PLEASE_TOKEN=... ./setup-github.sh <github-user> <dockerhub-user>
# VISIBILITY=private ./setup-github.sh ...   (branch protection then needs GitHub Pro/Team)
# REVIEWS=1 ./setup-github.sh ...            (if you are solo with one helper account)
```

## Workflows

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yml` | PR to `main` | `pr-title`; path-filtered `backend-checks`, `frontend-checks`, `compose-smoke-test`; `ci-gate` |
| `release.yml` | push to `main` | release-please PR(s); on a release merge: PyPI + Docker Hub publish |

Required checks on `main`: `pr-title` and `ci-gate` only.

## Release flow to practice

1. Branch, commit, open a PR titled e.g. `feat: add rating field`. CI runs only what the PR touched.
2. Get 2 approvals, squash-merge.
3. release-please opens `chore(main): release backend 0.1.0` and/or `... frontend 0.1.0` (separate PRs).
4. Merge a release PR: tag `backend-v0.1.0` + GitHub release, then publish jobs run.
5. Deploy: set `BACKEND_VERSION` / `FRONTEND_VERSION` in `.env` and `docker compose pull && docker compose up -d`.

## Monorepo specifics worth noticing

- **Path filters + required checks:** a workflow-level `paths:` filter leaves required checks pending when the
  workflow doesn't run. Here filtering is done per job, and `ci-gate` gives branch protection one stable check.
- **One commit, two releases:** a squash-merge touching both `backend/` and `frontend/` bumps both packages.
  Use `feat!:` / `fix:` deliberately; the scope you pick decides the version bump.
- **Component tags:** `backend-v1.2.0` and `frontend-v0.4.1` version independently.
- **PRs from bots don't trigger CI** and **tags from GITHUB_TOKEN don't trigger workflows**: see `RELEASE_PLEASE_TOKEN`
  and why publishing sits in `release.yml`.
- **You can't approve your own PR**, and the release PR is authored by the PAT owner.
- Not included on purpose: Alembic migrations, auth, SHA-pinned actions, image signing, automated deploy.
