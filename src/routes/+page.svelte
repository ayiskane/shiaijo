<script lang="ts">
  const spectator = { id: 'spectator', href: '/spectator', kanji: '観', label: 'SPECTATOR', desc: 'Watch live tournament matches' };
  
  const staffPortals = [
    { id: 'admin', href: '/admin', kanji: '管', label: 'ADMIN' },
    { id: 'courtkeeper', href: '/courtkeeper', kanji: '審', label: 'COURTKEEPER' },
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
        <img src="/shiaijologo.png" alt="Shiaijo" class="logo" />
      </div>
      
      <div class="brand-name">S H I A I J O</div>
      <div class="subtitle">Tournament Manager</div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Right side - Portals -->
    <div class="portals-section">
      <!-- Spectator - Wide card -->
      <a href={spectator.href} class="portal-card portal-wide">
        <span class="portal-kanji">{spectator.kanji}</span>
        <div class="portal-info">
          <span class="portal-label">{spectator.label}</span>
          <span class="portal-desc">{spectator.desc}</span>
        </div>
        <span class="portal-arrow">→</span>
      </a>

      <!-- Staff label -->
      <div class="staff-label">STAFF PORTALS</div>

      <!-- Staff portals row -->
      <div class="staff-row">
        {#each staffPortals as portal}
          <a href={portal.href} class="portal-card portal-staff">
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
  /* Renbu 練武 Theme - Warm amber from dojo logo */
  .landing {
    --bg: #0c0b09;
    --bg-alt: #141210;
    --text: #fef3c7;
    --text-muted: #a8a29e;
    --text-faint: #57534e;
    --accent: #d97706;
    --accent-light: #f59e0b;
    --card-bg: rgba(217, 119, 6, 0.06);
    --card-bg-hover: rgba(217, 119, 6, 0.12);
    --border: rgba(217, 119, 6, 0.12);
    --border-hover: rgba(217, 119, 6, 0.20);
    --divider: rgba(217, 119, 6, 0.08);
    --shadow: 0 20px 50px rgba(0,0,0,0.35);
    --glow: rgba(217, 119, 6, 0.3);
    --font-jp: 'SicYubi-HyojunGakushu', 'SicYubi-FudeGyosho', serif;
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
    max-width: 750px;
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
    padding-right: 50px;
  }

  .logo-wrapper {
    position: relative;
    margin-bottom: 16px;
  }

  .logo {
    width: 180px;
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
    height: 280px;
    background: var(--divider);
    flex-shrink: 0;
  }

  /* Right side - Portals */
  .portals-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Portal cards */
  .portal-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 16px;
    text-decoration: none;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .portal-card:hover {
    background: var(--card-bg-hover);
    border-color: var(--border-hover);
    transform: translateY(-4px);
    box-shadow: var(--shadow);
  }

  .portal-kanji {
    font-family: 'SicYubi-HyojunGakushu', serif;
    font-size: 42px;
    color: var(--text);
    line-height: 1;
    flex-shrink: 0;
    filter: drop-shadow(0 0 20px rgba(217, 119, 6, 0.15));
  }

  .portal-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .portal-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.1em;
  }

  .portal-desc {
    font-size: 12px;
    color: var(--text-muted);
  }

  .portal-arrow {
    font-size: 20px;
    color: var(--text-faint);
    transition: transform 0.3s ease;
  }

  .portal-card:hover .portal-arrow {
    transform: translateX(4px);
  }

  /* Wide spectator card */
  .portal-wide {
    padding: 28px 28px;
  }

  .portal-wide .portal-kanji {
    font-size: 52px;
  }

  /* Staff section */
  .staff-label {
    font-size: 10px;
    letter-spacing: 0.3em;
    color: var(--text-faint);
    text-transform: uppercase;
    margin: 8px 0 4px 4px;
  }

  .staff-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .portal-staff {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 12px;
    gap: 10px;
  }

  .portal-staff .portal-kanji {
    font-size: 36px;
  }

  .portal-staff .portal-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.15em;
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

  /* Responsive */
  @media (max-width: 700px) {
    .container {
      flex-direction: column;
      gap: 40px;
    }

    .title-section {
      padding-right: 0;
      padding-bottom: 30px;
    }

    .divider {
      width: 80px;
      height: 1px;
    }

    .portals-section {
      width: 100%;
      max-width: 400px;
    }

    .staff-row {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 400px) {
    .logo {
      width: 140px;
    }

    .portal-wide {
      padding: 20px;
    }

    .portal-wide .portal-kanji {
      font-size: 40px;
    }

    .staff-row {
      gap: 8px;
    }

    .portal-staff {
      padding: 16px 8px;
    }

    .portal-staff .portal-kanji {
      font-size: 28px;
    }
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .portal-card {
    animation: fadeIn 0.5s ease-out backwards;
  }

  .portal-wide { animation-delay: 0s; }
  .staff-row .portal-card:nth-child(1) { animation-delay: 0.1s; }
  .staff-row .portal-card:nth-child(2) { animation-delay: 0.15s; }
  .staff-row .portal-card:nth-child(3) { animation-delay: 0.2s; }
</style>





