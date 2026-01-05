<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { convexQuery } from '$lib/convex';
  import { cn } from '$lib/utils';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Progress } from '$lib/components/ui/progress';
  import { Separator } from '$lib/components/ui/separator';
  import * as Card from '$lib/components/ui/card';
  import { Trophy, Clock, Users, Swords, Home, RefreshCw } from 'lucide-svelte';
  
  interface Match { 
    _id: string; player1Id: string; player2Id: string; 
    player1Score: number[]; player2Score: number[]; 
    court: 'A' | 'B' | 'A+B'; status: string; groupId: string; 
    winner?: string; timerDuration: number; timerStartedAt?: number; 
    timerPausedAt?: number; orderIndex: number; 
  }
  interface Member { _id: string; firstName: string; lastName: string; }
  interface Group { _id: string; groupId: string; name: string; }
  interface Tournament { _id: string; name: string; status: string; }
  
  let tournament = $state<Tournament | null>(null);
  let matches = $state<Match[]>([]);
  let members = $state<Member[]>([]);
  let groups = $state<Group[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let currentTime = $state(Date.now());
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let timeInterval: ReturnType<typeof setInterval> | null = null;
  
  let liveMatches = $derived(matches.filter(m => m.status === 'in_progress'));
  let courtALive = $derived(liveMatches.find(m => m.court === 'A' || m.court === 'A+B'));
  let courtBLive = $derived(liveMatches.find(m => m.court === 'B' || (m.court === 'A+B' && !courtALive)));
  let courtAQueue = $derived(matches.filter(m => (m.court === 'A' || m.court === 'A+B') && m.status === 'pending').sort((a, b) => a.orderIndex - b.orderIndex).slice(0, 5));
  let courtBQueue = $derived(matches.filter(m => (m.court === 'B' || m.court === 'A+B') && m.status === 'pending').sort((a, b) => a.orderIndex - b.orderIndex).slice(0, 5));
  let recentResults = $derived(matches.filter(m => m.status === 'completed').slice(-8));
  let completedCount = $derived(matches.filter(m => m.status === 'completed').length);
  let pendingCount = $derived(matches.filter(m => m.status === 'pending').length);
  let totalProgress = $derived(matches.length > 0 ? (completedCount / matches.length) * 100 : 0);
  
  async function loadData() {
    try {
      loading = true; error = null;
      const tournaments = await convexQuery<Tournament[]>('tournaments:list', {});
      tournament = tournaments.find(t => t.status === 'in_progress') || null;
      if (!tournament) { loading = false; return; }
      const [m, mem, g] = await Promise.all([
        convexQuery<Match[]>('matches:getByTournament', { tournamentId: tournament._id }),
        convexQuery<Member[]>('members:list', {}),
        convexQuery<Group[]>('groups:list', {}),
      ]);
      matches = m; members = mem; groups = g;
      loading = false;
    } catch (e: any) { error = e.message; loading = false; }
  }
  
  function startPolling() {
    pollInterval = setInterval(async () => {
      if (!tournament) return;
      try { matches = await convexQuery<Match[]>('matches:getByTournament', { tournamentId: tournament._id }); } catch {}
    }, 1000);
    timeInterval = setInterval(() => currentTime = Date.now(), 100);
  }
  
  function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
    if (timeInterval) clearInterval(timeInterval);
  }
  
  function getMemberName(id: string): string { 
    const m = members.find(mem => mem._id === id); 
    return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'TBD'; 
  }
  function getGroupName(id: string): string { 
    return groups.find(g => g.groupId === id)?.name || id; 
  }
  function getElapsedTime(m: Match): number {
    if (m.timerPausedAt) return m.timerPausedAt;
    if (m.timerStartedAt) return Math.floor((currentTime - m.timerStartedAt) / 1000);
    return 0;
  }
  function formatTime(s: number): string { 
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; 
  }
  
  onMount(() => { loadData().then(startPolling); });
  onDestroy(stopPolling);
</script>

<svelte:head><title>Spectator - Shiaijo</title></svelte:head>

