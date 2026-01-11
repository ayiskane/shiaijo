<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { cn } from '$lib/utils';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
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
    Check, Timer, Lock, RotateCcw, Trash2, UserPlus, KeyRound, RefreshCw, Plus,
    Search, X, ChevronRight, CheckCircle2, Circle, ArrowRight
  } from '@lucide/svelte';
  
  const isMobile = new IsMobile();

  // Props using Svelte 5 runes
  let {
    tournaments = [],
    selectedTournamentId = $bindable(null),
    selectedTournament,
    tournamentSelectorLabel = 'Select tournament',
    setupStep = 1,
    participants = [],
    matches = [],
    groupOrder = [],
    groups = [],
    members = [],
    membersByGroupId = new Map(),
    matchesByGroupId = new Map(),
    matchStatsByGroup = new Map(),
    collapsedGroups = new Set(),
    courtAMatches = [],
    courtBMatches = [],
    courtACompletedCount = 0,
    courtBCompletedCount = 0,
    currentCourtAMatch = null,
    currentCourtBMatch = null,
    pendingMatches = [],
    inProgressMatches = [],
    completedMatches = [],
    progressPercent = 0,
    isComplete = false,
    boguTimerDuration = $bindable(180),
    boguMatchType = $bindable<'sanbon' | 'ippon'>('sanbon'),
    timerDisplayMode = $bindable<'up' | 'down'>('up'),
    hanteiRound1 = $bindable(['K', 'M']),
    hanteiRound2 = $bindable(['M', 'K', 'D']),
    KIHON_WAZA_OPTIONS = [],
    TIMER_OPTIONS = [],
    SCORE_LABELS = {},
    settingsSheetOpen = $bindable(false),
    adminPasscodeInput = $bindable(''),
    courtkeeperPasscodeInput = $bindable(''),
    adminPasscode = null,
    courtkeeperPasscode = null,
    registeredMemberIds = new Set<string>(),
    onOpenCreateTournament,
    onAddAllParticipants,
    onClearAllParticipants,
    onRegisterMember,
    onUnregisterMember,
    onRegisterGroupMembers,
    onUnregisterGroupMembers,
    onGenerateMatches,
    onStartTournament,
    onCompleteTournament,
    onOpenSettings,
    onCloseSettings = undefined,
    onResetTournament,
    onDeleteTournament,
    onSetGroupCourt,
    onToggleGroupCollapse,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onApplyBoguSettings,
    onApplyTimerDisplayMode,
    onApplyHanteiSettings,
    onSaveAdminPasscode,
    onSaveCourtkeeperPasscode,
    onLockAdmin,
    onRefreshParticipants,
    getGroupById,
    getEffectiveCourt,
    getMemberById,
    getGroupName,
    formatTimer,
    buildScoreTimeline
  }: {
    tournaments?: any[];
    selectedTournamentId?: string | null;
    selectedTournament?: any;
    tournamentSelectorLabel?: string;
    setupStep?: number;
    participants?: any[];
    matches?: any[];
    groupOrder?: string[];
    groups?: any[];
    members?: any[];
    membersByGroupId?: Map<string, any[]>;
    matchesByGroupId?: Map<string, any[]>;
    matchStatsByGroup?: Map<string, any>;
    collapsedGroups?: Set<string>;
    courtAMatches?: any[];
    courtBMatches?: any[];
    courtACompletedCount?: number;
    courtBCompletedCount?: number;
    currentCourtAMatch?: any;
    currentCourtBMatch?: any;
    pendingMatches?: any[];
    inProgressMatches?: any[];
    completedMatches?: any[];
    progressPercent?: number;
    isComplete?: boolean;
    boguTimerDuration?: number;
    boguMatchType?: 'sanbon' | 'ippon';
    timerDisplayMode?: 'up' | 'down';
    hanteiRound1?: string[];
    hanteiRound2?: string[];
    KIHON_WAZA_OPTIONS?: { id: string; short: string }[];
    TIMER_OPTIONS?: number[];
    SCORE_LABELS?: Record<number, string>;
    settingsSheetOpen?: boolean;
    adminPasscodeInput?: string;
    courtkeeperPasscodeInput?: string;
    adminPasscode?: string | null;
    courtkeeperPasscode?: string | null;
    registeredMemberIds?: Set<string>;
    onOpenCreateTournament: () => void;
    onAddAllParticipants: () => void;
    onClearAllParticipants?: () => void;
    onRegisterMember?: (memberId: string) => void;
    onUnregisterMember?: (memberId: string) => void;
    onRegisterGroupMembers?: (groupId: string) => void;
    onUnregisterGroupMembers?: (groupId: string) => void;
    onGenerateMatches: () => void;
    onStartTournament: () => void;
    onCompleteTournament: () => void;
    onOpenSettings: () => void;
    onCloseSettings?: () => void;
    onResetTournament: () => void;
    onDeleteTournament: () => void;
    onSetGroupCourt: (groupId: string, court: 'A' | 'B' | 'A+B') => void;
    onToggleGroupCollapse: (groupId: string) => void;
    onDragStart: (e: DragEvent, groupId: string) => void;
    onDragOver: (e: DragEvent, groupId: string) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent, groupId: string) => void;
    onDragEnd: () => void;
    onApplyBoguSettings: () => void;
    onApplyTimerDisplayMode: () => void;
    onApplyHanteiSettings: () => void;
    onSaveAdminPasscode: () => void;
    onSaveCourtkeeperPasscode: () => void;
    onLockAdmin: () => void;
    onRefreshParticipants: () => void;
    getGroupById: (groupId: string) => any;
    getEffectiveCourt: (groupId: string) => 'A' | 'B' | 'A+B';
    getMemberById: (id: string) => any;
    getGroupName?: (groupId: string) => string;
    formatTimer: (secs: number) => string;
    buildScoreTimeline?: (match: any) => any[];
  } = $props();

  // Local state
  let registeredSearchQuery = $state('');
  let availableSearchQuery = $state('');
  let mobileParticipantTab = $state<'registered' | 'available'>('registered');
  let registeredListEl: HTMLElement | null = $state(null);
  let availableListEl: HTMLElement | null = $state(null);

  // Callback when sheet closes
  function handleSheetOpenChange(open: boolean) {
    if (!open && onCloseSettings) {
      onCloseSettings();
    }
    settingsSheetOpen = open;
  }

  function openSettings() {
    settingsSheetOpen = true;
    if (onOpenSettings) onOpenSettings();
  }

  $effect(() => {
    if (registeredListEl) autoAnimate(registeredListEl, { duration: 150 });
  });

  $effect(() => {
    if (availableListEl) autoAnimate(availableListEl, { duration: 150 });
  });

  // Compute current step (1-based)
  let currentStep = $derived.by(() => {
    if (participants.length === 0) return 1;
    if (matches.length === 0) return 2;
    return 3;
  });

  // Compute registered and available members
  let registeredMembers = $derived(
    members
      .filter(m => !m.archived && registeredMemberIds.has(m._id))
      .filter(m => {
        if (!registeredSearchQuery) return true;
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(registeredSearchQuery.toLowerCase());
      })
  );
  
  let availableMembers = $derived(
    members
      .filter(m => !m.archived && !registeredMemberIds.has(m._id))
      .filter(m => {
        if (!availableSearchQuery) return true;
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(availableSearchQuery.toLowerCase());
      })
  );

  // Group members by groupId for display
  let registeredByGroup = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const m of registeredMembers) {
      const arr = map.get(m.groupId) || [];
      arr.push(m);
      map.set(m.groupId, arr);
    }
    return map;
  });

  let availableByGroup = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const m of availableMembers) {
      const arr = map.get(m.groupId) || [];
      arr.push(m);
      map.set(m.groupId, arr);
    }
    return map;
  });

  // Get unique groups that have members
  let groupsWithRegistered = $derived([...registeredByGroup.keys()].map(gId => groups.find(g => g.groupId === gId)).filter(Boolean));
  let groupsWithAvailable = $derived([...availableByGroup.keys()].map(gId => groups.find(g => g.groupId === gId)).filter(Boolean));

  function getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  function handleRegisterMember(memberId: string) {
    if (onRegisterMember) onRegisterMember(memberId);
  }

  function handleUnregisterMember(memberId: string) {
    if (onUnregisterMember) onUnregisterMember(memberId);
  }

  function handleRegisterGroup(groupId: string) {
    if (onRegisterGroupMembers) onRegisterGroupMembers(groupId);
  }

  function handleUnregisterGroup(groupId: string) {
    if (onUnregisterGroupMembers) onUnregisterGroupMembers(groupId);
  }

  // Step descriptions
  function getStepDescription(stepNum: number): string {
    if (stepNum === 1) {
      return participants.length > 0 ? `${participants.length} members added` : 'Add tournament members';
    }
    if (stepNum === 2) {
      return matches.length > 0 ? `${matches.length} matches configured` : 'Assign courts & order';
    }
    return 'Review & begin';
  }

  // Next step label
  let nextStepLabel = $derived.by(() => {
    if (currentStep === 1) return 'Next: Courts';
    if (currentStep === 2) return 'Next: Start';
    return 'Start Tournament';
  });

  onMount(() => {
    console.debug('[admin] TournamentTab mounted', {
      tournamentsCount: tournaments.length,
      selectedTournamentId,
      matchesCount: matches.length,
      participantsCount: participants.length,
    });
  });
