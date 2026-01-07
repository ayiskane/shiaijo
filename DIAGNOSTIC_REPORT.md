# Shiaijo Diagnostic Report
> Generated: January 2026  
> Build Status: ✅ PASSING (no errors or warnings)

---

## 🔧 Issues Fixed

### 1. Landing Page CSS (HIGH PRIORITY) ✅
**Problem:** Unused CSS selectors causing build warnings
- `.portal-wide` selector referenced but class not in HTML
- `.staff-row .portal-card:nth-child(N)` selectors with no matching elements
- Animation delays not working

**Fix Applied:**
- Rewrote CSS to match actual HTML structure
- Used CSS custom property `--delay` for staggered animations
- All CSS selectors now match existing elements

### 2. Deprecated `<svelte:component>` (MEDIUM PRIORITY) ✅
**Problem:** Svelte 5 warns about deprecated `<svelte:component this={...}>` syntax
- 3 occurrences in `admin/+page.svelte`

**Fix Applied:**
- Changed to Svelte 5 dynamic component syntax: `<item.icon class="..." />`
- Components are dynamic by default in runes mode

### 3. Japanese Font Subsetting (MEDIUM PRIORITY) ✅
**Problem:** Japanese fonts were 8.7MB total (huge initial download)

**Analysis:**
- App only uses 13 unique Japanese characters: `合場奉審武管練色藍観試道錬`
- Full CJK font files contained 20,000+ unused glyphs

**Fix Applied:**
- Used `pyftsubset` (fonttools) to create subset fonts
- Before: 8.7MB → After: 18KB (**99.8% reduction!**)

| Font | Before | After | Reduction |
|------|--------|-------|-----------|
| SicYubi-HyojunGakushu | 4.5MB | 9.2KB | 99.8% |
| SicYubi-FudeGyosho | 4.2MB | 8.6KB | 99.8% |
| **Total** | **8.7MB** | **18KB** | **99.8%** |

### 4. Duplicate Font Preloading (LOW PRIORITY) ✅
**Problem:** Same fonts preloaded in both `app.html` and `+layout.svelte`

**Fix Applied:**
- Removed duplicate `<link rel="preload">` from `+layout.svelte`
- `app.html` preloading is sufficient

---

## 📊 Current State Analysis

### File Sizes
| File | Lines | Size | Status |
|------|-------|------|--------|
| `admin/+page.svelte` | 2,490 | 123KB | ⚠️ Large monolith |
| `courtkeeper/+page.svelte` | 581 | 36KB | ✅ OK |
| `spectator/+page.svelte` | 409 | 25KB | ✅ OK |
| `+page.svelte` (landing) | 290 | 9KB | ✅ Fixed |

### Font Files (After Optimization)
| Font | Size | Format | Notes |
|------|------|--------|-------|
| SicYubi-HyojunGakushu | 9.2KB | WOFF2 | ✅ Subsetted (13 chars) |
| SicYubi-FudeGyosho | 8.6KB | WOFF2 | ✅ Subsetted (13 chars) |
| TitilliumWeb-* | 18-22KB | WOFF2 | ✅ Already optimized |
| **Total Fonts** | **148KB** | | ✅ Down from 8.8MB |

### Build Output
- Client bundle: ~200KB (gzipped)
- Server bundle: ~500KB
- Build time: ~70s

---

## ⚠️ Remaining Recommendations

### MEDIUM PRIORITY

#### 1. Split Admin Page into Components
The 2,490-line `admin/+page.svelte` should be refactored:
```
src/routes/admin/
├── +page.svelte          # Main layout (200 lines)
├── tabs/
│   ├── Dashboard.svelte
│   ├── Members.svelte
│   ├── Groups.svelte
│   ├── Tournament.svelte
│   ├── Results.svelte
│   └── History.svelte
└── components/
    ├── Sidebar.svelte
    └── MobileNav.svelte
```

Benefits:
- Better code organization
- Faster HMR during development
- Easier to maintain

### LOW PRIORITY

#### 2. TypeScript Errors
```bash
src/convex/tournaments.ts(178,11): error TS2322
src/lib/components/ui/badge/index.ts: export errors
```
- Convex type issues in tournaments.ts
- Shadcn component export mismatches (may need updating)

#### 3. Add Error Boundaries
No error boundary components found - users see blank screens on errors.

#### 4. Loading States
Consider skeleton loaders for Convex data fetching.

---

## ✅ What's Working Well

1. **Tailwind v4 Setup** - Using Vite plugin correctly
2. **Font Loading** - Preloading + font-display: swap + subsetted fonts
3. **Convex Integration** - Proper setup with convex-svelte
4. **Accessibility** - Touch targets and contrast settings
5. **Dark Mode** - mode-watcher integration
6. **Responsive Design** - Mobile-first breakpoints

---

## 🚀 Performance Optimizations Applied

- [x] Self-hosted fonts (no Google Fonts CDN)
- [x] Font preloading for critical fonts
- [x] **Font subsetting (8.7MB → 18KB)**
- [x] Compound indexes on Convex tables
- [x] Tailwind v4 with Vite plugin
- [x] CSS inlining threshold set
- [x] No PostCSS overhead
- [x] Svelte 5 dynamic components (no deprecated patterns)

---

## Japanese Characters Used

The app uses only these 13 kanji characters:
```
合 場 奉 審 武 管 練 色 藍 観 試 道 錬
```

These appear in:
- `試合場` (Shiaijo - tournament venue)
- `練武道場` / `錬武道場` (Renbu Dojo)
- `観` (Spectator), `管` (Admin), `審` (Courtkeeper), `奉` (Volunteer)
- `藍色` (Ai-iro - indigo color theme)

---

## Commands Used

```bash
# Font subsetting
pip install fonttools brotli
pyftsubset font.woff2 --text="合場奉審武管練色藍観試道錬" --flavor=woff2

# Build verification
npm run build  # ✅ Success in ~70s
```
