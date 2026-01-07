# Admin tab split worklog

## Status
- Branch: admin-tab-split
- Dashboard, Members, Groups, Tournament tabs extracted and lazy-loaded.
- Results and History still inline.
- Untracked/generated: convex/_generated/api.d.ts; matches.ts/courtkeeper/+page.svelte carry existing local edits.

## Plan
- Extract Results, then History into `src/routes/admin/tabs/`, committing after each.
- Keep shell minimal (nav/auth/theme/loading) and lazy-load tab modules with skeleton fallback.
- Optionally move tab-specific queries into tabs for further scope/weight reduction after split.

## Next steps
1) Extract Results tab into tabs/ResultsTab.svelte; dynamic import in +page.
2) Extract History tab similarly.
3) Re-evaluate moving queries into tabs and trimming shell state.
