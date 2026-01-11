<script lang="ts">
  import { cn } from '$lib/utils';
  
  // shadcn components
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  import {
    LayoutDashboard, Users, FolderOpen, Trophy, Swords, Calendar,
    Database, Trash2, TrendingUp, Clock, CheckCircle2, Play,
    ChevronRight, Zap, Activity
  } from '@lucide/svelte';

  // Props (Svelte 5 syntax)
  let {
    loading = false,
    members = [],
    groups = [],
    tournaments = [],
    activeTournament = null,
    completedMatches = [],
    matches = [],
    participants = [],
    progressPercent = 0,
    onSeedDemoData = () => {},
    onClearDemoData = () => {},
    onNavigateToTab = (tab: string) => {},
    seeding = false,
  }: {
    loading?: boolean;
    members?: any[];
    groups?: any[];
    tournaments?: any[];
    activeTournament?: any;
    completedMatches?: any[];
    matches?: any[];
    participants?: any[];
    progressPercent?: number;
    onSeedDemoData?: () => void;
    onClearDemoData?: () => void;
    onNavigateToTab?: (tab: string) => void;
    seeding?: boolean;
  } = $props();

  // Derived stats
  let completedTournaments = $derived(tournaments.filter(t => t.status === 'completed').length);
  let totalMatches = $derived(tournaments.reduce((acc, t) => acc + (t.matchCount || 0), 0));
  let activeMembers = $derived(members.filter(m => !m.archived).length);
</script>