</script>

<!-- Top Bar -->
<div class="top-bar">
  <div class="top-bar-left">
    <span class="top-bar-breadcrumb">Admin</span>
    <span class="top-bar-title">
      Tournament Control
      {#if selectedTournament?.status === 'in_progress'}
        <span class="top-bar-badge live">Live</span>
      {/if}
    </span>
  </div>
  <div class="top-bar-right">
    <button class="btn-sm primary" onclick={onOpenCreateTournament}>+ New Tournament</button>
  </div>
</div>

{#if tournaments.length === 0}
  <!-- Empty State -->
  <Card.Root class="border-dashed border-2 border-border/50">
    <Card.Content class="flex flex-col items-center justify-center py-16">
      <div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <Trophy class="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 class="text-xl font-semibold mb-2">No tournaments yet</h3>
      <p class="text-muted-foreground mb-6 text-center max-w-sm">Create your first tournament to start managing matches and tracking results.</p>
      <Button size="lg" onclick={onOpenCreateTournament} class="gap-2">
        <Plus class="w-5 h-5" />
        Create Your First Tournament
      </Button>
    </Card.Content>
  </Card.Root>
{:else}
  <!-- Tournament Selector -->
  <div class="mb-6">
    <Label class="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Currently Editing Tournament</Label>
    <div class="flex items-center gap-3">
      <Select.Root type="single" bind:value={selectedTournamentId}>
        <Select.Trigger class="flex-1 rounded-xl h-14 border-2 border-primary/40 bg-card hover:border-primary/60 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy class="w-5 h-5 text-primary" />
            </div>
            <div class="text-left">
              <div class="font-medium">{selectedTournament?.name || 'Select tournament'}</div>
              {#if selectedTournament}
                <div class="text-xs text-muted-foreground">
                  {selectedTournament.status === 'setup' ? 'Setting up' : selectedTournament.status === 'in_progress' ? 'In progress' : 'Completed'}
                </div>
              {/if}
            </div>
          </div>
        </Select.Trigger>
        <Select.Content>
          {#each tournaments as t (t._id)}
            <Select.Item value={t._id} label={t.name}>
              <div class="flex items-center justify-between w-full py-1">
                <span>{t.name}</span>
                <Badge variant="outline" class={cn(
                  'ml-3 text-[10px]',
                  t.status === 'in_progress'
                    ? 'border-amber-500 text-amber-400'
                    : t.status === 'setup'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-emerald-500 text-emerald-400'
                )}>
                  {t.status === 'setup' ? 'Setup' : t.status === 'in_progress' ? 'Live' : 'Done'}
                </Badge>
              </div>
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      
      <!-- Delete Button -->
      <Button 
        variant="outline" 
        size="icon" 
        class="h-14 w-14 rounded-xl border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/60 shrink-0 transition-colors" 
        onclick={onDeleteTournament}
        title="Delete Tournament"
      >
        <Trash2 class="w-5 h-5 text-destructive" />
      </Button>
    </div>
  </div>

  {#if selectedTournament}
    {#if selectedTournament.status === 'setup'}
      <!-- SETUP MODE: Sidebar Stepper Layout -->
      <div class="flex gap-6 min-h-[600px]">
        <!-- Sidebar Stepper -->
        <div class="w-64 shrink-0 hidden lg:block">
          <div class="rounded-2xl border border-border bg-card p-4 sticky top-4">
            <div class="space-y-1 mb-6">
              {#each [
                { num: 1, name: 'Participants', desc: getStepDescription(1), icon: Users },
                { num: 2, name: 'Courts', desc: getStepDescription(2), icon: Settings },
                { num: 3, name: 'Start', desc: getStepDescription(3), icon: Play }
              ] as step}
                {@const isComplete = (step.num === 1 && participants.length > 0) || (step.num === 2 && matches.length > 0)}
                {@const isActive = currentStep === step.num}
                {@const StepIcon = step.icon}
                <button
                  class={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                    isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                  )}
                >
                  <div class={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {#if isComplete}
                      <Check class="w-4 h-4" />
                    {:else}
                      <StepIcon class="w-4 h-4" />
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class={cn(
                      'font-medium text-sm',
                      isActive ? 'text-primary' : isComplete ? 'text-emerald-400' : 'text-foreground'
                    )}>{step.name}</div>
                    <div class="text-xs text-muted-foreground truncate">{step.desc}</div>
                  </div>
                </button>
              {/each}
            </div>

            <!-- Progress -->
            <div class="pt-4 border-t border-border">
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="text-muted-foreground">Progress</span>
                <span class="font-medium">{currentStep - 1} of 3</span>
              </div>
              <Progress value={(currentStep - 1) / 3 * 100} class="h-2" />
            </div>

            <!-- Settings Button -->
            <Button variant="ghost" size="sm" class="w-full mt-4 justify-start" onclick={openSettings}>
              <Settings class="w-4 h-4 mr-2" />
              Tournament Settings
            </Button>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 min-w-0">
          <!-- Mobile Stepper (horizontal) -->
          <div class="lg:hidden mb-6">
            <div class="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
              {#each [1, 2, 3] as stepNum}
                {@const isComplete = (stepNum === 1 && participants.length > 0) || (stepNum === 2 && matches.length > 0)}
                {@const isActive = currentStep === stepNum}
                <div class="flex items-center gap-2">
                  <div class={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isComplete ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {#if isComplete}
                      <Check class="w-4 h-4" />
                    {:else}
                      {stepNum}
                    {/if}
                  </div>
                </div>
                {#if stepNum < 3}
                  <div class={cn('flex-1 h-0.5 mx-2', isComplete ? 'bg-emerald-500' : 'bg-muted')}></div>
                {/if}
              {/each}
            </div>
          </div>

          <!-- Step Content Card -->
          <Card.Root class="border-2">
            <Card.Header class="border-b border-border bg-muted/30">
              <div class="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" class="mb-2">Step {currentStep} of 3</Badge>
                  <Card.Title class="text-xl">
                    {#if currentStep === 1}
                      Participants
                    {:else if currentStep === 2}
                      Court Assignment
                    {:else}
                      Ready to Start
                    {/if}
                  </Card.Title>
                  <Card.Description>
                    {#if currentStep === 1}
                      Add members who will participate in this tournament
                    {:else if currentStep === 2}
                      Assign groups to courts and set the match order
                    {:else}
                      Review your setup and start the tournament
                    {/if}
                  </Card.Description>
                </div>
                <Button variant="ghost" size="icon" onclick={openSettings} class="lg:hidden">
                  <Settings class="w-5 h-5" />
                </Button>
              </div>
            </Card.Header>

            <Card.Content class="p-6">
              <!-- STEP 1: Participants -->
              {#if currentStep === 1 || (currentStep === 2 && matches.length === 0)}
                <!-- Summary Stats -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div class="text-2xl font-bold text-emerald-400">{participants.length}</div>
                    <div class="text-xs text-muted-foreground">Registered</div>
                  </div>
                  <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div class="text-2xl font-bold text-blue-400">{availableMembers.length}</div>
                    <div class="text-xs text-muted-foreground">Available</div>
                  </div>
                  {#each groupsWithRegistered.slice(0, 2) as group}
                    <div class="p-4 rounded-xl bg-muted/50 border border-border">
                      <div class="text-2xl font-bold">{registeredByGroup.get(group.groupId)?.length || 0}</div>
                      <div class="text-xs text-muted-foreground truncate">{group.name}</div>
                    </div>
                  {/each}
                </div>

                <!-- Dual Panel Layout -->
                {#if !isMobile.current}
                  <div class="grid grid-cols-2 gap-4">
                    <!-- Registered Panel (Left) -->
                    <div class="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 overflow-hidden flex flex-col max-h-[500px]">
                      <div class="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between">
                        <h3 class="font-semibold text-emerald-400 flex items-center gap-2">
                          <Check class="w-4 h-4" />
                          Registered
                          <Badge variant="secondary" class="bg-emerald-500/20 text-emerald-400">{registeredMembers.length}</Badge>
                        </h3>
                        {#if onClearAllParticipants && participants.length > 0}
                          <Button variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:text-destructive" onclick={onClearAllParticipants}>
                            Clear All
                          </Button>
                        {/if}
                      </div>
                      <div class="px-3 py-2 border-b border-emerald-500/20">
                        <div class="relative">
                          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="text" 
                            placeholder="Search registered..." 
                            bind:value={registeredSearchQuery}
                            class="pl-9 h-9 text-sm bg-background/50"
                          />
                        </div>
                      </div>
                      <div class="flex-1 overflow-y-auto p-2" bind:this={registeredListEl}>
                        {#each groupsWithRegistered as group (group.groupId)}
                          {@const groupMembers = registeredByGroup.get(group.groupId) || []}
                          <div class="mb-3">
                            <div class="flex items-center justify-between px-2 py-1.5 sticky top-0 bg-emerald-500/10 rounded-lg mb-1">
                              <span class="text-xs font-medium text-emerald-400">{group.name} ({groupMembers.length})</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                class="h-6 text-[10px] text-destructive/70 hover:text-destructive px-2"
                                onclick={() => handleUnregisterGroup(group.groupId)}
                              >
                                Remove All
                              </Button>
                            </div>
                            {#each groupMembers as member (member._id)}
                              <div class="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-500/10 group">
                                <div class="flex items-center gap-2">
                                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-medium text-emerald-400">
                                    {getInitials(member.firstName, member.lastName)}
                                  </div>
                                  <span class="text-sm">{member.firstName} {member.lastName}</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  class="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onclick={() => handleUnregisterMember(member._id)}
                                >
                                  <X class="w-4 h-4" />
                                </Button>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Users class="w-8 h-8 mb-2 opacity-50" />
                            <p class="text-sm">No participants yet</p>
                          </div>
                        {/each}
                      </div>
                    </div>

                    <!-- Available Panel (Right) -->
                    <div class="rounded-xl border-2 border-blue-500/30 bg-blue-500/5 overflow-hidden flex flex-col max-h-[500px]">
                      <div class="px-4 py-3 border-b border-blue-500/20 bg-blue-500/10 flex items-center justify-between">
                        <h3 class="font-semibold text-blue-400 flex items-center gap-2">
                          <UserPlus class="w-4 h-4" />
                          Available
                          <Badge variant="secondary" class="bg-blue-500/20 text-blue-400">{availableMembers.length}</Badge>
                        </h3>
                        {#if availableMembers.length > 0}
                          <Button variant="ghost" size="sm" class="h-7 text-xs text-blue-400 hover:text-blue-300" onclick={onAddAllParticipants}>
                            + Add All
                          </Button>
                        {/if}
                      </div>
                      <div class="px-3 py-2 border-b border-blue-500/20">
                        <div class="relative">
                          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="text" 
                            placeholder="Search available..." 
                            bind:value={availableSearchQuery}
                            class="pl-9 h-9 text-sm bg-background/50"
                          />
                        </div>
                      </div>
                      <div class="flex-1 overflow-y-auto p-2" bind:this={availableListEl}>
                        {#each groupsWithAvailable as group (group.groupId)}
                          {@const groupMembers = availableByGroup.get(group.groupId) || []}
                          <div class="mb-3">
                            <div class="flex items-center justify-between px-2 py-1.5 sticky top-0 bg-blue-500/10 rounded-lg mb-1">
                              <span class="text-xs font-medium text-blue-400">{group.name} ({groupMembers.length})</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                class="h-6 text-[10px] text-blue-400/70 hover:text-blue-300 px-2"
                                onclick={() => handleRegisterGroup(group.groupId)}
                              >
                                + Add All
                              </Button>
                            </div>
                            {#each groupMembers as member (member._id)}
                              <div class="flex items-center justify-between p-2 rounded-lg hover:bg-blue-500/10 group">
                                <div class="flex items-center gap-2">
                                  <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-400">
                                    {getInitials(member.firstName, member.lastName)}
                                  </div>
                                  <span class="text-sm">{member.firstName} {member.lastName}</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  class="h-7 w-7 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  onclick={() => handleRegisterMember(member._id)}
                                >
                                  <Plus class="w-4 h-4" />
                                </Button>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Check class="w-8 h-8 mb-2 opacity-50" />
                            <p class="text-sm">All members registered!</p>
                          </div>
                        {/each}
                      </div>
                    </div>
                  </div>
                {:else}
                  <!-- Mobile: Tab View -->
                  <div class="rounded-xl border border-border overflow-hidden">
                    <div class="flex border-b border-border">
                      <button
                        class={cn(
                          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                          mobileParticipantTab === 'registered' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-muted-foreground'
                        )}
                        onclick={() => mobileParticipantTab = 'registered'}
                      >
                        Registered ({registeredMembers.length})
                      </button>
                      <button
                        class={cn(
                          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                          mobileParticipantTab === 'available' ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500' : 'text-muted-foreground'
                        )}
                        onclick={() => mobileParticipantTab = 'available'}
                      >
                        Available ({availableMembers.length})
                      </button>
                    </div>
                    <div class="p-3 max-h-[400px] overflow-y-auto">
                      {#if mobileParticipantTab === 'registered'}
                        {#each groupsWithRegistered as group (group.groupId)}
                          {@const groupMembers = registeredByGroup.get(group.groupId) || []}
                          <div class="mb-3">
                            <div class="flex items-center justify-between px-2 py-1.5 bg-emerald-500/10 rounded-lg mb-1">
                              <span class="text-xs font-medium text-emerald-400">{group.name}</span>
                              <Button variant="ghost" size="sm" class="h-6 text-[10px]" onclick={() => handleUnregisterGroup(group.groupId)}>Remove All</Button>
                            </div>
                            {#each groupMembers as member (member._id)}
                              <div class="flex items-center justify-between p-2">
                                <span class="text-sm">{member.firstName} {member.lastName}</span>
                                <Button variant="ghost" size="sm" class="h-7 text-destructive" onclick={() => handleUnregisterMember(member._id)}>Remove</Button>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <p class="text-center text-muted-foreground py-8">No participants yet</p>
                        {/each}
                      {:else}
                        {#each groupsWithAvailable as group (group.groupId)}
                          {@const groupMembers = availableByGroup.get(group.groupId) || []}
                          <div class="mb-3">
                            <div class="flex items-center justify-between px-2 py-1.5 bg-blue-500/10 rounded-lg mb-1">
                              <span class="text-xs font-medium text-blue-400">{group.name}</span>
                              <Button variant="ghost" size="sm" class="h-6 text-[10px]" onclick={() => handleRegisterGroup(group.groupId)}>+ Add All</Button>
                            </div>
                            {#each groupMembers as member (member._id)}
                              <div class="flex items-center justify-between p-2">
                                <span class="text-sm">{member.firstName} {member.lastName}</span>
                                <Button variant="ghost" size="sm" class="h-7 text-blue-400" onclick={() => handleRegisterMember(member._id)}>+ Add</Button>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <p class="text-center text-muted-foreground py-8">All members registered!</p>
                        {/each}
                      {/if}
                    </div>
                  </div>
                {/if}
              {/if}

              <!-- STEP 2: Courts (only when participants > 0 and matches === 0) -->
              {#if currentStep === 2 && participants.length > 0 && matches.length === 0}
                <div class="space-y-4">
                  <p class="text-sm text-muted-foreground mb-4">
                    Drag groups to reorder. Tap A, A+B, or B to assign courts.
                  </p>
                  
                  {#each groupOrder as groupId, idx (groupId)}
                    {@const group = getGroupById(groupId)}
                    {@const court = getEffectiveCourt(groupId)}
                    {#if group}
                      <div
                        class="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-grab"
                        draggable="true"
                        ondragstart={(e) => onDragStart(e, groupId)}
                        ondragover={(e) => onDragOver(e, groupId)}
                        ondragleave={onDragLeave}
                        ondrop={(e) => onDrop(e, groupId)}
                        ondragend={onDragEnd}
                      >
                        <div class="text-muted-foreground cursor-grab">
                          <GripVertical class="w-5 h-5" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium">{group.name}</div>
                          <div class="text-xs text-muted-foreground">
                            {membersByGroupId.get(groupId)?.filter(m => registeredMemberIds.has(m._id)).length || 0} participants
                            {#if group.isHantei}
                              <Badge variant="outline" class="ml-2 text-[10px]">Hantei</Badge>
                            {/if}
                          </div>
                        </div>
                        <ToggleGroup.Root
                          type="single"
                          value={court}
                          onValueChange={(val) => val && onSetGroupCourt(groupId, val as 'A' | 'B' | 'A+B')}
                          class="bg-muted rounded-lg p-1"
                        >
                          <ToggleGroup.Item value="A" class={cn('px-3 py-1.5 text-xs rounded-md', court === 'A' && 'bg-amber-500 text-white')}>A</ToggleGroup.Item>
                          <ToggleGroup.Item value="A+B" class={cn('px-3 py-1.5 text-xs rounded-md', court === 'A+B' && 'bg-emerald-500 text-white')}>A+B</ToggleGroup.Item>
                          <ToggleGroup.Item value="B" class={cn('px-3 py-1.5 text-xs rounded-md', court === 'B' && 'bg-sky-500 text-white')}>B</ToggleGroup.Item>
                        </ToggleGroup.Root>
                      </div>
                    {/if}
                  {/each}

                  <Button onclick={onGenerateMatches} class="w-full mt-6" size="lg">
                    <Swords class="w-5 h-5 mr-2" />
                    Generate Matches
                  </Button>
                </div>
              {/if}

              <!-- STEP 3: Ready to Start (matches generated) -->
              {#if currentStep === 3 && matches.length > 0}
                <div class="space-y-6">
                  <!-- Summary Cards -->
                  <div class="grid grid-cols-3 gap-4">
                    <div class="p-6 rounded-xl bg-primary/10 border border-primary/20 text-center">
                      <div class="text-3xl font-bold text-primary">{participants.length}</div>
                      <div class="text-sm text-muted-foreground">Participants</div>
                    </div>
                    <div class="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div class="text-3xl font-bold text-amber-400">{groupOrder.length}</div>
                      <div class="text-sm text-muted-foreground">Groups</div>
                    </div>
                    <div class="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div class="text-3xl font-bold text-emerald-400">{matches.length}</div>
                      <div class="text-sm text-muted-foreground">Matches</div>
                    </div>
                  </div>

                  <!-- Review Checklist -->
                  <div class="rounded-xl border border-border p-4">
                    <h4 class="font-medium mb-3">Review Checklist</h4>
                    <div class="space-y-2">
                      {#each groupOrder as groupId}
                        {@const group = getGroupById(groupId)}
                        {@const court = getEffectiveCourt(groupId)}
                        {@const stats = matchStatsByGroup.get(groupId)}
                        {#if group}
                          <div class="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            <CheckCircle2 class="w-5 h-5 text-emerald-500" />
                            <span class="flex-1">{group.name}</span>
                            <Badge variant="outline" class={cn(
                              'text-xs',
                              court === 'A' ? 'border-amber-500 text-amber-400' : 
                              court === 'B' ? 'border-sky-500 text-sky-400' : 
                              'border-emerald-500 text-emerald-400'
                            )}>
                              Court {court}
                            </Badge>
                            <span class="text-xs text-muted-foreground">{stats?.total || 0} matches</span>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  </div>

                  <!-- Start Button -->
                  <Button onclick={onStartTournament} size="lg" class="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Play class="w-5 h-5 mr-2" />
                    Start Tournament
                  </Button>
                </div>
              {/if}
            </Card.Content>

            <!-- Footer with Navigation -->
            {#if currentStep < 3 || (currentStep === 2 && matches.length === 0)}
              <Card.Footer class="border-t border-border bg-muted/30 flex items-center justify-between">
                <div class="text-sm text-muted-foreground">
                  {#if currentStep === 1}
                    {participants.length} participants added
                  {:else if currentStep === 2}
                    {groupOrder.length} groups configured
                  {/if}
                </div>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Up next:</span>
                  <span class="font-medium text-foreground">{currentStep === 1 ? 'Courts' : 'Start'}</span>
                  <ChevronRight class="w-4 h-4" />
                </div>
              </Card.Footer>
            {/if}
          </Card.Root>
        </div>
      </div>

    {:else if selectedTournament.status === 'in_progress'}
      <!-- IN PROGRESS VIEW -->
      <div class="space-y-6">
        <!-- Progress Overview -->
        <Card.Root>
          <Card.Content class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold">Tournament Progress</h3>
                <p class="text-sm text-muted-foreground">{completedMatches.length} of {matches.length} matches completed</p>
              </div>
              <div class="text-3xl font-bold text-primary">{progressPercent}%</div>
            </div>
            <Progress value={progressPercent} class="h-3" />
          </Card.Content>
        </Card.Root>

        <!-- Court Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Court A -->
          <Card.Root class="border-amber-500/30">
            <Card.Header class="pb-2">
              <Card.Title class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">A</div>
                Court A
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {#if currentCourtAMatch}
                {@const p1 = getMemberById(currentCourtAMatch.player1Id)}
                {@const p2 = getMemberById(currentCourtAMatch.player2Id)}
                <div class="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div class="text-xs text-amber-400 mb-1">Now Playing</div>
                  <div class="font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}. vs {p2?.firstName} {p2?.lastName?.charAt(0)}.</div>
                </div>
              {:else}
                <div class="p-4 rounded-lg bg-muted text-center text-muted-foreground">
                  No active match
                </div>
              {/if}
              <div class="mt-3 text-sm text-muted-foreground">
                {courtACompletedCount} / {courtAMatches.length} matches done
              </div>
            </Card.Content>
          </Card.Root>

          <!-- Court B -->
          <Card.Root class="border-sky-500/30">
            <Card.Header class="pb-2">
              <Card.Title class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">B</div>
                Court B
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {#if currentCourtBMatch}
                {@const p1 = getMemberById(currentCourtBMatch.player1Id)}
                {@const p2 = getMemberById(currentCourtBMatch.player2Id)}
                <div class="p-4 rounded-lg bg-sky-500/10 border border-sky-500/30">
                  <div class="text-xs text-sky-400 mb-1">Now Playing</div>
                  <div class="font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}. vs {p2?.firstName} {p2?.lastName?.charAt(0)}.</div>
                </div>
              {:else}
                <div class="p-4 rounded-lg bg-muted text-center text-muted-foreground">
                  No active match
                </div>
              {/if}
              <div class="mt-3 text-sm text-muted-foreground">
                {courtBCompletedCount} / {courtBMatches.length} matches done
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <Button variant="outline" onclick={openSettings} class="flex-1">
            <Settings class="w-4 h-4 mr-2" />
            Settings
          </Button>
          {#if isComplete}
            <Button onclick={onCompleteTournament} class="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Archive class="w-4 h-4 mr-2" />
              Complete Tournament
            </Button>
          {/if}
        </div>
      </div>

    {:else}
      <!-- COMPLETED -->
      <Card.Root>
        <Card.Content class="flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <Trophy class="h-8 w-8 text-emerald-500" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Tournament Complete</h3>
          <p class="text-muted-foreground mb-4">All {matches.length} matches have been completed.</p>
          <Button variant="outline" onclick={() => {}}>View Results</Button>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
{/if}

<!-- Settings Sheet (same as before) -->
<Sheet.Root bind:open={settingsSheetOpen} onOpenChange={handleSheetOpenChange}>
  <Sheet.Portal>
    <Sheet.Overlay />
    <Sheet.Content side="right" class="w-full sm:max-w-2xl overflow-y-auto">
      <Sheet.Header>
        <Sheet.Title>Tournament Settings</Sheet.Title>
        <Sheet.Description>Configure match settings and passcodes</Sheet.Description>
      </Sheet.Header>
      
      <div class="py-6 space-y-6">
        <!-- Timer Settings -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold flex items-center gap-2">
            <Timer class="h-4 w-4" />
            Timer Settings
          </h4>
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Match Duration</Label>
            <ToggleGroup.Root
              type="single"
              value={boguTimerDuration.toString()}
              onValueChange={(val) => { if (val) boguTimerDuration = parseInt(val); }}
              class="justify-start"
            >
              {#each TIMER_OPTIONS as duration}
                <ToggleGroup.Item value={duration.toString()} class="px-4">{duration / 60}m</ToggleGroup.Item>
              {/each}
            </ToggleGroup.Root>
          </div>
          <div class="space-y-2">
            <Label class="text-xs text-muted-foreground">Timer Display</Label>
            <ToggleGroup.Root
              type="single"
              value={timerDisplayMode}
              onValueChange={(val) => { if (val) timerDisplayMode = val as 'up' | 'down'; }}
              class="justify-start"
            >
              <ToggleGroup.Item value="up" class="px-4">Count Up</ToggleGroup.Item>
              <ToggleGroup.Item value="down" class="px-4">Count Down</ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>
          <Button onclick={onApplyTimerDisplayMode} variant="secondary" size="sm">
            <Check class="mr-2 h-4 w-4" /> Apply Timer Settings
          </Button>
        </div>

        <Separator />

        <!-- Match Type -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold flex items-center gap-2">
            <Swords class="h-4 w-4" />
            Match Type
          </h4>
          <ToggleGroup.Root
            type="single"
            value={boguMatchType}
            onValueChange={(val) => { if (val) boguMatchType = val as 'sanbon' | 'ippon'; }}
            class="justify-start"
          >
            <ToggleGroup.Item value="sanbon" class="px-4">Sanbon</ToggleGroup.Item>
            <ToggleGroup.Item value="ippon" class="px-4">Ippon</ToggleGroup.Item>
          </ToggleGroup.Root>
          <Button onclick={onApplyBoguSettings} variant="secondary" size="sm">
            <Check class="mr-2 h-4 w-4" /> Apply Match Settings
          </Button>
        </div>

        <Separator />

        <!-- Security -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold flex items-center gap-2">
            <Lock class="h-4 w-4 text-red-400" />
            Security
          </h4>
          <div class="space-y-3">
            <div class="space-y-2">
              <Label class="text-xs text-muted-foreground">Admin Passcode</Label>
              <div class="flex gap-2">
                <Input type="password" bind:value={adminPasscodeInput} placeholder={adminPasscode ? "????????" : "Set passcode"} />
                <Button onclick={onSaveAdminPasscode} variant="secondary" size="sm">
                  <KeyRound class="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label class="text-xs text-muted-foreground">Courtkeeper Passcode</Label>
              <div class="flex gap-2">
                <Input type="password" bind:value={courtkeeperPasscodeInput} placeholder={courtkeeperPasscode ? "????????" : "Set passcode"} />
                <Button onclick={onSaveCourtkeeperPasscode} variant="secondary" size="sm">
                  <KeyRound class="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Actions -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold flex items-center gap-2">
            <RefreshCw class="h-4 w-4" />
            Actions
          </h4>
          <div class="space-y-2">
            <Button onclick={onResetTournament} variant="outline" size="sm" class="w-full justify-start border-amber-700/60 text-amber-400 hover:bg-amber-900/20">
              <RotateCcw class="mr-2 h-4 w-4" /> Reset All Scores
            </Button>
            <Button onclick={onDeleteTournament} variant="outline" size="sm" class="w-full justify-start border-red-700/60 text-red-400 hover:bg-red-900/20">
              <Trash2 class="mr-2 h-4 w-4" /> Delete Tournament
            </Button>
          </div>
        </div>
      </div>
    </Sheet.Content>
  </Sheet.Portal>
</Sheet.Root>

<style>
  /* Top bar styles */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 1rem;
  }
  
  .top-bar-left {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .top-bar-breadcrumb {
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
  }
  
  .top-bar-title {
    font-size: 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .top-bar-badge {
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .top-bar-badge.live {
    background: hsl(var(--destructive) / 0.2);
    color: hsl(var(--destructive));
    animation: pulse 2s infinite;
  }
  
  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }
  
  .btn-sm.primary {
    background: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }
  
  .btn-sm.primary:hover {
    opacity: 0.9;
  }
  
  .btn-sm.ghost {
    background: transparent;
    color: hsl(var(--muted-foreground));
  }
  
  .btn-sm.ghost:hover {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style>
