<script lang="ts">
  import { page } from '$app/stores';
  import { useQuery } from 'convex-svelte';
  import { api } from '../../convex/_generated/api';
  
  // Icons - direct imports for tree-shaking
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Users from '@lucide/svelte/icons/users';
  import Globe from '@lucide/svelte/icons/globe';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Activity from '@lucide/svelte/icons/activity';
  import History from '@lucide/svelte/icons/history';
  import Settings from '@lucide/svelte/icons/settings';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import Eye from '@lucide/svelte/icons/eye';
  import Heart from '@lucide/svelte/icons/heart';

  // Slot content (runes mode prefers explicit render)
  let { children } = $props();

  // State
  let sidebarCollapsed = $state(false);

  // Data
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress'));

  // Current path for active state
  let currentPath = $derived($page.url.pathname);

  // Navigation items
  type NavItem = {
    href: string;
    label: string;
    icon: any;
    group: string | null;
    live?: boolean;
  };

  const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: null },
    { href: '/admin/members', label: 'Members', icon: Users, group: 'Roster' },
    { href: '/admin/guests', label: 'Guests', icon: Globe, group: 'Roster' },
    { href: '/admin/tournament', label: 'Tournament', icon: Trophy, group: 'Shiai' },
    { href: '/admin/history', label: 'History', icon: History, group: 'Shiai' },
    { href: '/admin/settings', label: 'Settings', icon: Settings, group: 'Admin' },
    { href: '/admin/volunteers', label: 'Volunteers', icon: UserPlus, group: 'Admin' },
  ];

  // Conditionally add Current Result if tournament is active
  let allNavItems = $derived(
    activeTournament 
      ? [...navItems.slice(0, 4), { href: '/admin/current-result', label: 'Current Result', icon: Activity, group: 'Shiai', live: true }, ...navItems.slice(4)]
      : navItems
  );

  const portalLinks = [
    { href: '/courtkeeper', label: 'Court / Scorekeeper', icon: LayoutGrid, accent: 'court' },
    { href: '/spectator', label: 'Spectator', icon: Eye, accent: 'spectator' },
    { href: '/volunteer', label: 'Volunteer', icon: Heart, accent: 'volunteer' },
  ];

  // Group nav items
  function getGroups(items: typeof navItems) {
    const groups: { label: string | null; items: typeof navItems }[] = [];
    let currentGroup: string | null = null;
    
    for (const item of items) {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        groups.push({ label: currentGroup, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }

  let navGroups = $derived(getGroups(allNavItems));

  // Breadcrumb from path
  let breadcrumb = $derived(() => {
    const segments = currentPath.split('/').filter(Boolean);
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '));
  });

  function isActive(href: string) {
    if (href === '/admin') return currentPath === '/admin';
    return currentPath.startsWith(href);
  }
</script>

<div class="admin-layout" class:collapsed={sidebarCollapsed}>
  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="/" class="sidebar-logo">
        <img src="/shiaijologo.png" alt="Shiaijo" class="logo-img" />
        <span class="logo-text">試合場</span>
      </a>
    </div>

    <nav class="sidebar-nav">
      {#each navGroups as group}
        <div class="nav-group">
          {#if group.label}
            <div class="nav-label">{group.label}</div>
          {/if}
          {#each group.items as item}
            {@const Icon = item.icon}
            <a 
              href={item.href} 
              class="nav-item" 
              class:active={isActive(item.href)}
              class:live={item.live}
            >
              <span class="nav-icon"><Icon size={20} /></span>
              <span class="nav-text">{item.label}</span>
              {#if item.live}
                <span class="live-dot"></span>
              {/if}
            </a>
          {/each}
        </div>
      {/each}
    </nav>

    <div class="sidebar-footer">
      <div class="nav-label">Portals</div>
      {#each portalLinks as portal}
        {@const Icon = portal.icon}
        <a href={portal.href} class="portal-link {portal.accent}">
          <span class="nav-icon"><Icon size={20} /></span>
          <span class="nav-text">{portal.label}</span>
        </a>
      {/each}
    </div>
  </aside>

  <!-- Edge Toggle -->
  <button class="edge-toggle" onclick={() => sidebarCollapsed = !sidebarCollapsed} aria-label="Toggle sidebar">
    {#if sidebarCollapsed}
      <ChevronRight size={16} />
    {:else}
      <ChevronLeft size={16} />
    {/if}
  </button>

  <!-- MAIN -->
  <main class="main-area">
    <header class="header">
      <nav class="breadcrumb">
        {#each breadcrumb() as crumb, i}
          {#if i > 0}<span class="sep">/</span>{/if}
          <span class:active={i === breadcrumb().length - 1}>{crumb}</span>
        {/each}
      </nav>
      <button class="user-btn">
        <span class="user-avatar">A</span>
        <span class="user-name">Admin</span>
      </button>
    </header>

    <div class="content">
      {@render children?.()}
    </div>
  </main>
</div>

<style>
  .admin-layout {
    --sidebar-w: 250px;
    --sidebar-collapsed: 64px;
    --header-h: 64px;
    --bg: #09090b;
    --bg-sidebar: #0a0a0c;
    --bg-header: #0c0c0e;
    --bg-hover: #18181b;
    --bg-active: #1c1c20;
    --border: #27272a;
    --text: #fafafa;
    --text-secondary: #b4b4bb;
    --text-muted: #71717a;
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

  .sidebar {
    width: var(--sidebar-w);
    background: var(--bg-sidebar);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    transition: width var(--transition);
    z-index: 100;
    border-right: 1px solid var(--border);
  }

  .collapsed .sidebar { width: var(--sidebar-collapsed); }

  .sidebar-header {
    padding: 12px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    height: 40px;
  }

  .logo-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .logo-text {
    font-family: 'SicYubi-FudeGyosho', serif;
    font-size: 20px;
    color: var(--text);
    letter-spacing: 0.1em;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity var(--transition), width var(--transition);
  }

  .collapsed .logo-text { opacity: 0; width: 0; }

  .edge-toggle {
    position: fixed;
    top: 72px;
    left: var(--sidebar-w);
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    background: var(--bg-sidebar);
    border: 1px solid var(--border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    z-index: 150;
    transition: all var(--transition);
  }

  .edge-toggle:hover {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--accent);
  }

  .collapsed .edge-toggle { left: var(--sidebar-collapsed); }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px;
  }

  .nav-group { margin-bottom: 8px; }

  .nav-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text-muted);
    padding: 8px 8px 4px;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity var(--transition);
  }

  .collapsed .nav-label { opacity: 0; height: 0; padding: 0; }

  .nav-item, .portal-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0;
    border-radius: 10px;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    height: 48px;
    font: inherit;
    font-size: 15px;
    text-align: left;
    text-decoration: none;
    transition: all var(--transition);
  }

  .nav-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-text {
    white-space: nowrap;
    overflow: hidden;
    transition: opacity var(--transition);
  }

  .collapsed .nav-text { opacity: 0; width: 0; }

  .nav-item:hover, .portal-link:hover { background: var(--bg-hover); color: var(--text); }

  .nav-item.active {
    background: var(--accent-glow);
    color: var(--accent);
    box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.25);
  }

  .nav-item.live { background: rgba(34, 197, 94, 0.15); color: var(--live); }
  .nav-item.live:hover { background: rgba(34, 197, 94, 0.2); }

  .live-dot {
    width: 8px;
    height: 8px;
    background: var(--live);
    border-radius: 50%;
    margin-left: auto;
    margin-right: 12px;
    animation: pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  .collapsed .live-dot { display: none; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .sidebar-footer {
    flex-shrink: 0;
    padding: 8px;
    border-top: 1px solid var(--border);
  }

  .portal-link.court:hover { color: #60a5fa; }
  .portal-link.spectator:hover { color: #34d399; }
  .portal-link.volunteer:hover { color: #f472b6; }

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

  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    *, .live-dot { transition: none !important; animation: none !important; }
  }

  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .main-area { margin-left: 0; }
    .user-name { display: none; }
    .edge-toggle { display: none; }
  }
</style>