{#if loading}
  <!-- Loading State -->
  <div class="space-y-6">
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-6">
      <div class="px-4 py-3">
        <Skeleton class="h-7 w-32" />
      </div>
    </div>
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {#each Array(4) as _}
        <Skeleton class="h-28 rounded-xl" />
      {/each}
    </div>
    <Skeleton class="h-48 rounded-xl" />
  </div>
{:else}
  <!-- Top Bar -->
  <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-6">
    <div class="px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">Dashboard</h2>
        <Badge variant="outline" class="border-emerald-500/50 text-emerald-500">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
          Online
        </Badge>
      </div>
      <div class="flex items-center gap-2">
        {#if activeTournament}
          <Button size="sm" variant="default" class="bg-emerald-600 hover:bg-emerald-700" onclick={() => onNavigateToTab('tournament')}>
            <Play class="w-4 h-4 mr-1" />
            Go to Live Tournament
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
    <!-- Members -->
    <button 
      class="group rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
      onclick={() => onNavigateToTab('roster')}
    >
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users class="w-5 h-5 text-primary" />
        </div>
        <ChevronRight class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div class="text-3xl font-bold text-primary">{activeMembers}</div>
      <div class="text-sm text-muted-foreground">Active Members</div>
      {#if members.length !== activeMembers}
        <div class="text-xs text-muted-foreground/60 mt-1">{members.length - activeMembers} archived</div>
      {/if}
    </button>

    <!-- Groups -->
    <button 
      class="group rounded-xl border border-border bg-card p-4 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer"
      onclick={() => onNavigateToTab('roster')}
    >
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <FolderOpen class="w-5 h-5 text-blue-500" />
        </div>
        <ChevronRight class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div class="text-3xl font-bold text-blue-400">{groups.length}</div>
      <div class="text-sm text-muted-foreground">Groups</div>
    </button>

    <!-- Tournaments -->
    <button 
      class="group rounded-xl border border-border bg-card p-4 text-left hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer"
      onclick={() => onNavigateToTab('tournament')}
    >
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Trophy class="w-5 h-5 text-amber-500" />
        </div>
        <ChevronRight class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div class="text-3xl font-bold text-amber-400">{tournaments.length}</div>
      <div class="text-sm text-muted-foreground">Tournaments</div>
      {#if completedTournaments > 0}
        <div class="text-xs text-muted-foreground/60 mt-1">{completedTournaments} completed</div>
      {/if}
    </button>

    <!-- Results/History -->
    <button 
      class="group rounded-xl border border-border bg-card p-4 text-left hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer"
      onclick={() => onNavigateToTab('results')}
    >
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <TrendingUp class="w-5 h-5 text-violet-500" />
        </div>
        <ChevronRight class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div class="text-3xl font-bold text-violet-400">{completedTournaments}</div>
      <div class="text-sm text-muted-foreground">History</div>
    </button>
  </div>

  <!-- Active Tournament Card -->
  {#if activeTournament}
    <Card.Root class="mb-6 border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden">
      <Card.Content class="p-0">
        <div class="flex flex-col md:flex-row">
          <!-- Left: Tournament Info -->
          <div class="flex-1 p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Activity class="w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-lg text-emerald-400">{activeTournament.name}</h3>
                  <Badge variant="destructive" class="animate-pulse text-xs">LIVE</Badge>
                </div>
                <div class="flex items-center gap-3 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5" />
                    {activeTournament.date}
                  </span>
                  <span class="flex items-center gap-1">
                    <Users class="w-3.5 h-3.5" />
                    {participants.length} participants
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Progress -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Match Progress</span>
                <span class="font-semibold text-emerald-400">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} class="h-2.5 bg-emerald-500/20" />
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedMatches.length} completed</span>
                <span>{matches.length - completedMatches.length} remaining</span>
              </div>
            </div>
          </div>
          
          <!-- Right: Quick Stats -->
          <div class="flex md:flex-col border-t md:border-t-0 md:border-l border-emerald-500/20 bg-emerald-500/5">
            <div class="flex-1 p-4 flex flex-col items-center justify-center border-r md:border-r-0 md:border-b border-emerald-500/20">
              <Swords class="w-5 h-5 text-emerald-400 mb-1" />
              <div class="text-2xl font-bold">{matches.length}</div>
              <div class="text-xs text-muted-foreground">Total Matches</div>
            </div>
            <div class="flex-1 p-4 flex flex-col items-center justify-center">
              <CheckCircle2 class="w-5 h-5 text-emerald-400 mb-1" />
              <div class="text-2xl font-bold">{completedMatches.length}</div>
              <div class="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- No Active Tournament -->
    <Card.Root class="mb-6 border-dashed border-2 border-border/50">
      <Card.Content class="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center">
            <Trophy class="w-7 h-7 text-muted-foreground/50" />
          </div>
          <div>
            <h3 class="font-semibold text-lg">No Active Tournament</h3>
            <p class="text-sm text-muted-foreground">Create or start a tournament to see live progress here.</p>
          </div>
        </div>
        <Button onclick={() => onNavigateToTab('tournament')} class="shrink-0">
          <Trophy class="w-4 h-4 mr-2" />
          Go to Tournaments
        </Button>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Quick Actions & Demo Data -->
  <div class="grid gap-4 md:grid-cols-2">
    <!-- Quick Actions -->
    <Card.Root>
      <Card.Header class="pb-3">
        <Card.Title class="text-base flex items-center gap-2">
          <Zap class="w-4 h-4 text-amber-500" />
          Quick Actions
        </Card.Title>
      </Card.Header>
      <Card.Content class="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" class="justify-start" onclick={() => onNavigateToTab('roster')}>
          <Users class="w-4 h-4 mr-2 text-primary" />
          Add Member
        </Button>
        <Button variant="outline" size="sm" class="justify-start" onclick={() => onNavigateToTab('roster')}>
          <FolderOpen class="w-4 h-4 mr-2 text-blue-500" />
          Add Group
        </Button>
        <Button variant="outline" size="sm" class="justify-start" onclick={() => onNavigateToTab('tournament')}>
          <Trophy class="w-4 h-4 mr-2 text-amber-500" />
          New Tournament
        </Button>
        <Button variant="outline" size="sm" class="justify-start" onclick={() => onNavigateToTab('results')}>
          <TrendingUp class="w-4 h-4 mr-2 text-violet-500" />
          View History
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Demo Data -->
    <Card.Root class="border-dashed border-violet-500/30">
      <Card.Header class="pb-3">
        <Card.Title class="text-base flex items-center gap-2">
          <Database class="w-4 h-4 text-violet-500" />
          Demo Data
        </Card.Title>
        <Card.Description class="text-xs">
          Seed sample tournaments, members, and match results for testing.
        </Card.Description>
      </Card.Header>
      <Card.Content class="flex gap-2">
        <Button 
          onclick={onSeedDemoData} 
          variant="outline" 
          size="sm"
          disabled={seeding}
          class="flex-1 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-400"
        >
          <Database class="mr-2 h-4 w-4" />
          {seeding ? 'Seeding...' : 'Seed Data'}
        </Button>
        <Button 
          onclick={onClearDemoData} 
          variant="outline" 
          size="sm"
          disabled={seeding}
          class="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Clear Data
        </Button>
      </Card.Content>
    </Card.Root>
  </div>
{/if}