<div class="min-h-screen bg-background text-foreground">
  <!-- Header -->
  <header class="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2">
          <img src="/shiaijologo.png" alt="試合場" class="h-10" />
        </a>
        {#if tournament}
          <Separator orientation="vertical" class="h-6" />
          <span class="text-lg font-bold text-primary">{tournament.name}</span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if tournament}
          <Badge variant="default" class="bg-emerald-500 hover:bg-emerald-500 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            LIVE
          </Badge>
        {/if}
        <Button variant="ghost" size="icon" onclick={loadData}>
          <RefreshCw class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </header>
  
  {#if loading}
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
        <p class="text-muted-foreground">Loading tournament...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-[60vh] flex-col gap-4">
      <p class="text-destructive">{error}</p>
      <Button onclick={loadData}>
        <RefreshCw class="h-4 w-4 mr-2" /> Retry
      </Button>
    </div>
  {:else if !tournament}
    <div class="flex items-center justify-center min-h-[60vh] flex-col gap-4">
      <Swords class="h-16 w-16 text-muted-foreground" />
      <p class="text-muted-foreground text-xl">No active tournament</p>
      <Button variant="outline" asChild>
        <a href="/"><Home class="h-4 w-4 mr-2" /> Back to Home</a>
      </Button>
    </div>
  {:else}
    <main class="max-w-6xl mx-auto p-4 space-y-6">
      <!-- Tournament Progress -->
      <div class="bg-card rounded-xl p-4 border border-border">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-muted-foreground">Tournament Progress</span>
          <span class="text-sm font-medium">{completedCount} / {matches.length} matches</span>
        </div>
        <Progress value={totalProgress} class="h-2" />
      </div>
      
      <!-- Live Matches -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Swords class="h-4 w-4" /> Current Matches
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Court A -->
          <Card.Root class={cn(
            "transition-all",
            courtALive ? "border-amber-500/50 bg-amber-950/20" : ""
          )}>
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <Badge variant="outline" class="bg-amber-500/20 text-amber-400 border-amber-500/50">
                  Court A
                </Badge>
                {#if courtALive}
                  <span class="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    {formatTime(getElapsedTime(courtALive))} / {formatTime(courtALive.timerDuration)}
                  </span>
                {/if}
              </div>
            </Card.Header>
            <Card.Content>
              {#if courtALive}
                <div class="flex items-center justify-between py-2">
                  <div class="flex-1">
                    <p class="font-semibold">{getMemberName(courtALive.player1Id)}</p>
                    <p class="text-xs text-red-400">AKA</p>
                  </div>
                  <div class="text-3xl font-mono font-bold px-4">
                    <span class="text-red-400">{courtALive.player1Score.length}</span>
                    <span class="text-muted-foreground">:</span>
                    <span>{courtALive.player2Score.length}</span>
                  </div>
                  <div class="flex-1 text-right">
                    <p class="font-semibold">{getMemberName(courtALive.player2Id)}</p>
                    <p class="text-xs text-slate-400">SHIRO</p>
                  </div>
                </div>
                <Badge variant="secondary" class="w-full justify-center mt-2">{getGroupName(courtALive.groupId)}</Badge>
              {:else}
                <p class="text-muted-foreground text-center py-6">Waiting for next match...</p>
              {/if}
            </Card.Content>
          </Card.Root>
          
          <!-- Court B -->
          <Card.Root class={cn(
            "transition-all",
            courtBLive ? "border-blue-500/50 bg-blue-950/20" : ""
          )}>
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <Badge variant="outline" class="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  Court B
                </Badge>
                {#if courtBLive}
                  <span class="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    {formatTime(getElapsedTime(courtBLive))} / {formatTime(courtBLive.timerDuration)}
                  </span>
                {/if}
              </div>
            </Card.Header>
            <Card.Content>
              {#if courtBLive}
                <div class="flex items-center justify-between py-2">
                  <div class="flex-1">
                    <p class="font-semibold">{getMemberName(courtBLive.player1Id)}</p>
                    <p class="text-xs text-red-400">AKA</p>
                  </div>
                  <div class="text-3xl font-mono font-bold px-4">
                    <span class="text-red-400">{courtBLive.player1Score.length}</span>
                    <span class="text-muted-foreground">:</span>
                    <span>{courtBLive.player2Score.length}</span>
                  </div>
                  <div class="flex-1 text-right">
                    <p class="font-semibold">{getMemberName(courtBLive.player2Id)}</p>
                    <p class="text-xs text-slate-400">SHIRO</p>
                  </div>
                </div>
                <Badge variant="secondary" class="w-full justify-center mt-2">{getGroupName(courtBLive.groupId)}</Badge>
              {:else}
                <p class="text-muted-foreground text-center py-6">Waiting for next match...</p>
              {/if}
            </Card.Content>
          </Card.Root>
        </div>
      </section>
      
      <!-- Match Queues -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock class="h-4 w-4" /> Up Next
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Court A Queue -->
          <Card.Root class="border-amber-500/30">
            <Card.Header class="pb-2">
              <Card.Title class="text-amber-400 text-sm font-semibold">Court A Queue</Card.Title>
            </Card.Header>
            <Card.Content class="space-y-2">
              {#each courtAQueue as m, i}
                <div class={cn(
                  "p-2 rounded-lg text-sm",
                  i === 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/50"
                )}>
                  <div class="flex justify-between items-center">
                    <span>{getMemberName(m.player1Id)} vs {getMemberName(m.player2Id)}</span>
                    {#if i === 0}<Badge variant="outline" class="text-xs">Next</Badge>{/if}
                  </div>
                </div>
              {:else}
                <p class="text-sm text-muted-foreground text-center py-2">No pending matches</p>
              {/each}
            </Card.Content>
          </Card.Root>
          
          <!-- Court B Queue -->
          <Card.Root class="border-blue-500/30">
            <Card.Header class="pb-2">
              <Card.Title class="text-blue-400 text-sm font-semibold">Court B Queue</Card.Title>
            </Card.Header>
            <Card.Content class="space-y-2">
              {#each courtBQueue as m, i}
                <div class={cn(
                  "p-2 rounded-lg text-sm",
                  i === 0 ? "bg-blue-500/10 border border-blue-500/30" : "bg-muted/50"
                )}>
                  <div class="flex justify-between items-center">
                    <span>{getMemberName(m.player1Id)} vs {getMemberName(m.player2Id)}</span>
                    {#if i === 0}<Badge variant="outline" class="text-xs">Next</Badge>{/if}
                  </div>
                </div>
              {:else}
                <p class="text-sm text-muted-foreground text-center py-2">No pending matches</p>
              {/each}
            </Card.Content>
          </Card.Root>
        </div>
      </section>
      
      <!-- Recent Results -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Trophy class="h-4 w-4" /> Recent Results
        </h2>
        <Card.Root>
          <Card.Content class="pt-4">
            {#each recentResults as m}
              {@const p1Win = m.winner === m.player1Id}
              <div class="flex items-center gap-3 p-2 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <span class={cn(
                  "flex-1",
                  p1Win && "text-emerald-400 font-semibold"
                )}>
                  {getMemberName(m.player1Id)} {p1Win ? '🏆' : ''}
                </span>
                <Badge variant="outline" class="font-mono">
                  {m.player1Score.length} - {m.player2Score.length}
                </Badge>
                <span class={cn(
                  "flex-1 text-right",
                  !p1Win && m.winner && "text-emerald-400 font-semibold"
                )}>
                  {!p1Win && m.winner ? '🏆 ' : ''}{getMemberName(m.player2Id)}
                </span>
              </div>
            {:else}
              <p class="text-muted-foreground text-center py-6">No completed matches yet</p>
            {/each}
          </Card.Content>
        </Card.Root>
      </section>
      
      <!-- Stats -->
      <section>
        <div class="grid grid-cols-3 gap-4">
          <Card.Root class="text-center">
            <Card.Content class="pt-6">
              <div class="text-3xl font-bold text-emerald-400">{completedCount}</div>
              <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Trophy class="h-3 w-3" /> Completed
              </div>
            </Card.Content>
          </Card.Root>
          <Card.Root class="text-center">
            <Card.Content class="pt-6">
              <div class="text-3xl font-bold text-amber-400">{liveMatches.length}</div>
              <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Swords class="h-3 w-3" /> In Progress
              </div>
            </Card.Content>
          </Card.Root>
          <Card.Root class="text-center">
            <Card.Content class="pt-6">
              <div class="text-3xl font-bold text-muted-foreground">{pendingCount}</div>
              <div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Users class="h-3 w-3" /> Remaining
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </section>
    </main>
  {/if}
  
  <!-- Footer -->
  <footer class="border-t border-border py-4 mt-8 text-center">
    <a href="https://renbudojo.com" target="_blank" class="text-muted-foreground hover:text-primary text-sm transition-colors">
      Powered by Renbu Dojo 錬武道場
    </a>
  </footer>
</div>
