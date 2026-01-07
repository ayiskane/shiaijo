# Admin tab split worklog

## Status
- Branch: admin-tab-split
- Dashboard tab extracted and lazy-loaded via dynamic import.
- Remaining tabs still inline: members, groups, tournament, results, history.
- Uncommitted changes: convex/_generated/api.d.ts, admin/+page.svelte, new tabs/DashboardTab.svelte, notes update.

## Plan
- Continue extracting tabs one-by-one (Members, Groups, Tournament, Results, History) into src/routes/admin/tabs/.
- For each tab: move markup/logic, pass current props, keep behavior identical; later move queries into tabs for data-scope optimization.
- Keep shell minimal (nav/auth/theme/loading) and lazy-load tab modules with skeleton fallback.

## Next steps
1) Extract Members tab into tabs/MembersTab.svelte; replace inline block with dynamic import.
2) Repeat for Groups, Tournament, Results, History; commit after each tab for easy bisect.
3) Consider moving tab-specific queries into each tab after extraction for further weight reduction.
