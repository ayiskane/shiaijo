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
      
      <!-- Spectator - Full width, highlighted -->
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
    
    /* Spectator highlight color - brighter blue */
    --spectator-bg: rgba(59, 130, 246, 0.15);
    --spectator-bg-hover: rgba(59, 130, 246, 0.25);
    --spectator-border: rgba(96, 165, 250, 0.3);
    --spectator-border-hover: rgba(96, 165, 250, 0.5);
    
    /* Square button size */
    --square-size: 100px;
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
    gap: 50px;
    max-width: 720px;
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
    font-size: 14px;
    letter-spacing: 0.35em;
    color: var(--text);
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 10px;
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
    gap: 12px;
    /* Width = 3 squares + 2 gaps */
    width: calc(var(--square-size) * 3 + 12px * 2);
  }

  .section-label {
    font-size: 10px;
    letter-spacing: 0.3em;
    color: var(--text-faint);
    text-transform: uppercase;
    margin-left: 2px;
    margin-bottom: 4px;
  }

  /* Portal cards base */
  .portal-card {
    display: flex;
    align-items: center;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
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
    padding: 16px 20px;
    gap: 14px;
    height: var(--square-size);
    width: 100%;
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
    font-size: 40px;
    filter: drop-shadow(0 0 16px rgba(96, 165, 250, 0.25));
  }

  .portal-spectator .portal-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .portal-spectator .portal-label {
    font-size: 15px;
    color: #93c5fd;
  }

  .portal-spectator .portal-desc {
    font-size: 12px;
  }

  .portal-spectator .portal-arrow {
    font-size: 18px;
    color: #93c5fd;
  }

  /* Staff row - 3 square buttons */
  .staff-row {
    display: grid;
    grid-template-columns: repeat(3, var(--square-size));
    gap: 12px;
  }

  .portal-staff {
    width: var(--square-size);
    height: var(--square-size);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 0;
    animation-delay: var(--delay, 0s);
  }

  .portal-staff .portal-kanji {
    font-size: 40px;
  }

  .portal-staff .portal-label {
    font-size: 11px;
    letter-spacing: 0.12em;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 24px;
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
    font-size: 12px;
    color: var(--text-faint);
    letter-spacing: 0.15em;
  }

  .footer-dot {
    color: var(--text-faint);
    opacity: 0.4;
  }

  .footer-en {
    font-size: 10px;
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
    .landing {
      --square-size: 90px;
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

    .divider {
      width: 60px;
      height: 1px;
    }

    .portals-section {
      width: calc(var(--square-size) * 3 + 10px * 2);
      gap: 10px;
    }

    .portal-spectator {
      padding: 14px 18px;
      gap: 12px;
    }

    .portal-spectator .portal-kanji {
      font-size: 36px;
    }

    .portal-spectator .portal-label {
      font-size: 14px;
    }

    .portal-spectator .portal-desc {
      font-size: 11px;
    }

    .staff-row {
      gap: 10px;
    }

    .portal-staff .portal-kanji {
      font-size: 36px;
    }

    .portal-staff .portal-label {
      font-size: 10px;
    }
  }

  /* Mobile - still comfortable for 45+ */
  @media (max-width: 400px) {
    .landing {
      --square-size: 80px;
      padding: 32px 16px;
    }

    .logo {
      width: 120px;
    }

    .brand-name {
      font-size: 12px;
    }

    .portals-section {
      width: calc(var(--square-size) * 3 + 8px * 2);
      gap: 8px;
    }

    .portal-spectator {
      padding: 12px 16px;
      gap: 10px;
      border-radius: 12px;
    }

    .portal-spectator .portal-kanji {
      font-size: 32px;
    }

    .portal-spectator .portal-label {
      font-size: 13px;
    }

    .portal-spectator .portal-desc {
      font-size: 10px;
    }

    .staff-row {
      gap: 8px;
    }

    .portal-staff {
      border-radius: 12px;
      gap: 6px;
    }

    .portal-staff .portal-kanji {
      font-size: 32px;
    }

    .portal-staff .portal-label {
      font-size: 9px;
    }
  }

  /* Very small screens */
  @media (max-width: 320px) {
    .landing {
      --square-size: 70px;
    }

    .portal-staff .portal-kanji {
      font-size: 28px;
    }

    .portal-staff .portal-label {
      font-size: 8px;
    }
  }
</style>
