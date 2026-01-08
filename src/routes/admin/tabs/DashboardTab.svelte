<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Button } from '$lib/components/ui/button';
  import { Database, Trash2 } from '@lucide/svelte';

  export let loading = false;
  export let members: any[] = [];
  export let groups: any[] = [];
  export let tournaments: any[] = [];
  export let activeTournament: any = null;
  export let completedMatches: any[] = [];
  export let matches: any[] = [];
  export let participants: any[] = [];
  export let progressPercent = 0;
  export let onSeedDemoData: () => void = () => {};
  export let onClearDemoData: () => void = () => {};
  export let seeding = false;
</script>

{#if loading}
  <div class="space-y-4">
    <Skeleton class="h-8 w-48" />
    <div class="grid gap-4 md:grid-cols-3">
      <Skeleton class="h-24" />
      <Skeleton class="h-24" />
      <Skeleton class="h-24" />
    </div>
  </div>
{:else}
  <!-- Top Bar -->
  <div class="top-bar">
    <div class="top-bar-left">
      <span class="top-bar-breadcrumb">Admin</span>
      <span class="top-bar-title">Dashboard</span>
    </div>
    <div class="top-bar-right">
      <div class="top-bar-badge online">
        <span class="w-2 h-2 rounded-full bg-current"></span>
        All Systems Online
      </div>
    </div>
  </div>

  <div class="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="text-2xl sm:text-3xl font-bold text-primary">{members.length}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">Members</div>
    </div>
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="text-2xl sm:text-3xl font-bold text-blue-400">{groups.length}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">Groups</div>
    </div>
    <div class="rounded-xl border border-border bg-card p-4 col-span-2 md:col-span-1">
      <div class="text-2xl sm:text-3xl font-bold text-green-400">{tournaments.length}</div>
      <div class="text-xs sm:text-sm text-muted-foreground">Tournaments</div>
    </div>
  </div>

  {#if activeTournament}
    <div class="rounded-xl border border-green-500/50 bg-green-900/20 p-4 mb-6">
      <div class="mb-2 flex items-center gap-2">
        <span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
        <h3 class="font-bold text-green-400 truncate">Live: {activeTournament.name}</h3>
      </div>
      <div class="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
        <span>📅 {activeTournament.date}</span>
        <span>⚔️ {completedMatches.length}/{matches.length}</span>
        <span>👥 {participants.length}</span>
      </div>
      <div class="mt-3">
        <Progress value={progressPercent} class="h-2" />
        <p class="mt-1 text-xs text-muted-foreground">{progressPercent}% complete</p>
      </div>
    </div>
  {/if}

  <!-- Demo Data Section -->
  <div class="rounded-xl border border-dashed border-violet-500/30 bg-violet-900/10 p-4">
    <div class="flex items-center gap-2 mb-3">
      <Database class="h-4 w-4 text-violet-400" />
      <h3 class="font-semibold text-violet-400">Demo Data</h3>
    </div>
    <p class="text-xs text-muted-foreground mb-4">
      Seed demo tournaments, members, and match results to test the History tab and other features.
    </p>
    <div class="flex flex-wrap gap-2">
      <Button 
        onclick={onSeedDemoData} 
        variant="outline" 
        size="sm"
        disabled={seeding}
        class="border-violet-500/50 text-violet-400 hover:bg-violet-900/20"
      >
        <Database class="mr-2 h-4 w-4" />
        {seeding ? 'Seeding...' : 'Seed Demo Data'}
      </Button>
      <Button 
        onclick={onClearDemoData} 
        variant="outline" 
        size="sm"
        disabled={seeding}
        class="border-red-500/50 text-red-400 hover:bg-red-900/20"
      >
        <Trash2 class="mr-2 h-4 w-4" />
        Clear Demo Data
      </Button>
    </div>
  </div>
{/if}
