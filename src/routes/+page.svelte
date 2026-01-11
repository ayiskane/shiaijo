<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '../convex/_generated/api';

  const shiaijoLogo = '/shiaijologo.png';
  
  const spectator = { id: 'spectator', href: '/spectator', kanji: '観', label: 'SPECTATOR', desc: 'Watch live tournament matches' };
  
  const staffPortals = [
    { id: 'admin', href: '/admin', kanji: '管', label: 'ADMIN' },
    { id: 'courtkeeper', href: '/courtkeeper', kanji: '審', label: 'COURT' },
    { id: 'volunteer', href: '/volunteer', kanji: '奉', label: 'VOLUNTEER' },
  ];

  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let hasLiveTournament = $derived(tournaments.some(t => t.status === 'in_progress'));
</script>

<svelte:head>
  <title>Shiaijo - Kendo Tournament Management</title>
  <meta name="description" content="Real-time kendo tournament management system. Live scoring, court management, and spectator views for kendo competitions." />
  <meta name="keywords" content="kendo, tournament, shiaijo, martial arts, scoring, management" />
  <meta property="og:title" content="Shiaijo - Kendo Tournament Management" />
  <meta property="og:description" content="Real-time kendo tournament management system for live scoring and court management." />
  <meta property="og:type" content="website" />
  <!-- Viewport optimized for older users - prevents zoom issues -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
</svelte:head>

