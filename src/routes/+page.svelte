<script lang="ts">
  let isDark = $state(true);
  
  const spectator = { id: 'spectator', href: '/spectator', kanji: '観', label: 'Spectator', desc: 'Watch live tournament matches' };
  
  const staffPortals = [
    { id: 'admin', href: '/admin', kanji: '管', label: 'Admin', desc: 'Manage' },
    { id: 'courtkeeper', href: '/courtkeeper', kanji: '審', label: 'Courtkeeper', desc: 'Score' },
    { id: 'volunteer', href: '/volunteer', kanji: '奉', label: 'Volunteer', desc: 'Track' },
  ];
</script>

<svelte:head>
  <title>Shiaijo - Kendo Tournament Management</title>
</svelte:head>

<div class="landing" class:dark={isDark}>
  <!-- Texture overlay -->
  <div class="texture"></div>

  <!-- Theme toggle -->
  <button class="theme-toggle" onclick={() => isDark = !isDark}>
    {isDark ? '◐' : '◑'}
  </button>

  <main class="container">
    <!-- Left side - Logo & Title -->
    <div class="title-section">
      <div class="subtitle">TOURNAMENT SYSTEM</div>
      
      <div class="logo-wrapper">
        <img src="/shiaijologo.png" alt="Shiaijo" class="logo" />
      </div>
      
      <div class="seal">
        <span class="seal-kanji">道</span>
      </div>
      
      <div class="brand-name">SHIAIJO</div>
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
      <div class="staff-label">Staff Portals</div>

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
  /* Theme variables */
  .landing {
    /* Light theme */
    --bg: #f5f2ea;
    --bg-alt: #ebe7dc;
    --text: #1a1a1a;
    --text-muted: #5c5245;
    --text-faint: #8a8073;
    --accent: #c43c3c;
    --card-bg: rgba(255,255,255,0.6);
    --card-bg-hover: rgba(255,255,255,0.9);
    --border: rgba(100,80,60,0.1);
    --border-hover: rgba(100,80,60,0.25);
    --divider: rgba(100,80,60,0.08);
    --shadow: 0 20px 50px rgba(100,80,60,0.12);
  }

  .landing.dark {
    /* Dark theme */
    --bg: #0c0b09;
    --bg-alt: #141210;
    --text: #ede8de;
    --text-muted: #8f8475;
    --text-faint: #4d4840;
    --accent: #dc4c4c;
    --card-bg: rgba(255,255,255,0.03);
    --card-bg-hover: rgba(255,255,255,0.08);
    --border: rgba(255,255,255,0.05);
    --border-hover: rgba(255,255,255,0.12);
    --divider: rgba(255,255,255,0.04);
    --shadow: 0 20px 50px rgba(0,0,0,0.35);
  }

  .landing {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-default, 'Inter', system-ui, sans-serif);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    position: relative;
    transition: background 0.5s ease;
  }

  .texture {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.035;
    pointer-events: none;
  }

  .landing.dark .texture {
    opacity: 0.02;
  }

  .theme-toggle {
    position: absolute;
    top: 24px;
    right: 24px;
    width: 42px;
    height: 42px;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s ease;
  }

  .theme-toggle:hover {
    background: var(--card-bg-hover);
    border-color: var(--border-hover);
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

  .subtitle {
    font-size: 9px;
    letter-spacing: 0.5em;
    color: var(--text-faint);
    margin-bottom: 20px;
    text-transform: uppercase;
  }

  .logo-wrapper {
    position: relative;
    margin-bottom: 20px;
  }

  .logo {
    width: 120px;
    height: auto;
    filter: drop-shadow(0 0 30px rgba(220, 76, 76, 0.2));
    transition: filter 0.3s ease;
  }

  .landing.dark .logo {
    filter: drop-shadow(0 0 30px rgba(220, 76, 76, 0.3));
  }

  .seal {
    width: 36px;
    height: 36px;
    border: 2px solid var(--accent);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(8deg);
    margin-bottom: 16px;
  }

  .seal-kanji {
    font-family: var(--font-jp, 'Shiaijo JP', serif);
    color: var(--accent);
    font-size: 15px;
    font-weight: 700;
  }

  .brand-name {
    font-size: 11px;
    letter-spacing: 0.4em;
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
    font-family: var(--font-jp, 'Shiaijo JP', serif);
    font-size: 42px;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
    flex-shrink: 0;
  }

  .portal-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .portal-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.02em;
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
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
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
    font-family: var(--font-jp, 'Shiaijo JP', serif);
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
