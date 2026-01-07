<script lang="ts">
  import { Progress } from '$lib/components/ui/progress';
  import { Skeleton } from '$lib/components/ui/skeleton';

  export let loading = false;
  export let members: any[] = [];
  export let groups: any[] = [];
  export let tournaments: any[] = [];
  export let activeTournament: any = null;
  export let completedMatches: any[] = [];
  export let matches: any[] = [];
  export let participants: any[] = [];
  export let progressPercent = 0;
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
  <!-- Top Bar - Design 2 -->
  <div class="top-bar sticky top-0 z-10 -mx-4 sm:-mx-6 px-5 py-4 mb-5" style="background: var(--surface); border-bottom: 1px solid var(--border-subtle);">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-[0.6rem] uppercase tracking-widest mb-1" style="color: var(--text-faint);">Admin</div>
        <h1 class="font-jp text-lg font-bold" style="color: var(--text-primary);">Dashboard</h1>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg" style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.2);">
          <span class="w-2 h-2 rounded-full" style="background: var(--success);"></span>
          <span class="text-xs" style="color: var(--success);">All Systems Online</span>
        </div>
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
    <div class="rounded-xl border border-green-500/50 bg-green-900/20 p-4">
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
{/if}
