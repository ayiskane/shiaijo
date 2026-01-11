<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { api } from '../../convex/_generated/api';
  
  // Direct imports for tree-shaking
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Users from '@lucide/svelte/icons/users';
  import Globe from '@lucide/svelte/icons/globe';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Activity from '@lucide/svelte/icons/activity';
  import History from '@lucide/svelte/icons/history';
  import Settings from '@lucide/svelte/icons/settings';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import Eye from '@lucide/svelte/icons/eye';
  import Heart from '@lucide/svelte/icons/heart';

  // State
  let sidebarCollapsed = $state(false);
  let activeTab = $state('dashboard');

  // Data
  const tournamentsQuery = useQuery(api.tournaments.list, {});
  const membersQuery = useQuery(api.members.list, {});
  
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress'));

  // Breadcrumb
  const breadcrumbMap: Record<string, string[]> = {
    'dashboard': ['Admin', 'Dashboard'],
    'members': ['Admin', 'Roster', 'Members'],
    'guests': ['Admin', 'Roster', 'Guests'],
    'tournament': ['Admin', 'Shiai', 'Tournament'],
    'current-result': ['Admin', 'Shiai', 'Current Result'],
    'history': ['Admin', 'Shiai', 'History'],
    'settings': ['Admin', 'Admin', 'Settings'],
    'volunteers': ['Admin', 'Admin', 'Volunteers'],
  };

  let breadcrumb = $derived(breadcrumbMap[activeTab] ?? ['Admin', 'Dashboard']);

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }
</script>

<svelte:head>
  <title>Admin Portal - Shiaijo</title>
</svelte:head>

