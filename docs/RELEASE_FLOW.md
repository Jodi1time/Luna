# Luna Release Flow

Luna should not treat `main` as a sketchpad. The app handles sensitive health data, so production changes need a small release path with review points.

## Branch Roles

- `feature/*` or `codex/*`: one focused change, experiment, fix, or design pass.
- `dev`: active integration. Multiple finished feature branches meet here first.
- `staging`: dress rehearsal. This should match the version being tested before release.
- `main`: production. Protected, stable, deployable.

## Path To Production

1. Start from latest `main`.
2. Create a focused feature branch.
3. Run tests and build locally.
4. Open a PR into `dev`.
5. Merge `dev` into `staging` when a testable batch is ready.
6. Test `staging` like a real user: onboarding, auth, logging, calendar, AI chat, paywall, and sensitive-data flows.
7. Merge `staging` into `main` only when the release candidate is ready.

## Rules

- No direct design experiments on `main`.
- No algorithm, auth, storage, or paywall changes without tests.
- No UI release without a mobile viewport check.
- No sensitive-data change without checking `SECURITY_ARCHITECTURE.md`.
- Every PR should say what changed, what was tested, and what risk remains.

## Recommended Branch Protection

- Require PRs before merging into `main`.
- Require passing tests and build before `main`.
- Require at least one review for `main`.
- Restrict force pushes and branch deletion on `main` and `staging`.
- Keep deploys tied to `main` only unless a separate staging host is configured.

