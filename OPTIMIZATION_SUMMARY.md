# Shiaijo App Optimization Summary

## Overview

Based on research of SvelteKit and Convex best practices, the following optimizations have been implemented and additional recommendations are provided.

## Implemented Optimizations

### 1. Landing Page UI Fix
- **Change**: Narrowed spectator portal button (max-width: 280px)
- **Result**: More balanced layout with square-ish portal buttons

### 2. Database Query Optimizations (Convex)

#### New Compound Index
Added `by_tournament_member` index to participants table:
```typescript
participants: defineTable({...})
  .index("by_tournament_member", ["tournamentId", "memberId"])
```

#### Optimized Functions
| Function | Before | After | Improvement |
|----------|--------|-------|-------------|
| `add()` | `withIndex().filter()` | `withIndex()` compound | O(n) → O(log n) |
| `addBulk()` | `withIndex().filter()` | `withIndex()` compound | O(n) → O(log n) per item |
| `removeByMember()` | `withIndex().filter()` | `withIndex()` compound | O(n) → O(log n) |
| `getActive()` | `.collect()[0]` | `.first()` | Avoids collecting all items |
| `getByCourt()` | Filter all matches | Two indexed queries | O(n) → O(log n) × 2 |

## Current Tech Stack Assessment

### ✅ Already Optimal
- **Svelte 5**: Latest version with runes, excellent performance
- **Tailwind v4**: Modern utility-first CSS with optimal tree-shaking
- **shadcn-svelte (bits-ui)**: Headless, accessible, minimal bundle impact
- **svelte-sonner**: Recommended toast library, lightweight
- **Convex**: Real-time database with built-in caching and subscriptions
- **Vite 6**: Latest build tool with optimal code splitting

### Libraries Comparison

| Category | Current | Alternative | Recommendation |
|----------|---------|-------------|----------------|
| UI Components | bits-ui/shadcn-svelte | Skeleton, Flowbite | Keep current - headless = smallest bundle |
| Toasts | svelte-sonner | - | Optimal choice, widely recommended |
| Icons | lucide-svelte + @lucide/svelte | - | Could consolidate to one package |
| State | Convex real-time | - | Already handles caching optimally |

## Recommendations for Future Optimization

### High Priority

1. **Font Loading Optimization**
   ```html
   <!-- Add preload for custom Japanese fonts -->
   <link rel="preload" href="/fonts/SicYubi-HyojunGakushu.woff2" as="font" crossorigin>
   ```

2. **Image Optimization**
   - Consider `@sveltejs/enhanced-img` for logo/static images
   - Already using next-gen formats? Check and convert if not

3. **Prerendering Static Pages**
   ```typescript
   // src/routes/+page.ts (landing page is static)
   export const prerender = true;
   ```

### Medium Priority

4. **Consolidate Icon Packages**
   - Currently have both `lucide-svelte` and `@lucide/svelte`
   - Migrate all to `@lucide/svelte` for consistent tree-shaking

5. **CSS Inlining for Critical Path**
   ```javascript
   // svelte.config.js
   kit: {
     inlineStyleThreshold: 5000 // Inline small CSS
   }
   ```

6. **Add Loading States with Optimistic Updates**
   - Convex supports optimistic updates for mutations
   - Makes UI feel instant even before server confirms

### Low Priority

7. **Implement Court State Persistence** (already have backend)
   - Debounced saves (500ms) to avoid excessive writes
   - Auto-restore on page load

8. **Code Split Admin Portal**
   - Currently 94.70 kB - largest page
   - Could lazy-load tournament/matches tabs

## Performance Monitoring

Recommended tools:
- **Lighthouse**: Run `npm run preview` then audit
- **Core Web Vitals**: Monitor FCP, LCP, TBT
- **Bundle Analysis**: `npx vite-bundle-visualizer`

## Bundle Size Reference

Current build output (server):
```
spectator/_page.svelte.js    30.02 kB
courtkeeper/_page.svelte.js  72.22 kB  
admin/_page.svelte.js        94.70 kB (largest)
```

---

Last updated: 2026-01-06
