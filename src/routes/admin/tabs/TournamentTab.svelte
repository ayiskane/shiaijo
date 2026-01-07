<script lang="ts">
  import autoAnimate from '@formkit/auto-animate';
  import { cn } from '$lib/utils';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Progress } from '$lib/components/ui/progress';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import {
    Trophy, Users, Swords, Play, Settings, Archive, ChevronDown, GripVertical,
    Check, Timer, Lock, RotateCcw, Trash2, UserPlus, KeyRound, RefreshCw
  } from '@lucide/svelte';

  export let tournaments: any[] = [];
  export let selectedTournamentId: string | null = null;
  export let selectedTournament: any;
  export let tournamentSelectorLabel = 'Select tournament';
  export let setupStep = 1;
  export let participants: any[] = [];
  export let matches: any[] = [];
  export let groupOrder: string[] = [];
  export let groups: any[] = [];
  export let membersByGroupId: Map<string, any[]> = new Map();
  export let matchesByGroupId: Map<string, any[]> = new Map();
  export let matchStatsByGroup: Map<string, any> = new Map();
  export let collapsedGroups: Set<string> = new Set();
  export let courtAMatches: any[] = [];
  export let courtBMatches: any[] = [];
  export let courtACompletedCount = 0;
  export let courtBCompletedCount = 0;
  export let currentCourtAMatch: any = null;
  export let currentCourtBMatch: any = null;
  export let pendingMatches: any[] = [];
  export let inProgressMatches: any[] = [];
  export let completedMatches: any[] = [];
  export let progressPercent = 0;
  export let isComplete = false;
  export let boguTimerDuration = 180;
  export let boguMatchType: 'sanbon' | 'ippon' = 'sanbon';
  export let timerDisplayMode: 'up' | 'down' = 'up';
  export let hanteiRound1: string[] = ['K', 'M'];
  export let hanteiRound2: string[] = ['M', 'K', 'D'];
  export let KIHON_WAZA_OPTIONS: { id: string; short: string }[] = [];
  export let TIMER_OPTIONS: number[] = [];
  export let SCORE_LABELS: Record<number, string> = {};
  export let settingsSheetOpen = false;
  export let adminPasscodeInput = '';
  export let courtkeeperPasscodeInput = '';
  export let adminPasscode: string | null = null;
  export let courtkeeperPasscode: string | null = null;

  export let onOpenCreateTournament: () => void;
  export let onAddAllParticipants: () => void;
  export let onGenerateMatches: () => void;
  export let onStartTournament: () => void;
  export let onCompleteTournament: () => void;
  export let onOpenSettings: () => void;
  export let onResetTournament: () => void;
  export let onDeleteTournament: () => void;
  export let onSetGroupCourt: (groupId: string, court: 'A' | 'B' | 'A+B') => void;
  export let onToggleGroupCollapse: (groupId: string) => void;
  export let onDragStart: (e: DragEvent, groupId: string) => void;
  export let onDragOver: (e: DragEvent, groupId: string) => void;
  export let onDragLeave: (e: DragEvent) => void;
  export let onDrop: (e: DragEvent, groupId: string) => void;
  export let onDragEnd: () => void;
  export let onApplyBoguSettings: () => void;
  export let onApplyTimerDisplayMode: () => void;
  export let onApplyHanteiSettings: () => void;
  export let onSaveAdminPasscode: () => void;
  export let onSaveCourtkeeperPasscode: () => void;
  export let onLockAdmin: () => void;
  export let onRefreshParticipants: () => void;
  export let getGroupById: (groupId: string) => any;
  export let getEffectiveCourt: (groupId: string) => 'A' | 'B' | 'A+B';
  export let getMemberById: (id: string) => any;
  export let formatTimer: (secs: number) => string;

  let listEl: HTMLElement;
  $: listEl && autoAnimate(listEl);
  // mark externally-provided props as used to satisfy runes a11y checks
  const _keepProps = [groups, pendingMatches, SCORE_LABELS];
