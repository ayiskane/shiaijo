<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { asset } from '$app/paths';
  import { api } from '../../convex/_generated/api';
  import { cn } from '$lib/utils';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sheet from '$lib/components/ui/sheet';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { Swords, Menu, RotateCcw, Play, Pause, Undo2, Flag, Trophy, Home, Gavel, Lock, KeyRound, UserCheck } from '@lucide/svelte';
  
  const shiaijoLogo = asset('/shiaijologo.png');
  const SENSEI_GROUP_ID = 'SEN';
  
  const client = useConvexClient();
  
  // Real-time queries
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const membersQuery = useQuery(api.members.list, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const settingsQuery = useQuery(api.settings.get, () => ({ key: 'courtkeeperPasscode' }));
  
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);
  let tournament = $derived(tournaments.find(t => t.status === 'in_progress') || null);
  let settingsLoading = $derived(settingsQuery.isLoading);
  let courtkeeperPasscode = $derived(settingsQuery.data ?? '');
  
  // Conditional matches query
  const matchesQuery = useQuery(
    api.matches.getByTournament,
    () => tournament?._id ? { tournamentId: tournament._id } : 'skip'
  );
  let matches = $derived(matchesQuery.data ?? []);
  let loading = $derived(tournamentsQuery.isLoading || membersQuery.isLoading);
  
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

  let senseiMembers = $derived(members.filter(m => m.groupId === SENSEI_GROUP_ID));
  
  // Score labels
  const SCORE_LABELS: Record<number, string> = { 1: 'M', 2: 'K', 3: 'D', 4: 'T', 5: 'H', 6: 'FF' };
  const SCORE_BUTTONS = [{ type: 1, label: 'M' }, { type: 2, label: 'K' }, { type: 3, label: 'D' }, { type: 4, label: 'T' }];
  
  // Hantei combo options
  const HANTEI_COMBOS = [
    { id: 'M', label: 'Men', short: 'M' },
    { id: 'K', label: 'Kote', short: 'K' },
    { id: 'D', label: 'Do', short: 'D' },
    { id: 'KM', label: 'Kote-Men', short: 'KM' },
    { id: 'MKD', label: 'Men-Kaeshi-Do', short: 'MKD' },
  ];
  
  let showCourtSelect = $state(true);
  let selectedCourt = $state<'A' | 'B' | null>(null);
  let elapsedSeconds = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let showWinModal = $state(false);
  let pendingWinner = $state<'player1' | 'player2' | null>(null);
  let showQueuePanel = $state(false);
  let accessUnlocked = $state(false);
  let accessChecked = $state(false);
  let courtkeeperUnlockCode = $state('');
  let selectedSenseiId = $state<string | null>(null);
  let deviceId = $state('');
  let now = $state(Date.now());
  let nowInterval: ReturnType<typeof setInterval> | null = null;
  
  // Hantei scoring state
  let hanteiRound = $state(1);
  let hanteiCombo = $state('M');
  let akaFlags = $state(0);
  let shiroFlags = $state(0);
  
  let courtMatchData = $derived.by(() => {
    if (!selectedCourt) return { courtMatches: [], pending: [], inProgress: [], current: null };
    
    const courtMatches: typeof matches = [];
    for (const m of matches) {
      if (m.court === selectedCourt || m.court === 'A+B') {
        courtMatches.push(m);
      }
    }
    courtMatches.sort((a, b) => a.orderIndex - b.orderIndex);
    
    const pending: typeof matches = [];
    const inProgress: typeof matches = [];
    for (const m of courtMatches) {
      if (m.status === 'pending') pending.push(m);
      else if (m.status === 'in_progress') inProgress.push(m);
    }
    
    const current = inProgress.find(m => m.court === selectedCourt || m.court === 'A+B') || pending[0] || null;
    return { courtMatches, pending, inProgress, current };
  });
  
  let pendingMatches = $derived(courtMatchData.pending);
  let currentMatch = $derived(courtMatchData.current);
  
  // Hantei match detection
  let isHanteiMatch = $derived(currentMatch?.matchType === 'hantei');
  let hanteiRounds = $derived(currentMatch?.hanteiRounds || []);
  let akaRoundWins = $derived(hanteiRounds.filter(r => r.akaFlags > r.shiroFlags).length);
  let shiroRoundWins = $derived(hanteiRounds.filter(r => r.shiroFlags > r.akaFlags).length);
  
  let p1Score = $derived(currentMatch?.player1Score || []);
  let p2Score = $derived(currentMatch?.player2Score || []);
  let p1Hansoku = $derived(currentMatch?.player1Hansoku || 0);
  let p2Hansoku = $derived(currentMatch?.player2Hansoku || 0);
  let winTarget = $derived(currentMatch?.matchType === 'ippon' ? 1 : 2);
  let gameOver = $derived(
    currentMatch?.status === 'completed' ||
      (isHanteiMatch 
        ? (akaRoundWins >= 2 || shiroRoundWins >= 2)
        : (p1Score.length >= winTarget || p2Score.length >= winTarget))
  );
  let timerDuration = $derived(currentMatch?.timerDuration || 180);
  let progress = $derived(Math.min(100, (elapsedSeconds / timerDuration) * 100));
  let timerExpired = $derived(elapsedSeconds >= timerDuration);
  let timerRunning = $derived(!!(currentMatch?.timerStartedAt && !currentMatch?.timerPausedAt));
  let timerDisplayMode = $derived(tournament?.timerDisplayMode ?? 'up');
  let displaySeconds = $derived(
    timerDisplayMode === 'down' ? Math.max(timerDuration - elapsedSeconds, 0) : elapsedSeconds
  );
  let lockActive = $derived(!!(currentMatch?.controlOwnerId && currentMatch?.controlLockExpiresAt && currentMatch.controlLockExpiresAt > now));
  let controlsLockedForMe = $derived(timerRunning && lockActive && currentMatch?.controlOwnerId !== deviceId);
  let iAmController = $derived(timerRunning && lockActive && currentMatch?.controlOwnerId === deviceId);
  
  // Reset hantei state when match changes
  $effect(() => {
    if (currentMatch) {
      const completedRounds = hanteiRounds.length;
      hanteiRound = completedRounds + 1;
      akaFlags = 0;
      shiroFlags = 0;
    }
  });
  
  // Timer sync
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
    }, 500);
  }
  
  function stopLocalTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
  function formatTime(s: number): string { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }
  function selectCourt(court: 'A' | 'B') { selectedCourt = court; showCourtSelect = false; }
  function getMemberName(id: string | undefined): string { if (!id) return 'Unknown'; const m = membersById.get(id); return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'Unknown'; }
  function getGroupName(id: string): string { return groupsByGroupId.get(id)?.name || id; }

  onMount(() => {
    const stored = localStorage.getItem('shiaijo_device_id');
    if (stored) {
      deviceId = stored;
    } else {
      const newId = crypto.randomUUID();
      deviceId = newId;
      localStorage.setItem('shiaijo_device_id', newId);
    }
    accessUnlocked = localStorage.getItem('shiaijo_courtkeeper_unlocked') === 'true';
    accessChecked = true;
    nowInterval = setInterval(() => now = Date.now(), 1000);
  });

  $effect(() => {
    if (!accessChecked) return;
    if (!courtkeeperPasscode) accessUnlocked = true;
  });

  function unlockCourtkeeper() {
    if (!courtkeeperPasscode || courtkeeperUnlockCode.trim() === courtkeeperPasscode) {
      accessUnlocked = true;
      courtkeeperUnlockCode = '';
      localStorage.setItem('shiaijo_courtkeeper_unlocked', 'true');
    } else {
      toast.error('Incorrect passcode');
    }
  }

  function unlockAsSensei() {
    if (!selectedSenseiId) {
      toast.error('Select a Sensei member');
      return;
    }
    accessUnlocked = true;
    localStorage.setItem('shiaijo_courtkeeper_unlocked', 'true');
  }
  
  // Bogu scoring
  async function addScore(player: 'player1' | 'player2', scoreType: number) {
    if (!currentMatch || gameOver || isHanteiMatch) return;
    try {
      if (currentMatch.status === 'pending') await client.mutation(api.matches.startMatch, { matchId: currentMatch._id, deviceId });
      const result = await client.mutation(api.matches.addScore, { matchId: currentMatch._id, player, scoreType, elapsedSeconds, deviceId });
      if (result.winner) { pendingWinner = player; showWinModal = true; }
    } catch (e) { toast.error('Failed to add score'); }
  }
  
  async function addHansoku(player: 'player1' | 'player2') {
    if (!currentMatch || gameOver || isHanteiMatch) return;
    try {
      const result = await client.mutation(api.matches.addHansoku, { matchId: currentMatch._id, player, elapsedSeconds, deviceId });
      if (result.winner) { pendingWinner = player === 'player1' ? 'player2' : 'player1'; showWinModal = true; }
    } catch (e) { toast.error('Failed to add hansoku'); }
  }

  async function undoScore(player: 'player1' | 'player2') {
    if (!currentMatch) return;
    try { await client.mutation(api.matches.undoScore, { matchId: currentMatch._id, player, deviceId }); showWinModal = false; pendingWinner = null; } catch (e) { toast.error('Failed to undo'); }
  }
  
  // Hantei scoring
  async function submitHanteiRound() {
    if (!currentMatch || !isHanteiMatch) return;
    if (akaFlags === shiroFlags) { toast.error('Flags cannot be tied'); return; }
    try {
      const result = await client.mutation(api.matches.addHanteiRound, {
        matchId: currentMatch._id,
        round: hanteiRound,
        combo: hanteiCombo,
        akaFlags,
        shiroFlags,
      });
      if (result.winner) { pendingWinner = result.winner as 'player1' | 'player2'; showWinModal = true; }
      else { hanteiRound++; akaFlags = 0; shiroFlags = 0; toast.success(`Round ${hanteiRound - 1} recorded`); }
    } catch (e) { toast.error('Failed to record round'); }
  }
  
  async function undoHanteiRound() {
    if (!currentMatch || hanteiRounds.length === 0) return;
    try {
      await client.mutation(api.matches.undoHanteiRound, { matchId: currentMatch._id });
      hanteiRound = hanteiRounds.length; // Will be the last round after undo
      showWinModal = false; 
      pendingWinner = null; 
      akaFlags = 0;
      shiroFlags = 0;
      toast.success('Round undone');
    } catch (e) { toast.error('Failed to undo round'); }
  }
  
  async function toggleTimer() {
    if (!currentMatch) return;
    try { await client.mutation(api.matches.toggleTimer, { matchId: currentMatch._id, deviceId }); } catch (e) { toast.error('Failed to toggle timer'); }
  }

  async function addTime(seconds: number) {
    if (!currentMatch) return;
    try {
      await client.mutation(api.matches.addTimerTime, { matchId: currentMatch._id, seconds, deviceId });
      toast.success(`Added ${seconds === 30 ? '0:30' : '1:00'} to timer`);
    } catch (e) { toast.error('Failed to add time'); }
  }

  async function resetTimer() {
    if (!currentMatch) return;
    try {
      await client.mutation(api.matches.resetTimer, { matchId: currentMatch._id });
      elapsedSeconds = 0;
      toast.success('Timer reset');
    } catch (e) { toast.error('Failed to reset timer'); }
  }

  async function declareTie() {
    if (!currentMatch) return;
    if (currentMatch.isSuddenDeath) { toast.error('Sudden death cannot be tied'); return; }
    if (!confirm('Declare this match a tie?')) return;
    try {
      await client.mutation(api.matches.declareTie, { matchId: currentMatch._id, deviceId });
      toast.success('Match recorded as tie');
    } catch (e) { toast.error('Failed to declare tie'); }
  }
  
  async function confirmWin() {
    if (!currentMatch || !pendingWinner) return;
    try { 
      if (isHanteiMatch) await client.mutation(api.matches.declareHanteiWinner, { matchId: currentMatch._id, winner: pendingWinner });
      else await client.mutation(api.matches.declareWinner, { matchId: currentMatch._id, winner: pendingWinner, deviceId }); 
      showWinModal = false; pendingWinner = null; toast.success('Match completed!'); 
    } catch (e) { toast.error('Failed to confirm win'); }
  }
  
  async function declareForfeit(player: 'player1' | 'player2') {
    if (!currentMatch) return;
    if (!confirm(`Declare forfeit for ${player === 'player1' ? 'AKA' : 'SHIRO'}?`)) return;
    try { await client.mutation(api.matches.declareForfeit, { matchId: currentMatch._id, forfeitingPlayer: player, elapsedSeconds, deviceId }); toast.success('Forfeit recorded'); } catch (e) { toast.error('Failed to record forfeit'); }
  }
  
  $effect(() => {
    if (timerRunning && currentMatch?.controlOwnerId === deviceId) {
      const id = setInterval(() => {
        if (currentMatch) client.mutation(api.matches.keepAliveControl, { matchId: currentMatch._id, deviceId }).catch(() => {});
      }, 5000);
      return () => clearInterval(id);
    }
  });

  onDestroy(() => { stopLocalTimer(); if (nowInterval) clearInterval(nowInterval); });
