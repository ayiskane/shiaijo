# Admin tab split worklog

## Status
- Branch: admin-tab-split
- Dashboard and Members tabs extracted and lazy-loaded.
- Groups tab extracted and wired; tournaments/results/history still inline.
- Uncommitted local: convex/_generated/api.d.ts (generated), admin/+page.svelte, tabs/GroupsTab.svelte, this note update.

## Plan
- Continue extracting tabs one-by-one (Tournament, Results, History) into `src/routes/admin/tabs/`.
- For each tab: move markup/logic, pass current props, keep behavior identical; later move queries into tabs for data-scope optimization.
- Keep shell minimal (nav/auth/theme/loading) and lazy-load tab modules with skeleton fallback.

## Next steps
1) Extract Tournament tab into tabs/TournamentTab.svelte; replace inline block with dynamic import.
2) Repeat for Results, then History; commit after each tab for easy bisect.
3) Consider moving tab-specific queries into each tab after extraction for further weight reduction.