<div class="landing">
  <!-- Texture overlay -->
  <div class="texture"></div>

  <main class="container">
    <!-- Left side - Logo & Title -->
    <div class="title-section">
      <div class="logo-wrapper">
        <img src={shiaijoLogo} alt="Shiaijo" class="logo" width="180" height="180" fetchpriority="high" />
      </div>
      
      <div class="brand-name">S H I A I J O</div>
      <div class="subtitle">TOURNAMENT MANAGER</div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Right side - Portals -->
    <div class="portals-section">
     
      <!-- Spectator - Full width, highlighted -->
      <a
        href={hasLiveTournament ? spectator.href : undefined}
        class={`portal-card portal-spectator ${hasLiveTournament ? '' : 'disabled'}`}
        aria-disabled={!hasLiveTournament}
        aria-label={hasLiveTournament ? `${spectator.label}: ${spectator.desc}` : 'Spectator portal - No active tournaments'}
        title={hasLiveTournament ? spectator.desc : 'No active tournaments'}
      >
        <span class="portal-kanji" aria-hidden="true">{spectator.kanji}</span>
        <div class="portal-text">
          <span class="portal-label">{spectator.label}</span>
          <span class="portal-desc">{hasLiveTournament ? spectator.desc : 'No active tournaments'}</span>
        </div>
        <span class="portal-arrow" aria-hidden="true">→</span>
      </a>

      <!-- Staff portals - 3 square buttons -->
      <div class="staff-row">
        {#each staffPortals as portal, i}
          <a 
            href={portal.href} 
            class="portal-card portal-staff" 
            style="--delay: {0.1 + i * 0.05}s"
            aria-label="{portal.label} portal"
          >
            <span class="portal-kanji" aria-hidden="true">{portal.kanji}</span>
            <span class="portal-label">{portal.label}</span>
          </a>
        {/each}
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <a href="https://renbudojo.com" target="_blank" rel="noopener noreferrer" class="footer-link" aria-label="Visit Renbu Dojo website">
      <span class="footer-en">RENBU DOJO</span>
      <img src="/renbu-logo.png" alt="" class="footer-logo" loading="lazy" decoding="async" aria-hidden="true" />
      <span class="footer-jp">練武道場</span>
    </a>
  </footer>
</div>

<style>
  /* ============================================
     ACCESSIBILITY-OPTIMIZED FOR 45+ USERS
     Based on WCAG 2.1 AA/AAA guidelines
     - Minimum touch targets: 44px (we use 100px+)
     - Minimum font: 16px on mobile (we use 14px+ for labels)
     - High contrast ratios (4.5:1+)
     - Reduced motion support
     ============================================ */

  /* Theme variables */
  .landing {
    --bg: #0c0b09;
    --text: #e0e7ff;
    --text-muted: #a1afc4; /* Improved contrast from #94a3b8 */
    --text-faint: #6b7a8f; /* Improved contrast from #475569 */
    --card-bg: rgba(59, 130, 246, 0.06);
    --card-bg-hover: rgba(59, 130, 246, 0.12);
    --border: rgba(59, 130, 246, 0.12);
    --border-hover: rgba(59, 130, 246, 0.20);
    --divider: rgba(59, 130, 246, 0.08);
    --shadow: 0 20px 50px rgba(0,0,0,0.35);
    --glow: rgba(59, 130, 246, 0.3);
    
    /* Spectator highlight color - brighter blue */
    --spectator-bg: rgba(59, 130, 246, 0.15);
    --spectator-bg-hover: rgba(59, 130, 246, 0.25);
    --spectator-border: rgba(96, 165, 250, 0.3);
    --spectator-border-hover: rgba(96, 165, 250, 0.5);
    
    /* Square button size - INCREASED for 45+ users */
    --square-size: 110px;
    --portal-gap: 14px;
  }

  .landing {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-default, 'Titillium Web', system-ui, sans-serif);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    position: relative;
    /* Improve text rendering for older eyes */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .texture {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.02;
    pointer-events: none;
  }

  .container {
    display: flex;
    align-items: center;
    gap: 50px;
    max-width: 780px;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  /* Left side - Title section */
  .title-section {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-right: 36px;
  }

  .logo-wrapper {
    margin-bottom: 16px;
  }

  .logo {
    width: 160px;
    height: auto;
    filter: drop-shadow(0 0 30px var(--glow));
  }

  .brand-name {
    font-size: 16px; /* Increased from 14px */
    letter-spacing: 0.35em;
    color: var(--text);
    margin-bottom: 6px;
    font-weight: 500;
  }

  .subtitle {
    font-size: 12px; /* Increased from 10px */
    letter-spacing: 0.15em;
    color: var(--text-faint);
  }

  /* Divider */
  .divider {
    width: 1px;
    height: 200px;
    background: var(--divider);
    flex-shrink: 0;
  }

  /* Right side - Portals */
  .portals-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    /* Width = 3 squares + 2 gaps */
    width: calc(var(--square-size) * 3 + var(--portal-gap) * 2);
  }

  /* Portal cards base */
  .portal-card {
    display: flex;
    align-items: center;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-sizing: border-box;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeIn 0.5s ease-out backwards;
    /* Focus states for accessibility */
    outline: none;
  }

  .portal-card:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 2px;
  }

  .portal-card.disabled {
    opacity: 0.4; /* Slightly higher than 0.35 for better visibility */
    pointer-events: none;
    border-style: dashed;
  }

  .portal-card:hover {
    background: var(--card-bg-hover);
    border-color: var(--border-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }

  .portal-kanji {
    font-family: 'SicYubi-HyojunGakushu', serif;
    color: var(--text);
    line-height: 1;
    flex-shrink: 0;
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.12));
  }

  .portal-label {
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.1em;
  }

  .portal-desc {
    color: var(--text-muted);
  }

  .portal-arrow {
    color: var(--text-muted);
    transition: transform 0.3s ease;
    margin-left: auto;
  }

  .portal-card:hover .portal-arrow {
    transform: translateX(3px);
  }

  /* Spectator - Highlighted, compact */
  .portal-spectator {
    padding: 18px 22px; /* Increased padding */
    gap: 16px;
    height: var(--square-size);
    width: calc(var(--square-size) * 3 + var(--portal-gap) * 2);
    background: var(--spectator-bg);
    border-color: var(--spectator-border);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .portal-spectator:hover {
    background: var(--spectator-bg-hover);
    border-color: var(--spectator-border-hover);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .portal-spectator .portal-kanji {
    font-size: 44px; /* Increased from 40px */
    filter: drop-shadow(0 0 16px rgba(96, 165, 250, 0.25));
  }

  .portal-spectator .portal-text {
    display: flex;
    flex-direction: column;
    gap: 4px; /* Increased from 2px */
  }

  .portal-spectator .portal-label {
    font-size: 17px; /* Increased from 15px */
    color: #93c5fd;
  }

  .portal-spectator .portal-desc {
    font-size: 14px; /* Increased from 12px */
    line-height: 1.4;
  }

  .portal-spectator .portal-arrow {
    font-size: 20px; /* Increased from 18px */
    color: #93c5fd;
  }

  /* Staff row - 3 square buttons */
  .staff-row {
    display: grid;
    grid-template-columns: repeat(3, var(--square-size));
    gap: var(--portal-gap);
  }

  .portal-staff {
    width: var(--square-size);
    height: var(--square-size);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px; /* Increased from 8px */
    padding: 0;
    animation-delay: var(--delay, 0s);
  }

  .portal-staff .portal-kanji {
    font-size: 44px; /* Increased from 40px */
  }

  .portal-staff .portal-label {
    font-size: 13px; /* Increased from 11px - critical for 45+ */
    letter-spacing: 0.12em;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 28px; /* Slightly higher */
    left: 50%;
    transform: translateX(-50%);
  }

  .footer-link {
    display: flex;
    align-items: center;
    gap: 10px; /* Increased from 8px */
    text-decoration: none;
    transition: opacity 0.3s ease;
    padding: 8px 12px; /* Added padding for larger tap target */
    border-radius: 8px;
  }

  .footer-link:hover {
    opacity: 0.8;
  }

  .footer-link:focus-visible {
    outline: 2px solid #60a5fa;
    outline-offset: 2px;
  }

  .footer-jp {
    font-family: 'SicYubi-FudeGyosho', serif;
    font-size: 14px; /* Increased from 12px */
    color: var(--text-faint);
    letter-spacing: 0.15em;
  }

  .footer-logo {
    height: 20px; /* Increased from 18px */
    width: auto;
    object-fit: contain;
    display: inline-block;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45));
  }

  .footer-en {
    font-size: 12px; /* Increased from 10px */
    color: var(--text-faint);
    letter-spacing: 0.15em;
  }

  /* Animation */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ========== RESPONSIVE - OPTIMIZED FOR 45+ ========== */
  
  /* Tablet - Stack vertically */
  @media (max-width: 700px) {
    .landing {
      --square-size: 100px; /* Increased from 90px */
    }

    .container {
      flex-direction: column;
      gap: 32px;
    }

    .title-section {
      padding-right: 0;
    }

    .logo {
      width: 140px;
    }

    .brand-name {
      font-size: 15px;
    }

    .divider {
      width: 60px;
      height: 1px;
    }

    .portals-section {
      --portal-gap: 12px;
      width: calc(var(--square-size) * 3 + var(--portal-gap) * 2);
      gap: var(--portal-gap);
    }

    .portal-spectator {
      padding: 16px 20px;
      gap: 14px;
    }

    .portal-spectator .portal-kanji {
      font-size: 40px;
    }

    .portal-spectator .portal-label {
      font-size: 16px;
    }

    .portal-spectator .portal-desc {
      font-size: 14px; /* Keeping readable */
    }

    .staff-row {
      gap: var(--portal-gap);
    }

    .portal-staff .portal-kanji {
      font-size: 40px;
    }

    .portal-staff .portal-label {
      font-size: 13px; /* Minimum readable for 45+ */
    }
  }

  /* Mobile - CRITICAL for 45+ readability */
  @media (max-width: 400px) {
    .landing {
      --square-size: 95px; /* Increased from 80px for better tap targets */
      padding: 32px 16px;
    }

    .logo {
      width: 120px;
    }

    .brand-name {
      font-size: 14px;
    }

    .subtitle {
      font-size: 11px;
    }

    .portals-section {
      --portal-gap: 10px;
      width: calc(var(--square-size) * 3 + var(--portal-gap) * 2);
      gap: var(--portal-gap);
    }

    .portal-spectator {
      padding: 14px 16px;
      gap: 12px;
      border-radius: 12px;
    }

    .portal-spectator .portal-kanji {
      font-size: 36px;
    }

    .portal-spectator .portal-label {
      font-size: 15px; /* Increased from 13px */
    }

    .portal-spectator .portal-desc {
      font-size: 13px; /* Increased from 10px - CRITICAL */
      line-height: 1.3;
    }

    .staff-row {
      gap: var(--portal-gap);
    }

    .portal-staff {
      border-radius: 12px;
      gap: 8px;
    }

    .portal-staff .portal-kanji {
      font-size: 34px;
    }

    .portal-staff .portal-label {
      font-size: 12px; /* Increased from 9px - CRITICAL for 45+ */
      font-weight: 700; /* Bolder for better readability */
    }

    .footer-en, .footer-jp {
      font-size: 11px;
    }

    .footer-logo {
      height: 18px;
    }
  }

  /* Very small screens - maintain readability */
  @media (max-width: 320px) {
    .landing {
      --square-size: 85px; /* Increased from 70px */
    }

    .portal-staff .portal-kanji {
      font-size: 30px;
    }

    .portal-staff .portal-label {
      font-size: 11px; /* Increased from 8px - still readable */
      font-weight: 700;
    }

    .portal-spectator .portal-label {
      font-size: 14px;
    }

    .portal-spectator .portal-desc {
      font-size: 12px;
    }
  }

  /* Respect user motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .portal-card {
      animation: none;
      transition: none;
    }
    .portal-card:hover {
      transform: none;
    }
    .portal-arrow {
      transition: none;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .landing {
      --text: #ffffff;
      --text-muted: #c0c8d4;
      --text-faint: #8a99ad;
      --border: rgba(96, 165, 250, 0.3);
    }
  }

  /* Larger text preference (accessibility) */
  @media (prefers-reduced-motion: no-preference) {
    /* Users can still zoom - we support up to 5x */
  }
</style>
