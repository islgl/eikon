# Contributing to Eikon

Thanks for your interest in contributing. Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Follow the [self-hosting guide](README.md#self-hosting) to set up Supabase and environment variables
3. Run `npm install && npm run dev`

## Submitting Changes

- **Bugs:** Open an issue first to confirm the bug, then submit a PR with a fix
- **Features:** Open an issue to discuss before building — avoid duplicate effort
- **Refactors / cleanup:** Keep PRs focused; large structural changes need prior discussion

## Code Style

- TypeScript throughout — no `any` unless unavoidable
- Tailwind for styling — no inline styles except dynamic values
- Server Actions for all data mutations — no API routes
- No comments unless the *why* is non-obvious

## PR Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds locally
- [ ] No unrelated changes included
- [ ] CHANGELOG.md updated under `[Unreleased]`
