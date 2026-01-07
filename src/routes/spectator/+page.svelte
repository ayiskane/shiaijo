<script lang="ts">
  import { useQuery } from 'convex-svelte';
  import { asset } from '$app/paths';
  import { api } from '../../convex/_generated/api';
  import { cn } from '$lib/utils';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Progress } from '$lib/components/ui/progress';
  import { Separator } from '$lib/components/ui/separator';
  import * as Card from '$lib/components/ui/card';
  import { Trophy, Clock, Users, Swords, Home } from '@lucide/svelte';
  
  const shiaijoLogo = asset('/shiaijologo.png');
  
  // Real-time queries - NO POLLING NEEDED!
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const membersQuery = useQuery(api.members.list, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);
  let tournament = $derived(tournaments.find(t => t.status === 'in_progress') || null);
  
  const participantsQuery = useQuery(
    api.participants.list,
    () => tournament?._id ? { tournamentId: tournament._id } : 'skip'
  );
  let participants = $derived(participantsQuery.data ?? []);
  let loading = $derived(tournamentsQuery.isLoading || membersQuery.isLoading || groupsQuery.isLoading || participantsQuery.isLoading);
  
  // Conditional matches query
  const matchesQuery = useQuery(
    api.matches.getByTournament,
    () => tournament?._id ? { tournamentId: tournament._id } : 'skip'
  );
  let matches = $derived(matchesQuery.data ?? []);
  let timerDisplayMode = $derived(tournament?.timerDisplayMode ?? 'up');
  
  let membersById = $derived.by(() => {
    const map = new Map<string, typeof members[number]>();
    for (const m of members) map.set(m._id, m);
    return map;
  });
  
  let groupsByGroupId = $derived.by(() => {
    const map = new Map<string, typeof groups[number]>();
    for (const g of groups) map.set(g.groupId, g);
    return map;
  });

  type StandingRow = {
    memberId: string;
    points: number;
    wins: number;
    ties: number;
    ippons: number;
    suddenDeathWins: number;
  };

  let standingsData = $derived.by(() => {
    const standingsByGroupId = new Map<string, StandingRow[]>();
    const tieKeysByGroupId = new Map<string, Set<string>>();
    const groupStats = new Map<string, Map<string, StandingRow>>();

    for (const p of participants) {
      let stats = groupStats.get(p.groupId);
      if (!stats) {
        stats = new Map();
        groupStats.set(p.groupId, stats);
      }
      if (!stats.has(p.memberId)) {
        stats.set(p.memberId, { memberId: p.memberId, points: 0, wins: 0, ties: 0, ippons: 0, suddenDeathWins: 0 });
      }
    }

    for (const m of matches) {
      const stats = groupStats.get(m.groupId);
      if (!stats) continue;
      const p1 = stats.get(m.player1Id);
      const p2 = stats.get(m.player2Id);
      if (!p1 || !p2) continue;

      if (m.isSuddenDeath) {
        if (m.status === 'completed' && m.winner) {
          if (m.winner === m.player1Id) p1.suddenDeathWins += 1;
          else if (m.winner === m.player2Id) p2.suddenDeathWins += 1;
        }
        continue;
      }

      if (m.status !== 'completed') continue;
      const p1Ippons = m.player1Score?.length || 0;
      const p2Ippons = m.player2Score?.length || 0;
      p1.ippons += p1Ippons;
      p2.ippons += p2Ippons;
      if (m.winner === m.player1Id) {
        p1.wins += 1;
      } else if (m.winner === m.player2Id) {
        p2.wins += 1;
      } else {
        p1.ties += 1;
        p2.ties += 1;
      }
    }

    for (const [groupId, stats] of groupStats) {
      const rows = Array.from(stats.values());
      for (const row of rows) {
        row.points = (row.wins * 2) + row.ties;
      }
      rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.ippons !== a.ippons) return b.ippons - a.ippons;
        if (b.suddenDeathWins !== a.suddenDeathWins) return b.suddenDeathWins - a.suddenDeathWins;
        return a.memberId.localeCompare(b.memberId);
      });
      standingsByGroupId.set(groupId, rows);

      const keyCounts = new Map<string, number>();
      for (const row of rows) {
        const key = `${row.points}-${row.wins}-${row.ippons}-${row.suddenDeathWins}`;
        keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
      }
      const tiedKeys = new Set<string>();
      const top3 = rows.slice(0, 3);
      for (const row of top3) {
        const key = `${row.points}-${row.wins}-${row.ippons}-${row.suddenDeathWins}`;
        if ((keyCounts.get(key) ?? 0) > 1) tiedKeys.add(key);
      }
      tieKeysByGroupId.set(groupId, tiedKeys);
    }

    return { standingsByGroupId, tieKeysByGroupId };
  });
  
  let currentTime = $state(Date.now());
  let timeInterval: ReturnType<typeof setInterval> | null = null;
  
  // Only need local timer for elapsed time display
  $effect(() => {
    if (tournament && !timeInterval) {
      timeInterval = setInterval(() => currentTime = Date.now(), 1000);
    }
    return () => { if (timeInterval) clearInterval(timeInterval); };
  });
  
  let matchOverview = $derived.by(() => {
    const liveMatches: typeof matches = [];
    const pendingCourtA: typeof matches = [];
    const pendingCourtB: typeof matches = [];
    const completedMatches: typeof matches = [];
    let completedCount = 0;
    let pendingCount = 0;
    
    for (const m of matches) {
      if (m.status === 'in_progress') {
        liveMatches.push(m);
      } else if (m.status === 'completed') {
        completedMatches.push(m);
        completedCount++;
      } else {
        pendingCount++;
        if (m.court === 'A' || m.court === 'A+B') pendingCourtA.push(m);
        if (m.court === 'B' || m.court === 'A+B') pendingCourtB.push(m);
      }
    }
    
    pendingCourtA.sort((a, b) => a.orderIndex - b.orderIndex);
    pendingCourtB.sort((a, b) => a.orderIndex - b.orderIndex);
    
    const courtALive = liveMatches.find(m => m.court === 'A' || m.court === 'A+B') || null;
    const courtBLive = liveMatches.find(m => m.court === 'B') || (!courtALive ? liveMatches.find(m => m.court === 'A+B') || null : null);
    
    return {
      liveMatches,
      courtALive,
      courtBLive,
      courtAQueue: pendingCourtA.slice(0, 5),
      courtBQueue: pendingCourtB.slice(0, 5),
      recentResults: completedMatches.slice(-8),
      completedCount,
      pendingCount
    };
  });
  
  let liveMatches = $derived(matchOverview.liveMatches);
  let courtALive = $derived(matchOverview.courtALive);
  let courtBLive = $derived(matchOverview.courtBLive);
  let courtAQueue = $derived(matchOverview.courtAQueue);
  let courtBQueue = $derived(matchOverview.courtBQueue);
  let recentResults = $derived(matchOverview.recentResults);
  let completedCount = $derived(matchOverview.completedCount);
  let pendingCount = $derived(matchOverview.pendingCount);
  let totalProgress = $derived(matches.length > 0 ? (completedCount / matches.length) * 100 : 0);
  
  function getMemberName(id: string): string { const m = membersById.get(id); return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'TBD'; }
  function getGroupName(id: string): string { return groupsByGroupId.get(id)?.name || id; }
  function getElapsedTime(m: any): number {
    if (m.timerPausedAt) return m.timerPausedAt;
    if (m.timerStartedAt) return Math.floor((currentTime - m.timerStartedAt) / 1000);
    return 0;
  }
  function getDisplayTime(m: any): number {
    const elapsed = getElapsedTime(m);
    if (timerDisplayMode === 'down') {
      return Math.max((m.timerDuration || 0) - elapsed, 0);
    }
    return elapsed;
  }
  function formatTime(s: number): string { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }
