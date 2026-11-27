#!/usr/bin/env bash
# Creates the GitHub repo, pushes main, and applies production-style settings:
# squash-only merges, protected main, N required reviews, required status checks.
#
# Usage: ./setup-github.sh <github-owner> <dockerhub-user>
# Optional env: VISIBILITY=public|private (default public)  REVIEWS=2 (default)
#               REPO=boardgames  DOCKERHUB_TOKEN=...  RELEASE_PLEASE_TOKEN=...
# Needs: gh (authenticated, repo + workflow scopes), jq. Run from the repo root.
#
# NOTE: on GitHub Free, branch protection only works on PUBLIC repos. Private repos
# need GitHub Pro (personal) or Team/Enterprise (org). The script warns instead of failing.
set -euo pipefail

OWNER="${1:?usage: $0 <github-owner> <dockerhub-user>}"
DH_USER="${2:?usage: $0 <github-owner> <dockerhub-user>}"
REPO="${REPO:-boardgames}"
VISIBILITY="${VISIBILITY:-public}"
REVIEWS="${REVIEWS:-2}"
FULL="$OWNER/$REPO"
cd "$(dirname "$0")"

if ! gh repo view "$FULL" >/dev/null 2>&1; then
  gh repo create "$FULL" "--$VISIBILITY" --source . --remote origin --push
fi

# Squash only; the PR title becomes the commit message release-please reads.
gh api -X PATCH "repos/$FULL" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=BLANK >/dev/null

# Lets release-please open PRs when it falls back to GITHUB_TOKEN.
gh api -X PUT "repos/$FULL/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true >/dev/null

jq -n --argjson n "$REVIEWS" '{
  required_status_checks: { strict: true, contexts: ["pr-title", "ci-gate"] },
  enforce_admins: true,
  required_pull_request_reviews: {
    required_approving_review_count: $n,
    dismiss_stale_reviews: true,
    require_last_push_approval: true
  },
  restrictions: null,
  required_linear_history: true,
  required_conversation_resolution: true,
  allow_force_pushes: false,
  allow_deletions: false
}' > /tmp/protection.json

if gh api -X PUT "repos/$FULL/branches/main/protection" --input /tmp/protection.json >/dev/null 2>/tmp/protection.err; then
  echo "Branch protection applied ($REVIEWS required reviews)."
else
  echo "WARNING: could not protect main:" >&2
  cat /tmp/protection.err >&2
  echo "On a private repo this needs GitHub Pro/Team/Enterprise. Make the repo public or upgrade." >&2
fi

gh variable set DOCKERHUB_USERNAME --repo "$FULL" --body "$DH_USER"
if [[ -n "${DOCKERHUB_TOKEN:-}" ]]; then gh secret set DOCKERHUB_TOKEN --repo "$FULL" --body "$DOCKERHUB_TOKEN"; fi
if [[ -n "${RELEASE_PLEASE_TOKEN:-}" ]]; then gh secret set RELEASE_PLEASE_TOKEN --repo "$FULL" --body "$RELEASE_PLEASE_TOKEN"; fi
gh api -X PUT "repos/$FULL/environments/pypi" >/dev/null

cat <<MSG

Done. Still manual:
  1. pypi.org -> Publishing -> pending publisher: project boardgames-catalog-api,
     owner $OWNER, repo $REPO, workflow release.yml, environment pypi.
  2. Secrets not set above: DOCKERHUB_TOKEN, RELEASE_PLEASE_TOKEN (fine-grained PAT).
  3. Invite a second collaborator (write access): you cannot approve your own PRs.
MSG
