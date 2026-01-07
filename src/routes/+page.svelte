<script lang="ts">
  const shiaijoLogo = '/shiaijologo.png';
  
  const spectator = { id: 'spectator', href: '/spectator', kanji: '観', label: 'SPECTATOR', desc: 'Watch live tournament matches' };
  
  const staffPortals = [
    { id: 'admin', href: '/admin', kanji: '管', label: 'ADMIN' },
    { id: 'courtkeeper', href: '/courtkeeper', kanji: '審', label: 'COURT' },
    { id: 'volunteer', href: '/volunteer', kanji: '奉', label: 'VOLUNTEER' },
  ];
</script>

<svelte:head>
  <title>Shiaijo - Kendo Tournament Management</title>
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
      <div class="subtitle">Tournament Manager</div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Right side - Portals -->
    <div class="portals-section">
      <div class="section-label">PORTALS</div>
      
      <!-- Spectator - Full width, compact -->
      <a href={spectator.href} class="portal-card portal-spectator">
        <span class="portal-kanji">{spectator.kanji}</span>
        <div class="portal-text">
          <span class="portal-label">{spectator.label}</span>
          <span class="portal-desc">{spectator.desc}</span>
        </div>
        <span class="portal-arrow">→</span>
      </a>

      <!-- Staff portals - 3 square buttons -->
      <div class="staff-row">
        {#each staffPortals as portal, i}
          <a href={portal.href} class="portal-card portal-staff" style="--delay: {0.1 + i * 0.05}s">
            <span class="portal-kanji">{portal.kanji}</span>
            <span class="portal-label">{portal.label}</span>
          </a>
        {/each}
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <a href="https://renbudojo.com" target="_blank" rel="noopener noreferrer" class="footer-link">
      <span class="footer-jp">練武道場</span>
      <span class="footer-dot">·</span>
      <span class="footer-en">RENBU DOJO</span>
    </a>
  </footer>
</div>

<style>
  /* Theme variables */
  .landing {
    --bg: #0c0b09;
    --text: #e0e7ff;
    --text-muted: #94a3b8;
    --text-faint: #475569;
    --card-bg: rgba(59, 130, 246, 0.06);
    --card-bg-hover: rgba(59, 130, 246, 0.12);
    --border: rgba(59, 130, 246, 0.12);
    --border-hover: rgba(59, 130, 246, 0.20);
    --divider: rgba(59, 130, 246, 0.08);
    --shadow: 0 20px 50px rgba(0,0,0,0.35);
    --glow: rgba(59, 130, 246, 0.3);
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
    gap: 48px;
    max-width: 680px;
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
    padding-right: 32px;
  }

  .logo-wrapper {
    margin-bottom: 14px;
  }

  .logo {
    width: 150px;
    height: auto;
    filter: drop-shadow(0 0 30px var(--glow));
  }

  .brand-name {
    font-size: 13px;
    letter-spacing: 0.35em;
    color: var(--text);
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 9px;
    letter-spacing: 0.15em;
    color: var(--text-faint);
  }

  /* Divider */
  .divider {
    width: 1px;
    height: 180px;
    background: var(--divider);
    flex-shrink: 0;
  }

  /* Right side - Portals */
  .portals-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 320px;
  }

  .section-label {
    font-size: 9px;
    letter-spacing: 0.3em;
    color: var(--text-faint);
    text-transform: uppercase;
    margin-left: 2px;
    margin-bottom: 2px;
  }

  /* Portal cards base */
  .portal-card {
    display: flex;
    align-items: center;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeIn 0.5s ease-out backwards;
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
    font-size: 10px;
    color: var(--text-muted);
  }

  .portal-arrow {
    font-size: 16px;
    color: var(--text-faint);
    transition: transform 0.3s ease;
    margin-left: auto;
  }

  .portal-card:hover .portal-arrow {
    transform: translateX(3px);
  }

  /* Spectator - Compact full width */
  .portal-spectator {
    padding: 14px 18px;
    gap: 14px;
    background: linear-gradient(120deg, rgba(59,130,246,0.08), rgba(99,102,241,0.06));
  }

  .portal-spectator .portal-kanji {
    font-size: 36px;
  }

  .portal-spectator .portal-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .portal-spectator .portal-label {
    font-size: 12px;
  }

  /* Staff row - 3 square buttons */
  .staff-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .portal-staff {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    aspect-ratio: 1 / 1;
    padding: 12px 8px;
    animation-delay: var(--delay, 0s);
  }

  .portal-staff .portal-kanji {
    font-size: 32px;
  }

  .portal-staff .portal-label {
    font-size: 9px;
    letter-spacing: 0.1em;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .footer-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    transition: opacity 0.3s ease;
  }

  .footer-link:hover {
    opacity: 0.8;
  }

  .footer-jp {
    font-family: 'SicYubi-FudeGyosho', serif;
    font-size: 11px;
    color: var(--text-faint);
    letter-spacing: 0.15em;
  }

  .footer-dot {
    color: var(--text-faint);
    opacity: 0.4;
  }

  .footer-en {
    font-size: 9px;
    color: var(--text-faint);
    letter-spacing: 0.15em;
  }

  /* Animation */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ========== RESPONSIVE ========== */
  
  /* Tablet - Stack vertically */
  @media (max-width: 700px) {
    .container {
      flex-direction: column;
      gap: 28px;
    }

    .title-section {
      padding-right: 0;
    }

    .logo {
      width: 130px;
    }

    .divider {
      width: 50px;
      height: 1px;
    }

    .portals-section {
      width: 100%;
      max-width: 300px;
    }

    .portal-spectator {
      padding: 12px 16px;
      gap: 12px;
    }

    .portal-spectator .portal-kanji {
      font-size: 32px;
    }

    .portal-spectator .portal-label {
      font-size: 11px;
    }

    .portal-spectator .portal-desc {
      font-size: 9px;
    }

    .staff-row {
      gap: 8px;
    }

    .portal-staff .portal-kanji {
      font-size: 28px;
    }

    .portal-staff .portal-label {
      font-size: 8px;
    }
  }

  /* Small mobile */
  @media (max-width: 400px) {
    .landing {
      padding: 32px 20px;
    }

    .logo {
      width: 110px;
    }

    .brand-name {
      font-size: 11px;
    }

    .portals-section {
      max-width: 260px;
      gap: 8px;
    }

    .portal-spectator {
      padding: 10px 14px;
      gap: 10px;
      border-radius: 10px;
    }

    .portal-spectator .portal-kanji {
      font-size: 28px;
    }

    .portal-spectator .portal-label {
      font-size: 10px;
    }

    .staff-row {
      gap: 6px;
    }

    .portal-staff {
      border-radius: 10px;
      gap: 4px;
    }

    .portal-staff .portal-kanji {
      font-size: 24px;
    }

    .portal-staff .portal-label {
      font-size: 7px;
      letter-spacing: 0.08em;
    }
  }
</style>