</script>

<svelte:head><title>Spectator - Shiaijo</title></svelte:head>

<div class="min-h-screen bg-background text-foreground">
  <header class="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2"><img src={shiaijoLogo} alt="試合場" class="h-10" /></a>
        {#if tournament}<Separator orientation="vertical" class="h-6" /><span class="text-lg font-bold text-primary">{tournament.name}</span>{/if}
      </div>
      <div class="flex items-center gap-2">
        {#if tournament}<Badge variant="default" class="bg-emerald-500 hover:bg-emerald-500 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>LIVE</Badge>{/if}
      </div>
    </div>
  </header>
  
  {#if loading}
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center"><div class="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div><p class="text-muted-foreground">Loading tournament...</p></div>
    </div>
  {:else if !tournament}
    <div class="flex items-center justify-center min-h-[60vh] flex-col gap-4">
      <Swords class="h-16 w-16 text-muted-foreground" />
      <p class="text-muted-foreground text-xl">No active tournament</p>
      <Button variant="outline" asChild><a href="/"><Home class="h-4 w-4 mr-2" /> Back to Home</a></Button>
    </div>
  {:else}
    <main class="max-w-6xl mx-auto p-4 space-y-6">
      <!-- Tournament Progress -->
      <div class="bg-card rounded-xl p-4 border border-border">
        <div class="flex items-center justify-between mb-2"><span class="text-sm text-muted-foreground">Tournament Progress</span><span class="text-sm font-medium">{completedCount} / {matches.length} matches</span></div>
        <Progress value={totalProgress} class="h-2" />
      </div>

      <!-- Standings (Top 3) -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Standings (Top 3)</h2>
        <div class="grid md:grid-cols-2 gap-4">
          {#each groups as group (group._id)}
            {@const standings = standingsData.standingsByGroupId.get(group.groupId) ?? []}
            {@const tiedKeys = standingsData.tieKeysByGroupId.get(group.groupId) ?? new Set()}
            {@const top3 = standings.slice(0, 3)}
            {#if top3.length > 0}
              <Card.Root>
                <Card.Header class="pb-2">
                  <Card.Title class="text-sm">{group.name}</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-2">
                  {#each top3 as row, idx}
                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-2 truncate">
                        <span class="w-5 text-center text-muted-foreground">{idx + 1}</span>
                        <span class="truncate">{getMemberName(row.memberId)}</span>
                        {#if tiedKeys.has(`${row.points}-${row.wins}-${row.ippons}-${row.suddenDeathWins}`)}
                          <Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">TIE</Badge>
                        {/if}
                      </div>
                      <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{row.wins}-{row.ties}</span>
                        <span class="font-mono">{row.points} pts</span>
                      </div>
                    </div>
                  {/each}
                </Card.Content>
              </Card.Root>
            {/if}
          {/each}
        </div>
      </section>
      
      <!-- Live Matches -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Swords class="h-4 w-4" /> Current Matches</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <Card.Root class={cn("transition-all", courtALive ? "border-amber-500/50 bg-amber-950/20" : "")}>
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <Badge variant="outline" class="bg-amber-500/20 text-amber-400 border-amber-500/50">Court A</Badge>
                {#if courtALive}<span class="text-xs text-muted-foreground flex items-center gap-1"><Clock class="h-3 w-3" />{formatTime(getDisplayTime(courtALive))} / {formatTime(courtALive.timerDuration)}</span>{/if}
              </div>
            </Card.Header>
            <Card.Content>
              {#if courtALive}
                <div class="flex items-center justify-between py-2">
                  <div class="flex-1"><p class="font-semibold">{getMemberName(courtALive.player1Id)}</p><p class="text-xs text-red-400">AKA</p></div>
                  <div class="text-3xl font-mono font-bold px-4"><span class="text-red-400">{courtALive.player1Score.length}</span><span class="text-muted-foreground">:</span><span>{courtALive.player2Score.length}</span></div>
                  <div class="flex-1 text-right"><p class="font-semibold">{getMemberName(courtALive.player2Id)}</p><p class="text-xs text-slate-400">SHIRO</p></div>
                </div>
                <div class="mt-2 flex items-center justify-center gap-2">
                  <Badge variant="secondary">{getGroupName(courtALive.groupId)}</Badge>
                  {#if courtALive.isSuddenDeath}<Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">Sudden Death</Badge>{/if}
                </div>
              {:else}<p class="text-muted-foreground text-center py-6">Waiting for next match...</p>{/if}
            </Card.Content>
          </Card.Root>
          
          <Card.Root class={cn("transition-all", courtBLive ? "border-blue-500/50 bg-blue-950/20" : "")}>
            <Card.Header class="pb-2">
              <div class="flex items-center justify-between">
                <Badge variant="outline" class="bg-blue-500/20 text-blue-400 border-blue-500/50">Court B</Badge>
                {#if courtBLive}<span class="text-xs text-muted-foreground flex items-center gap-1"><Clock class="h-3 w-3" />{formatTime(getDisplayTime(courtBLive))} / {formatTime(courtBLive.timerDuration)}</span>{/if}
              </div>
            </Card.Header>
            <Card.Content>
              {#if courtBLive}
                <div class="flex items-center justify-between py-2">
                  <div class="flex-1"><p class="font-semibold">{getMemberName(courtBLive.player1Id)}</p><p class="text-xs text-red-400">AKA</p></div>
                  <div class="text-3xl font-mono font-bold px-4"><span class="text-red-400">{courtBLive.player1Score.length}</span><span class="text-muted-foreground">:</span><span>{courtBLive.player2Score.length}</span></div>
                  <div class="flex-1 text-right"><p class="font-semibold">{getMemberName(courtBLive.player2Id)}</p><p class="text-xs text-slate-400">SHIRO</p></div>
                </div>
                <div class="mt-2 flex items-center justify-center gap-2">
                  <Badge variant="secondary">{getGroupName(courtBLive.groupId)}</Badge>
                  {#if courtBLive.isSuddenDeath}<Badge variant="outline" class="text-[10px] border-purple-500 text-purple-400">Sudden Death</Badge>{/if}
                </div>
              {:else}<p class="text-muted-foreground text-center py-6">Waiting for next match...</p>{/if}
            </Card.Content>
          </Card.Root>
        </div>
      </section>
      
      <!-- Match Queues -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Clock class="h-4 w-4" /> Up Next</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <Card.Root class="border-amber-500/30">
            <Card.Header class="pb-2"><Card.Title class="text-amber-400 text-sm font-semibold">Court A Queue</Card.Title></Card.Header>
            <Card.Content class="space-y-2">
              {#each courtAQueue as m, i}
                <div class={cn("p-2 rounded-lg text-sm", i === 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/50")}>
                  <div class="flex justify-between items-center">
                    <span>{getMemberName(m.player1Id)} vs {getMemberName(m.player2Id)}</span>
                    <div class="flex items-center gap-1">
                      {#if m.isSuddenDeath}<Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">SD</Badge>{/if}
                      {#if i === 0}<Badge variant="outline" class="text-xs">Next</Badge>{/if}
                    </div>
                  </div>
                </div>
              {:else}<p class="text-sm text-muted-foreground text-center py-2">No pending matches</p>{/each}
            </Card.Content>
          </Card.Root>
          
          <Card.Root class="border-blue-500/30">
            <Card.Header class="pb-2"><Card.Title class="text-blue-400 text-sm font-semibold">Court B Queue</Card.Title></Card.Header>
            <Card.Content class="space-y-2">
              {#each courtBQueue as m, i}
                <div class={cn("p-2 rounded-lg text-sm", i === 0 ? "bg-blue-500/10 border border-blue-500/30" : "bg-muted/50")}>
                  <div class="flex justify-between items-center">
                    <span>{getMemberName(m.player1Id)} vs {getMemberName(m.player2Id)}</span>
                    <div class="flex items-center gap-1">
                      {#if m.isSuddenDeath}<Badge variant="outline" class="text-[10px] border-purple-500 text-purple-400">SD</Badge>{/if}
                      {#if i === 0}<Badge variant="outline" class="text-xs">Next</Badge>{/if}
                    </div>
                  </div>
                </div>
              {:else}<p class="text-sm text-muted-foreground text-center py-2">No pending matches</p>{/each}
            </Card.Content>
          </Card.Root>
        </div>
      </section>
      
      <!-- Recent Results -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Trophy class="h-4 w-4" /> Recent Results</h2>
        <Card.Root>
          <Card.Content class="pt-4">
            {#each recentResults as m}
              {@const p1Win = m.winner === m.player1Id}
              {@const isTie = !m.winner}
              <div class="flex items-center gap-3 p-2 rounded-lg bg-muted/30 mb-2 last:mb-0">
                <span class={cn("flex-1", p1Win && "text-emerald-400 font-semibold")}>{getMemberName(m.player1Id)} {p1Win ? '🏆' : ''}</span>
                <div class="flex items-center gap-2">
                  <Badge variant="outline" class="font-mono">{m.player1Score.length} - {m.player2Score.length}</Badge>
                  {#if isTie}<Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">TIE</Badge>{/if}
                  {#if m.isSuddenDeath}<Badge variant="outline" class="text-[10px] border-purple-500 text-purple-400">SD</Badge>{/if}
                </div>
                <span class={cn("flex-1 text-right", !p1Win && m.winner && "text-emerald-400 font-semibold")}>{!p1Win && m.winner ? '🏆 ' : ''}{getMemberName(m.player2Id)}</span>
              </div>
            {:else}<p class="text-muted-foreground text-center py-6">No completed matches yet</p>{/each}
          </Card.Content>
        </Card.Root>
      </section>
      
      <!-- Stats -->
      <section>
        <div class="grid grid-cols-3 gap-4">
          <Card.Root class="text-center"><Card.Content class="pt-6"><div class="text-3xl font-bold text-emerald-400">{completedCount}</div><div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><Trophy class="h-3 w-3" /> Completed</div></Card.Content></Card.Root>
          <Card.Root class="text-center"><Card.Content class="pt-6"><div class="text-3xl font-bold text-amber-400">{liveMatches.length}</div><div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><Swords class="h-3 w-3" /> In Progress</div></Card.Content></Card.Root>
          <Card.Root class="text-center"><Card.Content class="pt-6"><div class="text-3xl font-bold text-muted-foreground">{pendingCount}</div><div class="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><Users class="h-3 w-3" /> Remaining</div></Card.Content></Card.Root>
        </div>
      </section>
    </main>
  {/if}
  
  <footer class="border-t border-border py-4 mt-8 text-center">
    <a href="https://renbudojo.com" target="_blank" class="text-muted-foreground hover:text-primary text-sm transition-colors">Powered by Renbu Dojo 錬武道場</a>
  </footer>
</div>
