<script lang="ts">
  import { onDestroy } from 'svelte';
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../convex/_generated/api';
  import { cn } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Swords, Menu, RotateCcw, Play, Pause, Undo2, Flag, Trophy } from 'lucide-svelte';
  
  const client = useConvexClient();
  
  // Real-time queries
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const membersQuery = useQuery(api.members.list, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);
  let tournament = $derived(tournaments.find(t => t.status === 'in_progress') || null);
  
  // Conditional matches query - only runs when tournament exists
  const matchesQuery = useQuery(
    api.matches.getByTournament,
    () => tournament?._id ? { tournamentId: tournament._id } : 'skip'
  );
  let matches = $derived(matchesQuery.data ?? []);
  let loading = $derived(tournamentsQuery.isLoading || membersQuery.isLoading);
  
  const SCORE_LABELS: Record<number, string> = { 1: 'M', 2: 'K', 3: 'D', 4: 'T', 5: 'H', 6: 'FF' };
  const SCORE_BUTTONS = [{ type: 1, label: 'M' }, { type: 2, label: 'K' }, { type: 3, label: 'D' }, { type: 4, label: 'T' }];
  
  let showCourtSelect = $state(true);
  let selectedCourt = $state<'A' | 'B' | null>(null);
  let elapsedSeconds = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let showWinModal = $state(false);
  let pendingWinner = $state<'player1' | 'player2' | null>(null);
  let showQueuePanel = $state(false);
  
  let courtMatches = $derived(matches.filter(m => m.court === selectedCourt || m.court === 'A+B').sort((a, b) => a.orderIndex - b.orderIndex));
  let pendingMatches = $derived(courtMatches.filter(m => m.status === 'pending'));
  let inProgressMatches = $derived(courtMatches.filter(m => m.status === 'in_progress'));
  let currentMatch = $derived(inProgressMatches.find(m => m.court === selectedCourt || m.court === 'A+B') || pendingMatches[0] || null);
  
  let p1Score = $derived(currentMatch?.player1Score || []);
  let p2Score = $derived(currentMatch?.player2Score || []);
  let p1Hansoku = $derived(currentMatch?.player1Hansoku || 0);
  let p2Hansoku = $derived(currentMatch?.player2Hansoku || 0);
  let winTarget = $derived(currentMatch?.matchType === 'ippon' ? 1 : 2);
  let gameOver = $derived(p1Score.length >= winTarget || p2Score.length >= winTarget);
  let timerDuration = $derived(currentMatch?.timerDuration || 180);
  let progress = $derived(Math.min(100, (elapsedSeconds / timerDuration) * 100));
  let timerExpired = $derived(elapsedSeconds >= timerDuration);
  let timerRunning = $derived(!!(currentMatch?.timerStartedAt && !currentMatch?.timerPausedAt));
  
  // Timer sync effect
  $effect(() => {
    if (!currentMatch) { elapsedSeconds = 0; stopLocalTimer(); return; }
    if (currentMatch.timerStartedAt && !currentMatch.timerPausedAt) {
      elapsedSeconds = Math.floor((Date.now() - currentMatch.timerStartedAt) / 1000);
      startLocalTimer();
    } else if (currentMatch.timerPausedAt) {
      elapsedSeconds = currentMatch.timerPausedAt;
      stopLocalTimer();
    } else {
      elapsedSeconds = 0;
      stopLocalTimer();
    }
  });
  
  function startLocalTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      if (currentMatch?.timerStartedAt && !currentMatch?.timerPausedAt) {
        elapsedSeconds = Math.floor((Date.now() - currentMatch.timerStartedAt) / 1000);
      }
    }, 100);
  }
  
  function stopLocalTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
  function formatTime(s: number): string { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }
  function selectCourt(court: 'A' | 'B') { selectedCourt = court; showCourtSelect = false; }
  function getMemberName(id: string | undefined): string { if (!id) return 'Unknown'; const m = members.find(mem => mem._id === id); return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'Unknown'; }
  function getGroupName(id: string): string { return groups.find(g => g.groupId === id)?.name || id; }
  
  async function addScore(player: 'player1' | 'player2', scoreType: number) {
    if (!currentMatch || gameOver) return;
    try {
      if (currentMatch.status === 'pending') await client.mutation(api.matches.startMatch, { matchId: currentMatch._id });
      const result = await client.mutation(api.matches.addScore, { matchId: currentMatch._id, player, scoreType });
      if (result.winner) { pendingWinner = player; showWinModal = true; }
    } catch (e) { toast.error('Failed to add score'); }
  }
  
  async function addHansoku(player: 'player1' | 'player2') {
    if (!currentMatch || gameOver) return;
    try {
      const result = await client.mutation(api.matches.addHansoku, { matchId: currentMatch._id, player });
      if (result.winner) { pendingWinner = player === 'player1' ? 'player2' : 'player1'; showWinModal = true; }
    } catch (e) { toast.error('Failed to add hansoku'); }
  }
  
  async function undoScore(player: 'player1' | 'player2') {
    if (!currentMatch) return;
    try { await client.mutation(api.matches.undoScore, { matchId: currentMatch._id, player }); showWinModal = false; pendingWinner = null; } catch (e) { toast.error('Failed to undo'); }
  }
  
  async function toggleTimer() {
    if (!currentMatch) return;
    try { await client.mutation(api.matches.toggleTimer, { matchId: currentMatch._id }); } catch (e) { toast.error('Failed to toggle timer'); }
  }
  
  async function confirmWin() {
    if (!currentMatch || !pendingWinner) return;
    try { await client.mutation(api.matches.declareWinner, { matchId: currentMatch._id, winner: pendingWinner }); showWinModal = false; pendingWinner = null; toast.success('Match completed!'); } catch (e) { toast.error('Failed to confirm win'); }
  }
  
  async function declareForfeit(player: 'player1' | 'player2') {
    if (!currentMatch) return;
    try { await client.mutation(api.matches.declareForfeit, { matchId: currentMatch._id, forfeitingPlayer: player }); pendingWinner = player === 'player1' ? 'player2' : 'player1'; showWinModal = true; } catch (e) { toast.error('Failed to declare forfeit'); }
  }
  
  onDestroy(() => stopLocalTimer());
