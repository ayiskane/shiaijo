# Admin tab split worklog

## Status
- Branch: admin-tab-split
- Dashboard, Members, Groups, Tournament, Results, and History tabs extracted and lazy-loaded.
- Untracked/generated: convex/_generated/api.d.ts; matches.ts/courtkeeper/+page.svelte carry existing local edits.

## Plan
- Keep shell minimal (nav/auth/theme/loading) and lazy-load tab modules with skeleton fallback.
- Optionally move tab-specific queries into tabs for further scope/weight reduction after split.

## Next steps
1) Re-evaluate moving queries into tabs and trimming shell state.