<div class="admin-layout" class:collapsed={sidebarCollapsed}>
  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="/" class="sidebar-logo">
        <img src="/shiaijologo.png" alt="Shiaijo" class="logo-img" />
        <span class="logo-text">試合場</span>
      </a>
      <button class="fab-collapse" onclick={toggleSidebar} aria-label="Toggle sidebar">
        {#if sidebarCollapsed}
          <PanelLeft size={14} />
        {:else}
          <PanelLeftClose size={14} />
        {/if}
      </button>
    </div>

    <nav class="sidebar-nav">
      <!-- Dashboard -->
      <div class="nav-group">
        <button class="nav-item" class:active={activeTab === 'dashboard'} onclick={() => activeTab = 'dashboard'}>
          <LayoutDashboard size={20} />
          <span class="nav-text">Dashboard</span>
        </button>
      </div>

      <!-- Roster -->
      <div class="nav-group">
        <div class="nav-label">Roster</div>
        <button class="nav-item" class:active={activeTab === 'members'} onclick={() => activeTab = 'members'}>
          <Users size={20} />
          <span class="nav-text">Members</span>
        </button>
        <button class="nav-item" class:active={activeTab === 'guests'} onclick={() => activeTab = 'guests'}>
          <Globe size={20} />
          <span class="nav-text">Guests</span>
        </button>
      </div>

      <!-- Shiai -->
      <div class="nav-group">
        <div class="nav-label">Shiai</div>
        <button class="nav-item" class:active={activeTab === 'tournament'} onclick={() => activeTab = 'tournament'}>
          <Trophy size={20} />
          <span class="nav-text">Tournament</span>
        </button>
        {#if activeTournament}
          <button class="nav-item live" class:active={activeTab === 'current-result'} onclick={() => activeTab = 'current-result'}>
            <Activity size={20} />
            <span class="nav-text">Current Result</span>
            <span class="live-dot"></span>
          </button>
        {/if}
        <button class="nav-item" class:active={activeTab === 'history'} onclick={() => activeTab = 'history'}>
          <History size={20} />
          <span class="nav-text">History</span>
        </button>
      </div>

      <!-- Admin -->
      <div class="nav-group">
        <div class="nav-label">Admin</div>
        <button class="nav-item" class:active={activeTab === 'settings'} onclick={() => activeTab = 'settings'}>
          <Settings size={20} />
          <span class="nav-text">Settings</span>
        </button>
        <button class="nav-item" class:active={activeTab === 'volunteers'} onclick={() => activeTab = 'volunteers'}>
          <UserPlus size={20} />
          <span class="nav-text">Volunteers</span>
        </button>
      </div>
    </nav>

    <!-- Portal Links -->
    <div class="sidebar-footer">
      <div class="nav-label">Portals</div>
      <a href="/courtkeeper" class="portal-link court">
        <LayoutGrid size={20} />
        <span class="nav-text">Court / Scorekeeper</span>
      </a>
      <a href="/spectator" class="portal-link spectator">
        <Eye size={20} />
        <span class="nav-text">Spectator</span>
      </a>
      <a href="/volunteer" class="portal-link volunteer">
        <Heart size={20} />
        <span class="nav-text">Volunteer</span>
      </a>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="main-area">
    <header class="header">
      <nav class="breadcrumb">
        {#each breadcrumb as crumb, i}
          {#if i > 0}<span class="sep">/</span>{/if}
          <span class:active={i === breadcrumb.length - 1}>{crumb}</span>
        {/each}
      </nav>
      <button class="user-btn">
        <span class="user-avatar">A</span>
        <span class="user-name">Admin</span>
      </button>
    </header>

    <div class="content">
      <div class="placeholder">{activeTab} content</div>
    </div>
  </main>
</div>

<style>
  .admin-layout {
    --sidebar-w: 250px;
    --sidebar-collapsed: 68px;
    --header-h: 64px;
    --bg: #09090b;
    --bg-sidebar: #0a0a0c;
    --bg-header: #0c0c0e;
    --bg-hover: #18181b;
    --bg-active: #1c1c20;
    --border: #1f1f23;
    --text: #fafafa;
    --text-secondary: #b4b4bb;
    --text-muted: #8a8a94;
    --accent: #818cf8;
    --accent-glow: rgba(129, 140, 248, 0.12);
    --live: #22c55e;
    --transition: 0.2s ease;
    
    display: flex;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Titillium Web', sans-serif;
    font-size: 16px;
  }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--bg-sidebar);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 10px;
    transition: width var(--transition);
    z-index: 100;
  }

  .collapsed .sidebar { width: var(--sidebar-collapsed); }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 6px 6px 8px;
    margin-bottom: 12px;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo-img { width: 36px; height: 36px; flex-shrink: 0; }

  .logo-text {
    font-family: 'SicYubi-FudeGyosho', serif;
    font-size: 20px;
    color: var(--text);
    letter-spacing: 0.1em;
    transition: opacity var(--transition);
  }

  .collapsed .logo-text { opacity: 0; width: 0; overflow: hidden; }

  .fab-collapse {
    width: 30px;
    height: 30px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .fab-collapse:hover { background: var(--bg-active); color: var(--text-secondary); }

  /* Navigation */
  .sidebar-nav { flex: 1; overflow-y: auto; }

  .nav-group { margin-bottom: 8px; }

  .nav-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text-muted);
    padding: 6px 12px 4px;
    transition: opacity var(--transition);
  }

  .collapsed .nav-label { opacity: 0; height: 0; padding: 0; overflow: hidden; }

  .nav-item, .portal-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    min-height: 44px;
    font: inherit;
    font-size: 15px;
    text-align: left;
    text-decoration: none;
    transition: all var(--transition);
  }

  .collapsed .nav-item, .collapsed .portal-link {
    justify-content: center;
    padding: 10px;
  }

  .nav-item:hover, .portal-link:hover { background: var(--bg-hover); color: var(--text); }

  .nav-item.active {
    background: var(--accent-glow);
    color: var(--accent);
    box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.25);
  }

  .nav-text { transition: opacity var(--transition); }
  .collapsed .nav-text { opacity: 0; width: 0; overflow: hidden; }

  .nav-badge {
    margin-left: auto;
    background: var(--accent);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 8px;
  }

  .collapsed .nav-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 1px 5px;
    font-size: 10px;
  }

  /* Live indicator */
  .nav-item.live { background: rgba(34, 197, 94, 0.15); color: var(--live); }
  .nav-item.live:hover { background: rgba(34, 197, 94, 0.2); }

  .live-dot {
    width: 8px;
    height: 8px;
    background: var(--live);
    border-radius: 50%;
    margin-left: auto;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Footer */
  .sidebar-footer {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  .portal-link.court:hover { color: #60a5fa; }
  .portal-link.spectator:hover { color: #34d399; }
  .portal-link.volunteer:hover { color: #f472b6; }

  /* Main Area */
  .main-area {
    flex: 1;
    margin-left: var(--sidebar-w);
    display: flex;
    flex-direction: column;
    transition: margin-left var(--transition);
  }

  .collapsed .main-area { margin-left: var(--sidebar-collapsed); }

  .header {
    height: var(--header-h);
    background: var(--bg-header);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
  }

  .breadcrumb span { color: var(--text-muted); padding: 8px 12px; border-radius: 8px; }
  .breadcrumb span.active { background: var(--bg-active); color: var(--text); font-weight: 600; }
  .breadcrumb .sep { color: var(--border); padding: 0; }

  .user-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 6px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    font: inherit;
  }

  .user-btn:hover { background: var(--bg-hover); border-color: var(--border); }

  .user-avatar {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
  }

  .user-name { font-size: 15px; font-weight: 600; }

  .content { flex: 1; padding: 24px; }

  .placeholder {
    background: linear-gradient(135deg, var(--bg-sidebar), var(--bg-header));
    border: 2px dashed var(--border);
    border-radius: 12px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 16px;
    text-transform: capitalize;
  }

  /* Focus */
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    *, .live-dot { transition: none !important; animation: none !important; }
  }

  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .main-area { margin-left: 0; }
    .user-name { display: none; }
  }
</style>