</script>

<svelte:head><title>Courtkeeper - Shiaijo</title></svelte:head>

<Dialog.Root bind:open={showCourtSelect}>
  <Dialog.Content class="sm:max-w-sm" showCloseButton={false}>
    <Dialog.Header class="text-center">
      <div class="flex justify-center mb-4"><img src="/shiaijologo.png" alt="試合場" class="h-16" /></div>
      <Dialog.Title>Select Your Court</Dialog.Title>
      <Dialog.Description>Which court are you keeping score for?</Dialog.Description>
    </Dialog.Header>
    <div class="grid grid-cols-2 gap-4 py-4">
      <Button onclick={() => selectCourt('A')} size="lg" class="h-16 text-lg bg-amber-500 hover:bg-amber-400 text-black font-bold">Court A</Button>
      <Button onclick={() => selectCourt('B')} size="lg" class="h-16 text-lg bg-blue-500 hover:bg-blue-400 text-white font-bold">Court B</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

{#if !showCourtSelect && selectedCourt}
<div class="min-h-screen bg-background text-foreground flex flex-col select-none">
  <header class="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <img src="/shiaijologo.png" alt="" class="h-8" />
      <Badge variant="default" class={cn("text-lg font-bold px-3 py-1", selectedCourt === 'A' ? "bg-amber-500 text-black hover:bg-amber-500" : "bg-blue-500 text-white hover:bg-blue-500")}>Court {selectedCourt}</Badge>
      {#if currentMatch}<span class="text-sm text-muted-foreground">{getGroupName(currentMatch.groupId)}</span>{/if}
    </div>
    <Button variant="outline" size="icon" onclick={() => showQueuePanel = true}><Menu class="h-5 w-5" /></Button>
  </header>
  
  {#if loading}
    <div class="flex-1 flex items-center justify-center"><div class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>
  {:else if !tournament}
    <div class="flex-1 flex items-center justify-center flex-col gap-4"><p class="text-muted-foreground">No active tournament</p><Button variant="default" asChild><a href="/admin">Go to Admin</a></Button></div>
  {:else if !currentMatch}
    <div class="flex-1 flex items-center justify-center"><p class="text-muted-foreground">No matches for Court {selectedCourt}</p></div>
  {:else}
    <div class="flex-1 flex flex-col p-3 gap-3">
      <!-- Score Display -->
      <div class="bg-gradient-to-r from-red-950/80 via-card to-slate-800/80 rounded-xl p-4 border border-border">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-xs text-red-400 mb-1 font-semibold">AKA</p>
            <p class="text-xl font-bold truncate">{getMemberName(currentMatch.player1Id)}</p>
            <div class="flex gap-1 mt-2">{#each p1Score as s}<span class="w-7 h-7 rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center text-sm font-bold">{SCORE_LABELS[s]}</span>{/each}</div>
          </div>
          <div class="px-4 text-center">
            <div class="text-4xl font-mono font-bold"><span class="text-red-400">{Math.min(p1Score.length, winTarget)}</span><span class="text-muted-foreground">:</span><span>{Math.min(p2Score.length, winTarget)}</span></div>
            <div class="text-amber-400 text-sm mt-1">{p1Hansoku > 0 ? '▲'.repeat(p1Hansoku) : ''} · {p2Hansoku > 0 ? '▲'.repeat(p2Hansoku) : ''}</div>
          </div>
          <div class="flex-1 text-right">
            <p class="text-xs text-slate-300 mb-1 font-semibold">SHIRO</p>
            <p class="text-xl font-bold truncate">{getMemberName(currentMatch.player2Id)}</p>
            <div class="flex gap-1 mt-2 justify-end">{#each p2Score as s}<span class="w-7 h-7 rounded-full border-2 border-slate-300 text-slate-300 flex items-center justify-center text-sm font-bold">{SCORE_LABELS[s]}</span>{/each}</div>
          </div>
        </div>
      </div>
      
      <!-- Score Buttons -->
      <div class="grid grid-cols-2 gap-3 flex-1">
        <div class="bg-red-950/30 rounded-xl p-3 border border-red-900/50 flex flex-col gap-2">
          <div class="grid grid-cols-4 gap-2">{#each SCORE_BUTTONS as btn}<Button onclick={() => addScore('player1', btn.type)} disabled={gameOver} class="h-14 bg-red-600 hover:bg-red-500 disabled:opacity-50 font-bold text-lg">{btn.label}</Button>{/each}</div>
          <Button onclick={() => addHansoku('player1')} disabled={gameOver} class="h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 font-semibold">▲ Hansoku</Button>
          <div class="flex gap-2">
            <Button variant="secondary" onclick={() => undoScore('player1')} disabled={p1Score.length === 0} class="flex-1 h-10"><Undo2 class="h-4 w-4 mr-1" /> Undo</Button>
            <Button variant="outline" onclick={() => declareForfeit('player1')} disabled={gameOver} class="flex-1 h-10 text-destructive border-destructive/50"><Flag class="h-4 w-4 mr-1" /> Forfeit</Button>
          </div>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex flex-col gap-2">
          <div class="grid grid-cols-4 gap-2">{#each SCORE_BUTTONS as btn}<Button onclick={() => addScore('player2', btn.type)} disabled={gameOver} variant="secondary" class="h-14 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 font-bold text-lg">{btn.label}</Button>{/each}</div>
          <Button onclick={() => addHansoku('player2')} disabled={gameOver} class="h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 font-semibold">Hansoku ▲</Button>
          <div class="flex gap-2">
            <Button variant="outline" onclick={() => declareForfeit('player2')} disabled={gameOver} class="flex-1 h-10 text-destructive border-destructive/50">Forfeit <Flag class="h-4 w-4 ml-1" /></Button>
            <Button variant="secondary" onclick={() => undoScore('player2')} disabled={p2Score.length === 0} class="flex-1 h-10">Undo <Undo2 class="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      </div>
      
      <!-- Timer -->
      <div class={cn("rounded-xl p-4 border", timerExpired ? "bg-amber-950/50 border-amber-500" : "bg-card border-border")}>
        {#if timerExpired}<div class="bg-amber-500 text-black font-bold text-center py-2 rounded-lg mb-3">⏰ TIME!</div>{:else}<Progress value={progress} class="h-2 mb-3" />{/if}
        <div class="flex items-center justify-center gap-4">
          <Button onclick={toggleTimer} size="lg" class={cn("w-14 h-14 rounded-full font-bold text-lg", timerRunning ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-emerald-500 hover:bg-emerald-400")}>{#if timerRunning}<Pause class="h-6 w-6" />{:else}<Play class="h-6 w-6" />{/if}</Button>
          <span class="text-4xl font-mono font-bold tabular-nums">{formatTime(elapsedSeconds)}</span>
          <Button variant="secondary" onclick={() => elapsedSeconds = 0}><RotateCcw class="h-4 w-4 mr-1" /> Reset</Button>
        </div>
      </div>
      
      {#if pendingMatches.length > 1}
        {@const next = pendingMatches[1]}
        <div class="bg-card/50 rounded-lg p-3 border border-border/50">
          <div class="text-xs text-muted-foreground mb-1">UP NEXT</div>
          <div class="flex items-center justify-between"><span class="text-sm">{getMemberName(next.player1Id)} vs {getMemberName(next.player2Id)}</span><Badge variant="outline" class="text-xs">{getGroupName(next.groupId)}</Badge></div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<Dialog.Root bind:open={showWinModal}>
  <Dialog.Content class={cn("sm:max-w-sm text-center", pendingWinner === 'player1' ? "border-red-500" : "border-slate-400")}>
    <Dialog.Header><div class="text-5xl mb-4">🏆</div><Dialog.Title class="text-2xl">{pendingWinner === 'player1' ? getMemberName(currentMatch?.player1Id) : getMemberName(currentMatch?.player2Id)} wins!</Dialog.Title></Dialog.Header>
    <Dialog.Footer class="grid grid-cols-2 gap-3 pt-4">
      <Button variant="default" onclick={confirmWin} class="bg-emerald-600 hover:bg-emerald-500"><Trophy class="h-4 w-4 mr-2" /> Confirm</Button>
      <Button variant="secondary" onclick={() => { if (pendingWinner) undoScore(pendingWinner); }}><Undo2 class="h-4 w-4 mr-2" /> Undo</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Sheet.Root bind:open={showQueuePanel}>
  <Sheet.Content side="right" class="w-72">
    <Sheet.Header><Sheet.Title>Match Queue</Sheet.Title></Sheet.Header>
    <div class="py-4">
      <div class="flex gap-2 mb-4">
        <Button variant={selectedCourt === 'A' ? 'default' : 'secondary'} onclick={() => selectedCourt = 'A'} class={cn("flex-1", selectedCourt === 'A' && "bg-amber-500 hover:bg-amber-400 text-black")}>Court A</Button>
        <Button variant={selectedCourt === 'B' ? 'default' : 'secondary'} onclick={() => selectedCourt = 'B'} class={cn("flex-1", selectedCourt === 'B' && "bg-blue-500 hover:bg-blue-400")}>Court B</Button>
      </div>
      <div class="space-y-2">
        {#each pendingMatches as m, i}
          <div class={cn("p-2 rounded-lg text-sm border", i === 0 ? "bg-primary/10 border-primary/50" : "bg-card border-border")}>
            <div class="font-medium">{getMemberName(m.player1Id)}</div>
            <div class="text-muted-foreground">vs {getMemberName(m.player2Id)}</div>
            <Badge variant="outline" class="mt-1 text-xs">{getGroupName(m.groupId)}</Badge>
          </div>
        {:else}<p class="text-muted-foreground text-sm text-center py-4">No pending matches</p>{/each}
      </div>
      <div class="mt-4 pt-4 border-t border-border"><Button variant="outline" class="w-full" asChild><a href="/admin"><Swords class="h-4 w-4 mr-2" /> Admin Portal</a></Button></div>
    </div>
  </Sheet.Content>
</Sheet.Root>
{/if}