</script>

{#if !accessUnlocked}
  <div class="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
      <div class="flex items-center gap-3">
        <Lock class="h-6 w-6 text-amber-400" />
        <div>
          <h1 class="text-xl font-bold">Courtkeeper Locked</h1>
          <p class="text-xs text-muted-foreground">Enter the passcode or unlock as Sensei.</p>
        </div>
      </div>
      {#if settingsLoading}
        <div class="flex items-center justify-center py-8">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      {:else}
        <div class="space-y-2">
          <Label class="text-xs text-muted-foreground">Courtkeeper Passcode</Label>
          <div class="flex gap-2">
            <Input type="password" bind:value={courtkeeperUnlockCode} placeholder="Enter passcode" class="text-sm" />
            <Button onclick={unlockCourtkeeper} class="shrink-0"><KeyRound class="mr-2 h-4 w-4" /> Unlock</Button>
          </div>
          {#if !courtkeeperPasscode}
            <p class="text-[10px] text-muted-foreground">No passcode set yet. You can enter without a code.</p>
          {/if}
        </div>
        <Separator />
        <div class="space-y-2">
          <Label class="text-xs text-muted-foreground">Sensei Quick Access</Label>
          <div class="flex gap-2">
            <select bind:value={selectedSenseiId} class="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select Sensei</option>
              {#each senseiMembers as m}
                <option value={m._id}>{m.firstName} {m.lastName}</option>
              {/each}
            </select>
            <Button variant="outline" onclick={unlockAsSensei} class="shrink-0"><UserCheck class="mr-2 h-4 w-4" /> Sensei</Button>
          </div>
          {#if senseiMembers.length === 0}
            <p class="text-[10px] text-muted-foreground">No Sensei members found. Add members to the Sensei group.</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else}
<Dialog.Root bind:open={showCourtSelect}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header><Dialog.Title class="text-center text-xl">Select Court</Dialog.Title></Dialog.Header>
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
      <a href="/" class="hover:opacity-80 transition-opacity"><img src={shiaijoLogo} alt="" class="h-8" /></a>
      <Badge variant="default" class={cn("text-lg font-bold px-3 py-1", selectedCourt === 'A' ? "bg-amber-500 text-black hover:bg-amber-500" : "bg-blue-500 text-white hover:bg-blue-500")}>Court {selectedCourt}</Badge>
      {#if currentMatch}
        <span class="text-sm text-muted-foreground">{getGroupName(currentMatch.groupId)}</span>
        {#if isHanteiMatch}<Badge variant="outline" class="text-xs border-purple-500 text-purple-400">Hantei</Badge>{/if}
        {#if currentMatch.isSuddenDeath}<Badge variant="outline" class="text-xs border-amber-500 text-amber-400">Sudden Death</Badge>{/if}
        {#if lockActive}
          <Badge variant="outline" class="text-[10px] border-amber-400 text-amber-300 flex items-center gap-1">
            <Lock class="h-3 w-3" /> {iAmController ? 'You are facilitating' : 'Another device is facilitating'}
          </Badge>
        {/if}
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" asChild><a href="/"><Home class="h-5 w-5" /></a></Button>
      <Button variant="outline" size="icon" onclick={() => showQueuePanel = true}><Menu class="h-5 w-5" /></Button>
    </div>
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
            {#if isHanteiMatch}
              <div class="flex gap-1 mt-2">{#each Array(akaRoundWins) as _}<span class="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold">●</span>{/each}</div>
            {:else}
              <div class="flex gap-1 mt-2">{#each p1Score as s}<span class="w-7 h-7 rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center text-sm font-bold">{SCORE_LABELS[s]}</span>{/each}</div>
            {/if}
          </div>
          <div class="px-4 text-center">
            {#if isHanteiMatch}
              <div class="text-4xl font-mono font-bold"><span class="text-red-400">{akaRoundWins}</span><span class="text-muted-foreground">:</span><span>{shiroRoundWins}</span></div>
              <div class="text-purple-400 text-xs mt-1 font-medium">ROUNDS</div>
            {:else}
              <div class="text-4xl font-mono font-bold"><span class="text-red-400">{Math.min(p1Score.length, winTarget)}</span><span class="text-muted-foreground">:</span><span>{Math.min(p2Score.length, winTarget)}</span></div>
              <div class="text-amber-400 text-sm mt-1">{p1Hansoku > 0 ? '▲'.repeat(p1Hansoku) : ''} · {p2Hansoku > 0 ? '▲'.repeat(p2Hansoku) : ''}</div>
            {/if}
          </div>
          <div class="flex-1 text-right">
            <p class="text-xs text-slate-300 mb-1 font-semibold">SHIRO</p>
            <p class="text-xl font-bold truncate">{getMemberName(currentMatch.player2Id)}</p>
            {#if isHanteiMatch}
              <div class="flex gap-1 mt-2 justify-end">{#each Array(shiroRoundWins) as _}<span class="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 text-sm font-bold">●</span>{/each}</div>
            {:else}
              <div class="flex gap-1 mt-2 justify-end">{#each p2Score as s}<span class="w-7 h-7 rounded-full border-2 border-slate-300 text-slate-300 flex items-center justify-center text-sm font-bold">{SCORE_LABELS[s]}</span>{/each}</div>
            {/if}
          </div>
        </div>
      </div>
      
      {#if isHanteiMatch}
        <!-- HANTEI SCORING UI -->
        <div class="flex-1 flex flex-col gap-3">
          <div class="bg-purple-950/30 rounded-xl p-4 border border-purple-900/50">
            <div class="text-center mb-4"><Badge variant="outline" class="text-lg px-4 py-1 border-purple-500 text-purple-400">Round {hanteiRound}</Badge></div>
            
            <!-- Combo selector -->
            <div class="mb-4">
              <p class="text-xs text-muted-foreground mb-2 text-center">Kihon-waza Combo</p>
              <ToggleGroup.Root type="single" bind:value={hanteiCombo} class="flex flex-wrap justify-center gap-2">
                {#each HANTEI_COMBOS as combo}
                  <ToggleGroup.Item value={combo.id} class="h-10 px-4 data-[state=on]:bg-purple-600 data-[state=on]:text-white">{combo.short}</ToggleGroup.Item>
                {/each}
              </ToggleGroup.Root>
            </div>
            
            <!-- Flag counters -->
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-xs text-red-400 mb-2 font-semibold">AKA FLAGS</p>
                <div class="flex justify-center gap-2 mb-3">
                  {#each [0, 1, 2, 3] as n}
                    <button onclick={() => akaFlags = n} class={cn("w-12 h-12 rounded-lg border-2 font-bold text-lg transition-all", akaFlags === n ? "bg-red-500 border-red-400 text-white" : "bg-red-950/50 border-red-900 text-red-400 hover:bg-red-900/50")}>{n}</button>
                  {/each}
                </div>
                <div class="flex justify-center gap-1">
                  {#each Array(akaFlags) as _}<Flag class="h-5 w-5 text-red-500 fill-red-500" />{/each}
                  {#each Array(3 - akaFlags) as _}<Flag class="h-5 w-5 text-red-900/50" />{/each}
                </div>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-300 mb-2 font-semibold">SHIRO FLAGS</p>
                <div class="flex justify-center gap-2 mb-3">
                  {#each [0, 1, 2, 3] as n}
                    <button onclick={() => shiroFlags = n} class={cn("w-12 h-12 rounded-lg border-2 font-bold text-lg transition-all", shiroFlags === n ? "bg-slate-300 border-slate-200 text-slate-800" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50")}>{n}</button>
                  {/each}
                </div>
                <div class="flex justify-center gap-1">
                  {#each Array(shiroFlags) as _}<Flag class="h-5 w-5 text-slate-300 fill-slate-300" />{/each}
                  {#each Array(3 - shiroFlags) as _}<Flag class="h-5 w-5 text-slate-700/50" />{/each}
                </div>
              </div>
            </div>
          </div>
          
          <Button onclick={submitHanteiRound} disabled={gameOver || akaFlags === shiroFlags} size="lg" class="h-16 text-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
            <Gavel class="h-6 w-6 mr-2" /> Record Round {hanteiRound}
            {#if akaFlags > shiroFlags}<span class="ml-2 text-red-300">→ AKA</span>{:else if shiroFlags > akaFlags}<span class="ml-2 text-slate-300">→ SHIRO</span>{/if}
          </Button>
          
          <div class="flex gap-2">
            <Button variant="secondary" onclick={undoHanteiRound} disabled={hanteiRounds.length === 0} class="flex-1 h-12"><Undo2 class="h-4 w-4 mr-2" /> Undo Round</Button>
            {#if hanteiRounds.length >= 2 && akaRoundWins === shiroRoundWins}
              <Button variant="outline" onclick={() => { pendingWinner = 'player1'; showWinModal = true; }} class="flex-1 h-12 border-red-500 text-red-400">AKA Wins</Button>
              <Button variant="outline" onclick={() => { pendingWinner = 'player2'; showWinModal = true; }} class="flex-1 h-12 border-slate-400 text-slate-300">SHIRO Wins</Button>
            {/if}
          </div>
          
          {#if hanteiRounds.length > 0}
            <div class="bg-card/50 rounded-lg p-3 border border-border">
              <p class="text-xs text-muted-foreground mb-2">Completed Rounds</p>
              <div class="space-y-1">
                {#each hanteiRounds as round}
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">R{round.round}: {round.combo}</span>
                    <span class={cn("font-mono", round.akaFlags > round.shiroFlags ? "text-red-400" : "text-slate-300")}>{round.akaFlags} - {round.shiroFlags} {round.akaFlags > round.shiroFlags ? '→ AKA' : '→ SHIRO'}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <!-- BOGU SCORING UI -->
        <div class="grid grid-cols-2 gap-3 flex-1 relative">
          {#if controlsLockedForMe}
            <div class="absolute inset-0 z-20 rounded-xl bg-black/50 backdrop-blur flex flex-col items-center justify-center gap-2 text-center px-4">
              <Lock class="h-8 w-8 text-amber-400" />
              <p class="text-xs text-amber-100">Court controls are locked while another facilitator is timing this match.</p>
            </div>
          {/if}
          <div class="bg-red-950/30 rounded-xl p-3 border border-red-900/50 flex flex-col gap-2">
            <div class="grid grid-cols-4 gap-2">{#each SCORE_BUTTONS as btn}<Button onclick={() => addScore('player1', btn.type)} disabled={gameOver || controlsLockedForMe} class="h-14 bg-red-600 hover:bg-red-500 disabled:opacity-50 font-bold text-lg">{btn.label}</Button>{/each}</div>
            <Button onclick={() => addHansoku('player1')} disabled={gameOver || controlsLockedForMe} class="h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 font-semibold">▲ Hansoku</Button>
            <div class="flex gap-2">
              <Button variant="secondary" onclick={() => undoScore('player1')} disabled={p1Score.length === 0 || controlsLockedForMe} class="flex-1 h-10"><Undo2 class="h-4 w-4 mr-1" /> Undo</Button>
              <Button variant="outline" onclick={() => declareForfeit('player1')} disabled={gameOver || controlsLockedForMe} class="flex-1 h-10 text-destructive border-destructive/50"><Flag class="h-4 w-4 mr-1" /> Forfeit</Button>
            </div>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex flex-col gap-2">
            <div class="grid grid-cols-4 gap-2">{#each SCORE_BUTTONS as btn}<Button onclick={() => addScore('player2', btn.type)} disabled={gameOver || controlsLockedForMe} variant="secondary" class="h-14 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 font-bold text-lg">{btn.label}</Button>{/each}</div>
            <Button onclick={() => addHansoku('player2')} disabled={gameOver || controlsLockedForMe} class="h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 font-semibold">Hansoku ▲</Button>
            <div class="flex gap-2">
              <Button variant="outline" onclick={() => declareForfeit('player2')} disabled={gameOver || controlsLockedForMe} class="flex-1 h-10 text-destructive border-destructive/50">Forfeit <Flag class="h-4 w-4 ml-1" /></Button>
              <Button variant="secondary" onclick={() => undoScore('player2')} disabled={p2Score.length === 0 || controlsLockedForMe} class="flex-1 h-10">Undo <Undo2 class="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Timer -->
      <div class={cn("rounded-xl p-4 border relative overflow-hidden", timerExpired ? "bg-amber-950/50 border-amber-500" : "bg-card border-border")}>
        {#if controlsLockedForMe}
          <div class="absolute inset-0 z-20 bg-black/50 backdrop-blur flex flex-col items-center justify-center gap-2">
            <Lock class="h-7 w-7 text-amber-400" />
            <p class="text-xs text-amber-100">Timer is controlled by another device</p>
          </div>
        {/if}
        {#if timerExpired}<div class="bg-amber-500 text-black font-bold text-center py-2 rounded-lg mb-3">⏰ TIME!</div>{:else}<Progress value={progress} class="h-2 mb-3" />{/if}
        <div class="flex items-center justify-center gap-4">
          <Button onclick={toggleTimer} disabled={controlsLockedForMe} size="lg" class={cn("w-14 h-14 rounded-full font-bold text-lg", timerRunning ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-emerald-500 hover:bg-emerald-400", controlsLockedForMe && "opacity-60")}>{#if timerRunning}<Pause class="h-6 w-6" />{:else}<Play class="h-6 w-6" />{/if}</Button>
          <span class="text-4xl font-mono font-bold tabular-nums">{formatTime(displaySeconds)}</span>
          <Button variant="secondary" onclick={resetTimer} disabled={controlsLockedForMe}><RotateCcw class="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onclick={() => addTime(30)} disabled={!currentMatch || currentMatch.status === 'completed' || controlsLockedForMe}>+0:30</Button>
          <Button variant="outline" size="sm" onclick={() => addTime(60)} disabled={!currentMatch || currentMatch.status === 'completed' || controlsLockedForMe}>+1:00</Button>
          <Button variant="outline" size="sm" onclick={declareTie} disabled={!timerExpired || !currentMatch || currentMatch.status === 'completed' || currentMatch.isSuddenDeath || controlsLockedForMe} class="border-amber-500 text-amber-400">Declare Tie</Button>
        </div>
      </div>
      
      {#if pendingMatches.length > 1}
        {@const next = pendingMatches[1]}
        <div class="bg-card/50 rounded-lg p-3 border border-border/50">
          <div class="text-xs text-muted-foreground mb-1">UP NEXT</div>
          <div class="flex items-center justify-between">
            <span class="text-sm">{getMemberName(next.player1Id)} vs {getMemberName(next.player2Id)}</span>
            <div class="flex gap-1">
              <Badge variant="outline" class="text-xs">{getGroupName(next.groupId)}</Badge>
              {#if next.matchType === 'hantei'}<Badge variant="outline" class="text-xs border-purple-500 text-purple-400">H</Badge>{/if}
              {#if next.isSuddenDeath}<Badge variant="outline" class="text-xs border-amber-500 text-amber-400">SD</Badge>{/if}
            </div>
          </div>
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
      <Button variant="secondary" onclick={() => { if (isHanteiMatch) undoHanteiRound(); else if (pendingWinner) undoScore(pendingWinner); }}><Undo2 class="h-4 w-4 mr-2" /> Undo</Button>
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
            <div class="flex gap-1 mt-1">
              <Badge variant="outline" class="text-xs">{getGroupName(m.groupId)}</Badge>
              {#if m.matchType === 'hantei'}<Badge variant="outline" class="text-xs border-purple-500 text-purple-400">Hantei</Badge>{/if}
              {#if m.isSuddenDeath}<Badge variant="outline" class="text-xs border-amber-500 text-amber-400">SD</Badge>{/if}
            </div>
          </div>
        {:else}<p class="text-muted-foreground text-sm text-center py-4">No pending matches</p>{/each}
      </div>
      <div class="mt-4 pt-4 border-t border-border"><Button variant="outline" class="w-full" asChild><a href="/admin"><Swords class="h-4 w-4 mr-2" /> Admin Portal</a></Button></div>
    </div>
  </Sheet.Content>
</Sheet.Root>
{/if}
{/if}