</script>

<!-- Header -->
<div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <h1 class="text-2xl font-bold">Tournament</h1>
  <Button onclick={onOpenCreateTournament} class="w-full sm:w-auto"><Plus class="mr-2 h-4 w-4" /> New Tournament</Button>
</div>

{#if tournaments.length === 0}
  <Card.Root class="border-dashed">
    <Card.Content class="flex flex-col items-center justify-center py-12">
      <Trophy class="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p class="mb-4 text-muted-foreground">No tournaments yet</p>
      <Button onclick={onOpenCreateTournament}>Create Your First Tournament</Button>
    </Card.Content>
  </Card.Root>
{:else}
  <div class="mb-4">
    <Select.Root type="single" bind:value={selectedTournamentId}>
      <Select.Trigger class="w-full rounded-xl h-12">
        {tournamentSelectorLabel}
      </Select.Trigger>
      <Select.Content>
        {#each tournaments as t (t._id)}
          <Select.Item value={t._id} label={`${t.name} - ${t.status}`}>
            <div class="flex items-center justify-between w-full">
              <span>{t.name}</span>
              <Badge variant="outline" class={cn(
                'ml-2 text-[10px]',
                t.status === 'in_progress'
                  ? 'border-amber-500 text-amber-400'
                  : t.status === 'setup'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-emerald-500 text-emerald-400'
              )}>
                {t.status === 'setup' ? 'Setup' : t.status === 'in_progress' ? 'Live' : 'Done'}
              </Badge>
            </div>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  {#if selectedTournament}
    {#if selectedTournament.status === 'setup'}
      <div class="text-center mb-6">
        <h2 class="text-xl font-bold">{selectedTournament.name}</h2>
        <p class="text-sm text-muted-foreground">📅 {selectedTournament.date}</p>
      </div>

      <div class="flex items-center justify-between mb-8 relative px-2">
        {#each [
          { num: 1, name: 'Created', icon: '✓' },
          { num: 2, name: 'Participants', icon: '👥' },
          { num: 3, name: 'Groups', icon: '⚙️' },
          { num: 4, name: 'Ready', icon: '⚔️' }
        ] as step}
          {@const isActive = step.num === setupStep}
          {@const isCompleteStep = step.num < setupStep}
          <div class="flex flex-col items-center flex-1 z-10">
            <div class={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center text-base mb-1 transition-all',
              isCompleteStep
                ? 'bg-emerald-500 text-white'
                : isActive
                ? 'bg-amber-500 ring-4 ring-amber-500/30 text-black'
                : 'bg-muted text-muted-foreground'
            )}>
              {isCompleteStep ? '✓' : step.icon}
            </div>
            <span class={cn('text-[10px]', isActive ? 'text-amber-400 font-medium' : 'text-muted-foreground')}>
              {step.name}
            </span>
          </div>
        {/each}
        <div class="absolute top-5 left-12 right-12 h-0.5 bg-muted -z-0">
          <div class="h-full bg-emerald-500 transition-all" style={`width: ${((setupStep - 1) / 3) * 100}%`}></div>
        </div>
      </div>

      <Card.Root class="mb-4">
        <Card.Content class="pt-6 space-y-4">
          {#if participants.length === 0}
            <div class="text-center py-6">
              <Users class="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 class="font-bold text-lg mb-2">Add Participants</h3>
              <p class="text-sm text-muted-foreground mb-4">Register members to compete in this tournament</p>
              <Button onclick={onAddAllParticipants} class="w-full sm:w-auto">
                <UserPlus class="mr-2 h-4 w-4" /> Add All Registered Members
              </Button>
            </div>
          {:else if matches.length === 0}
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-lg">Configure Groups</h3>
                  <p class="text-sm text-muted-foreground">{participants.length} participants ready</p>
                </div>
                <Badge class="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{participants.length} ready</Badge>
              </div>

              {#if groupOrder.length > 0}
                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">Drag to reorder • Tap court to change</p>
                  <div class="rounded-xl border border-border overflow-hidden" bind:this={listEl}>
                    {#each groupOrder as groupId, idx (groupId)}
                      {@const group = getGroupById(groupId)}
                      {@const court = getEffectiveCourt(groupId)}
                      {@const groupMembers = membersByGroupId.get(groupId) ?? []}
                      <div
                        draggable="true"
                        role="listitem"
                        ondragstart={(e) => onDragStart(e, groupId)}
                        ondragover={(e) => onDragOver(e, groupId)}
                        ondragleave={onDragLeave}
                        ondrop={(e) => onDrop(e, groupId)}
                        ondragend={onDragEnd}
                        class="flex items-center gap-2 px-3 py-3 border-b border-border last:border-b-0 transition-all min-h-[56px]"
                      >
                        <button class="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none shrink-0">
                          <GripVertical class="h-5 w-5" />
                        </button>
                        <span class="w-6 text-center text-sm font-mono text-muted-foreground shrink-0">{idx + 1}</span>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="font-medium truncate">{group?.name || groupId}</span>
                            {#if group?.isHantei}
                              <Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 px-1">H</Badge>
                            {/if}
                          </div>
                          <span class="text-xs text-muted-foreground">{groupMembers.length} members</span>
                        </div>
                        <ToggleGroup.Root type="single" value={court} onValueChange={(value) => value && onSetGroupCourt(groupId, value)} class="shrink-0">
                          <ToggleGroup.Item value="A" aria-label="Court A" class="w-9 h-9 text-xs font-bold data-[state=on]:bg-amber-500 data-[state=on]:text-black">A</ToggleGroup.Item>
                          <ToggleGroup.Item value="A+B" aria-label="Both Courts" class="w-9 h-9 text-xs font-bold data-[state=on]:bg-emerald-500 data-[state=on]:text-white">+</ToggleGroup.Item>
                          <ToggleGroup.Item value="B" aria-label="Court B" class="w-9 h-9 text-xs font-bold data-[state=on]:bg-sky-500 data-[state=on]:text-white">B</ToggleGroup.Item>
                        </ToggleGroup.Root>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <Button onclick={onGenerateMatches} class="w-full bg-amber-500 hover:bg-amber-600 text-black">
                <Trophy class="mr-2 h-4 w-4" /> Generate Matches
              </Button>
            </div>
          {:else}
            <div class="text-center py-6">
              <div class="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Swords class="h-8 w-8 text-amber-400" />
              </div>
              <h3 class="font-bold text-lg mb-2">Ready to Begin!</h3>
              <p class="text-sm text-muted-foreground mb-2">{matches.length} matches generated</p>
              <div class="flex justify-center gap-4 text-sm text-muted-foreground mb-6">
                <span class="text-amber-400">{courtAMatches.length} Court A</span>
                <span class="text-sky-400">{courtBMatches.length} Court B</span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onclick={onStartTournament} class="bg-emerald-500 hover:bg-emerald-600">
                  <Play class="mr-2 h-4 w-4" /> Start Tournament
                </Button>
                <Button onclick={onOpenSettings} variant="outline">
                  <Settings class="mr-2 h-4 w-4" /> Configure
                </Button>
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    {:else if selectedTournament.status === 'in_progress'}
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="font-bold text-xl">{selectedTournament.name}</h2>
          <p class="text-xs text-muted-foreground">📅 {selectedTournament.date}</p>
        </div>
        <div class="flex items-center gap-2">
          <Badge class={cn('px-3 py-1', isComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')}>
            {isComplete ? '✓ Done' : '● Live'}
          </Badge>
          <Button onclick={onOpenSettings} variant="outline" size="icon" class="h-10 w-10">
            <Settings class="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card.Root class="mb-4">
        <Card.Content class="py-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted-foreground">Tournament Progress</span>
            <span class="text-sm font-bold text-amber-400">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} class="h-2" />
          <div class="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedMatches.length} completed</span>
            <span>{matches.length - completedMatches.length} remaining</span>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="rounded-2xl p-3 border-2 bg-amber-950/20 border-amber-500/50">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xl font-black text-amber-400">Court A</div>
            <div class="text-xs text-muted-foreground">{courtACompletedCount}/{courtAMatches.length}</div>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div class="h-full bg-amber-500 rounded-full" style={`width: ${courtAMatches.length > 0 ? (courtACompletedCount / courtAMatches.length) * 100 : 0}%`}></div>
          </div>
          {#if currentCourtAMatch}
            {@const p1 = getMemberById(currentCourtAMatch.player1Id)}
            {@const p2 = getMemberById(currentCourtAMatch.player2Id)}
            <div class="text-center">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Now Playing</div>
              <div class="text-sm font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}.</div>
              <div class="text-xs text-muted-foreground my-0.5">vs</div>
              <div class="text-sm font-medium">{p2?.firstName} {p2?.lastName?.charAt(0)}.</div>
            </div>
          {:else}
            <div class="text-center text-xs text-muted-foreground py-2">No active match</div>
          {/if}
        </div>

        <div class="rounded-2xl p-3 border-2 bg-sky-950/20 border-sky-500/50">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xl font-black text-sky-400">Court B</div>
            <div class="text-xs text-muted-foreground">{courtBCompletedCount}/{courtBMatches.length}</div>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div class="h-full bg-sky-500 rounded-full" style={`width: ${courtBMatches.length > 0 ? (courtBCompletedCount / courtBMatches.length) * 100 : 0}%`}></div>
          </div>
          {#if currentCourtBMatch}
            {@const p1 = getMemberById(currentCourtBMatch.player1Id)}
            {@const p2 = getMemberById(currentCourtBMatch.player2Id)}
            <div class="text-center">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Now Playing</div>
              <div class="text-sm font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}.</div>
              <div class="text-xs text-muted-foreground my-0.5">vs</div>
              <div class="text-sm font-medium">{p2?.firstName} {p2?.lastName?.charAt(0)}.</div>
            </div>
          {:else}
            <div class="text-center text-xs text-muted-foreground py-2">No active match</div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2 mb-4">
        <div class="rounded-xl bg-muted/50 p-2 text-center"><div class="text-lg font-bold text-primary">{participants.length}</div><div class="text-[10px] text-muted-foreground">Players</div></div>
        <div class="rounded-xl bg-muted/50 p-2 text-center"><div class="text-lg font-bold text-blue-400">{matches.length}</div><div class="text-[10px] text-muted-foreground">Matches</div></div>
        <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-center"><div class="text-lg font-bold text-emerald-400">{completedMatches.length}</div><div class="text-[10px] text-muted-foreground">Done</div></div>
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-center"><div class="text-lg font-bold text-amber-400">{inProgressMatches.length}</div><div class="text-[10px] text-muted-foreground">Live</div></div>
      </div>

      {#if isComplete}
        <Card.Root class="mb-4 bg-emerald-500/10 border-emerald-500/30">
          <Card.Content class="py-4 text-center">
            <p class="text-sm text-emerald-400 mb-3">🎉 All matches completed!</p>
            <Button onclick={onCompleteTournament} class="bg-emerald-500 hover:bg-emerald-600">
              <Archive class="mr-2 h-4 w-4" /> Archive Tournament
            </Button>
          </Card.Content>
        </Card.Root>
      {/if}

      {#if groupOrder.length > 0 && matches.length > 0}
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-muted-foreground">Match Queue</h3>
          <div class="space-y-2" bind:this={listEl}>
            {#each groupOrder as groupId (groupId)}
              {@const group = getGroupById(groupId)}
              {@const groupMatches = matchesByGroupId.get(groupId) ?? []}
              {@const groupStats = matchStatsByGroup.get(groupId) ?? { total: 0, completed: 0, inProgress: 0, pending: 0 }}
              {@const court = getEffectiveCourt(groupId)}
              {@const isCollapsed = collapsedGroups.has(groupId)}
              <div class={cn('rounded-xl border bg-card overflow-hidden transition-all', court === 'A' ? 'border-amber-700/30' : court === 'B' ? 'border-sky-700/30' : 'border-emerald-700/30')}>
                <button onclick={() => onToggleGroupCollapse(groupId)} class="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors">
                  <ChevronDown class={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isCollapsed && '-rotate-90')} />
                  <Badge class={cn('text-[10px] font-bold shrink-0', court === 'A' ? 'bg-amber-500 text-black' : court === 'B' ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white')}>
                    {court === 'A+B' ? 'A+B' : court}
                  </Badge>
                  <span class="font-medium flex-1 text-left truncate min-w-0">{group?.name || groupId}</span>
                  {#if group?.isHantei}<Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 shrink-0">H</Badge>{/if}
                  <span class="text-xs text-muted-foreground shrink-0">{groupStats.completed}/{groupStats.total}</span>
                </button>
                {#if !isCollapsed}
                  <div class="border-t border-border max-h-48 overflow-y-auto">
                    {#each groupMatches as match, idx}
                      {@const p1 = getMemberById(match.player1Id)}
                      {@const p2 = getMemberById(match.player2Id)}
                      {@const isWinner1 = match.winner === match.player1Id}
                      {@const isWinner2 = match.winner === match.player2Id}
                      <div class={cn('flex items-center gap-2 px-3 py-2 text-sm border-b border-border last:border-b-0', match.status === 'completed' ? 'bg-muted/30' : match.status === 'in_progress' ? 'bg-emerald-500/10' : 'bg-card')}>
                        <span class={cn('truncate flex-1', isWinner1 && 'font-semibold text-green-400')}>{p1?.firstName} {p1?.lastName?.charAt(0)}.</span>
                        <span class="text-xs text-muted-foreground">{match.player1Score.length} - {match.player2Score.length}</span>
                        <span class={cn('truncate flex-1 text-right', isWinner2 && 'font-semibold text-green-400')}>{p2?.firstName} {p2?.lastName?.charAt(0)}.</span>
                      </div>
                    {:else}
                      <p class="py-4 text-center text-sm text-muted-foreground">No matches</p>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <Card.Root class="mb-4">
        <Card.Content class="py-8 text-center">
          <Trophy class="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 class="text-xl font-bold mb-2">Tournament Completed</h2>
          <p class="text-muted-foreground mb-4">{selectedTournament.name}</p>
          <div class="flex justify-center gap-4 text-sm">
            <span>{participants.length} participants</span>
            <span>{matches.length} matches</span>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
{/if}

<Sheet.Root bind:open={settingsSheetOpen}>
  <Sheet.Content side="bottom" class="h-[85vh] rounded-t-3xl">
    <div class="flex justify-center pt-2 pb-4"><div class="w-10 h-1 bg-muted-foreground/30 rounded-full"></div></div>
    <Sheet.Header class="px-6 pb-4">
      <Sheet.Title>Tournament Settings</Sheet.Title>
      <Sheet.Description>Configure groups, courts, and match settings</Sheet.Description>
    </Sheet.Header>

    <div class="px-6 pb-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]">
      <div class="space-y-3">
        <h4 class="text-sm font-semibold flex items-center gap-2"><GripVertical class="h-4 w-4 text-muted-foreground" />Group Order & Courts</h4>
        <p class="text-xs text-muted-foreground">Drag to reorder. Tap court badge to change.</p>
        {#if groupOrder.length > 0}
          <div class="rounded-xl border border-border overflow-hidden" bind:this={listEl}>
            {#each groupOrder as groupId, idx (groupId)}
              {@const group = getGroupById(groupId)}
              {@const court = getEffectiveCourt(groupId)}
              {@const groupMatches = matchesByGroupId.get(groupId) ?? []}
              {@const groupStats = matchStatsByGroup.get(groupId) ?? { total: 0, completed: 0, inProgress: 0, pending: 0 }}
              <div
                draggable="true"
                role="listitem"
                ondragstart={(e) => onDragStart(e, groupId)}
                ondragover={(e) => onDragOver(e, groupId)}
                ondragleave={onDragLeave}
                ondrop={(e) => onDrop(e, groupId)}
                ondragend={onDragEnd}
                class="flex items-center gap-2 px-3 py-3 border-b border-border last:border-b-0 transition-all min-h-[56px]"
              >
                <button class="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none shrink-0"><GripVertical class="h-5 w-5" /></button>
                <span class="w-6 text-center text-sm font-mono text-muted-foreground shrink-0">{idx + 1}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{group?.name || groupId}</div>
                  <span class="text-xs text-muted-foreground">{groupStats.completed}/{groupStats.total} matches</span>
                </div>
                <ToggleGroup.Root type="single" value={court} onValueChange={(value) => value && onSetGroupCourt(groupId, value)} class="shrink-0">
                  <ToggleGroup.Item value="A" aria-label="Court A" class="px-3 py-2 text-xs font-bold data-[state=on]:bg-amber-500 data-[state=on]:text-black">A</ToggleGroup.Item>
                  <ToggleGroup.Item value="A+B" aria-label="Both Courts" class="px-2 py-2 text-xs font-bold data-[state=on]:bg-emerald-500 data-[state=on]:text-white">+</ToggleGroup.Item>
                  <ToggleGroup.Item value="B" aria-label="Court B" class="px-3 py-2 text-xs font-bold data-[state=on]:bg-sky-500 data-[state=on]:text-white">B</ToggleGroup.Item>
                </ToggleGroup.Root>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-muted-foreground py-4 text-center">No groups yet.</p>
        {/if}
      </div>

      <Separator />

      <div class="space-y-3">
        <h4 class="text-sm font-semibold flex items-center gap-2"><Swords class="h-4 w-4 text-blue-400" />Bogu Matches</h4>
        <div class="space-y-3">
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Timer</Label>
            <div class="flex gap-2">
              {#each TIMER_OPTIONS as secs}
                <button
                  onclick={() => (boguTimerDuration = secs)}
                  class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', boguTimerDuration === secs ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}
                >
                  {formatTimer(secs)}
                </button>
              {/each}
            </div>
          </div>

          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Match Type</Label>
            <div class="flex gap-2">
              <button onclick={() => (boguMatchType = 'sanbon')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', boguMatchType === 'sanbon' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Sanbon</button>
              <button onclick={() => (boguMatchType = 'ippon')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', boguMatchType === 'ippon' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Ippon</button>
            </div>
          </div>

          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Timer Display</Label>
            <div class="flex gap-2">
              <button onclick={() => (timerDisplayMode = 'up')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', timerDisplayMode === 'up' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Count Up</button>
              <button onclick={() => (timerDisplayMode = 'down')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', timerDisplayMode === 'down' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Count Down</button>
            </div>
          </div>

          <Button onclick={onApplyBoguSettings} variant="secondary" size="sm" class="w-full"><Check class="mr-2 h-4 w-4" /> Apply to Bogu</Button>
          <Button onclick={onApplyTimerDisplayMode} variant="outline" size="sm" class="w-full"><Timer class="mr-2 h-4 w-4" /> Apply Timer Display</Button>
        </div>
      </div>

      <Separator />

      <div class="space-y-3">
        <h4 class="text-sm font-semibold flex items-center gap-2"><Users class="h-4 w-4 text-orange-400" />Non-Bogu (Hantei)</h4>
        <p class="text-xs text-muted-foreground">Kihon-waza for each round.</p>
        <div class="space-y-3">
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Round 1 (2 waza)</Label>
            <div class="grid grid-cols-2 gap-2">
              {#each [0, 1] as i}
                <select
                  value={hanteiRound1[i] || ''}
                  onchange={(e) => {
                    const newVal = [...hanteiRound1];
                    newVal[i] = (e.target as HTMLSelectElement).value;
                    hanteiRound1 = newVal;
                  }}
                  class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {#each KIHON_WAZA_OPTIONS as opt}
                    <option value={opt.id}>{opt.short}</option>
                  {/each}
                </select>
              {/each}
            </div>
          </div>
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Round 2 (3 waza)</Label>
            <div class="grid grid-cols-3 gap-2">
              {#each [0, 1, 2] as i}
                <select
                  value={hanteiRound2[i] || ''}
                  onchange={(e) => {
                    const newVal = [...hanteiRound2];
                    newVal[i] = (e.target as HTMLSelectElement).value;
                    hanteiRound2 = newVal;
                  }}
                  class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {#each KIHON_WAZA_OPTIONS as opt}
                    <option value={opt.id}>{opt.short}</option>
                  {/each}
                </select>
              {/each}
            </div>
          </div>
          <Button onclick={onApplyHanteiSettings} variant="secondary" size="sm" class="w-full"><Check class="mr-2 h-4 w-4" /> Apply Hantei</Button>
        </div>
      </div>

      <Separator />

      <div class="space-y-3">
        <h4 class="text-sm font-semibold flex items-center gap-2"><Lock class="h-4 w-4 text-red-400" />Security</h4>
        <p class="text-xs text-muted-foreground">Set portal passcodes. Leave blank to clear.</p>
        <div class="space-y-3">
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Admin Passcode</Label>
            <div class="flex gap-2">
              <Input type="password" bind:value={adminPasscodeInput} placeholder={adminPasscode ? "••••••••" : "Set admin passcode"} class="text-sm" />
              <Button onclick={onSaveAdminPasscode} variant="secondary" size="sm">
                <KeyRound class="mr-2 h-4 w-4" /> Save
              </Button>
            </div>
            <p class="text-[10px] text-muted-foreground">Status: {adminPasscode ? 'Set' : 'Not set'}</p>
          </div>
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Courtkeeper Passcode</Label>
            <div class="flex gap-2">
              <Input type="password" bind:value={courtkeeperPasscodeInput} placeholder={courtkeeperPasscode ? "••••••••" : "Set courtkeeper passcode"} class="text-sm" />
              <Button onclick={onSaveCourtkeeperPasscode} variant="secondary" size="sm">
                <KeyRound class="mr-2 h-4 w-4" /> Save
              </Button>
            </div>
            <p class="text-[10px] text-muted-foreground">Status: {courtkeeperPasscode ? 'Set' : 'Not set'}</p>
          </div>
          <Button onclick={onLockAdmin} variant="outline" size="sm" class="w-full">
            <Lock class="mr-2 h-4 w-4" /> Lock Admin
          </Button>
        </div>

        <Separator />

        <div class="space-y-3">
          <h4 class="text-sm font-semibold flex items-center gap-2"><RefreshCw class="h-4 w-4 text-muted-foreground" /> Actions</h4>
          <div class="space-y-2">
            <Button onclick={onRefreshParticipants} variant="outline" size="sm" class="w-full justify-start">
              <RefreshCw class="mr-2 h-4 w-4" /> Update Participants
            </Button>
            <Button onclick={onResetTournament} variant="outline" size="sm" class="w-full justify-start border-amber-700/60 text-amber-400 hover:bg-amber-900/20">
              <RotateCcw class="mr-2 h-4 w-4" /> Reset All Scores
            </Button>
            <Button onclick={onDeleteTournament} variant="outline" size="sm" class="w-full justify-start border-red-700/60 text-red-400 hover:bg-red-900/20">
              <Trash2 class="mr-2 h-4 w-4" /> Delete Tournament
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
