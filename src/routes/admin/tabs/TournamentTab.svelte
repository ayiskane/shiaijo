<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { cn } from '$lib/utils';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  
  // shadcn components
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { Progress } from '$lib/components/ui/progress';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  
  import {
    Trophy, Users, Swords, Play, Archive, ChevronDown, GripVertical,
    Check, RefreshCw, Plus, Search, X, ChevronRight, CheckCircle2, 
    Sparkles, FolderOpen, Settings, Trash2
  } from '@lucide/svelte';
  
  const isMobile = new IsMobile();

  // Props
  let {
    tournaments = [],
    selectedTournamentId = $bindable(null),
    selectedTournament,
    participants = [],
    matches = [],
    groupOrder = [],
    groups = [],
    members = [],
    membersByGroupId = new Map(),
    matchStatsByGroup = new Map(),
    courtAMatches = [],
    courtBMatches = [],
    courtACompletedCount = 0,
    courtBCompletedCount = 0,
    currentCourtAMatch = null,
    currentCourtBMatch = null,
    completedMatches = [],
    progressPercent = 0,
    isComplete = false,
    registeredMemberIds = new Set<string>(),
    onOpenCreateTournament,
    onDeleteTournament,
    onAddAllParticipants,
    onClearAllParticipants,
    onRegisterMember,
    onUnregisterMember,
    onRegisterGroupMembers,
    onUnregisterGroupMembers,
    onGenerateMatches,
    onStartTournament,
    onCompleteTournament,
    onSetGroupCourt,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onRefreshParticipants,
    getGroupById,
    getEffectiveCourt,
    getMemberById,
  }: {
    tournaments?: any[];
    selectedTournamentId?: string | null;
    selectedTournament?: any;
    participants?: any[];
    matches?: any[];
    groupOrder?: string[];
    groups?: any[];
    members?: any[];
    membersByGroupId?: Map<string, any[]>;
    matchStatsByGroup?: Map<string, any>;
    courtAMatches?: any[];
    courtBMatches?: any[];
    courtACompletedCount?: number;
    courtBCompletedCount?: number;
    currentCourtAMatch?: any;
    currentCourtBMatch?: any;
    completedMatches?: any[];
    progressPercent?: number;
    isComplete?: boolean;
    registeredMemberIds?: Set<string>;
    onOpenCreateTournament: () => void;
    onDeleteTournament: () => void;
    onAddAllParticipants: () => void;
    onClearAllParticipants?: () => void;
    onRegisterMember?: (memberId: string) => void;
    onUnregisterMember?: (memberId: string) => void;
    onRegisterGroupMembers?: (groupId: string) => void;
    onUnregisterGroupMembers?: (groupId: string) => void;
    onGenerateMatches: () => void;
    onStartTournament: () => void;
    onCompleteTournament: () => void;
    onSetGroupCourt: (groupId: string, court: 'A' | 'B' | 'A+B') => void;
    onDragStart: (e: DragEvent, groupId: string) => void;
    onDragOver: (e: DragEvent, groupId: string) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent, groupId: string) => void;
    onDragEnd: () => void;
    onRefreshParticipants: () => void;
    getGroupById: (groupId: string) => any;
    getEffectiveCourt: (groupId: string) => 'A' | 'B' | 'A+B';
    getMemberById: (id: string) => any;
  } = $props();

  // Local state
  let availableSearchQuery = $state('');
  let guestSearchQuery = $state('');
  let membersCollapsibleOpen = $state(true);
  let guestsCollapsibleOpen = $state(false);
  let registeredListEl: HTMLElement | null = $state(null);
  let availableListEl: HTMLElement | null = $state(null);

  // Auto-animate lists
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

  // Separate members and guests
  let regularMembers = $derived(members.filter(m => !m.isGuest && !m.archived));
  let guestMembers = $derived(members.filter(m => m.isGuest && !m.archived));

  // Compute registered and available members (non-guests)
  let registeredMembers = $derived(
    regularMembers.filter(m => registeredMemberIds.has(m._id))
  );
  
  let availableMembers = $derived(
    regularMembers
      .filter(m => !registeredMemberIds.has(m._id))
      .filter(m => {
        if (!availableSearchQuery) return true;
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(availableSearchQuery.toLowerCase());
      })
  );

  // Available guests (not registered)
  let availableGuests = $derived(
    guestMembers
      .filter(m => !registeredMemberIds.has(m._id))
      .filter(m => {
        if (!guestSearchQuery) return true;
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(guestSearchQuery.toLowerCase());
      })
  );

  // Registered guests
  let registeredGuests = $derived(
    guestMembers.filter(m => registeredMemberIds.has(m._id))
  );

  // Group members by groupId for display
  let registeredByGroup = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const m of registeredMembers) {
      const arr = map.get(m.groupId) || [];
      arr.push(m);
      map.set(m.groupId, arr);
    }
    if (registeredGuests.length > 0) {
      map.set('__guests__', registeredGuests);
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
  let groupsWithRegistered = $derived([...registeredByGroup.keys()].filter(k => k !== '__guests__').map(gId => groups.find(g => g.groupId === gId)).filter(Boolean));
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

  function addAllGuests() {
    for (const guest of availableGuests) {
      if (onRegisterMember) onRegisterMember(guest._id);
    }
  }

  // Step labels
  const steps = [
    { num: 1, name: 'Participants', icon: Users },
    { num: 2, name: 'Courts', icon: Settings },
    { num: 3, name: 'Review', icon: Play }
  ];

  function getStepDescription(stepNum: number): string {
    if (stepNum === 1) {
      return participants.length > 0 ? `${participants.length} added` : 'Add members';
    }
    if (stepNum === 2) {
      return matches.length > 0 ? `${groupOrder.length} groups` : 'Assign courts';
    }
    return 'Ready to start';
  }

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
<div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-6">
  <div class="px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold">Tournament</h2>
      {#if selectedTournament?.status === 'in_progress'}
        <Badge variant="destructive" class="animate-pulse">Live</Badge>
      {:else if selectedTournament?.status === 'setup'}
        <Badge variant="secondary">Setup</Badge>
      {:else if selectedTournament?.status === 'completed'}
        <Badge variant="outline" class="border-emerald-500 text-emerald-500">Completed</Badge>
      {/if}
      {#if participants.length > 0}
        <Badge variant="outline">{participants.length} participants</Badge>
      {/if}
    </div>
    <Button size="sm" onclick={onOpenCreateTournament}>
      <Plus class="w-4 h-4 mr-1" />
      New Tournament
    </Button>
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
  <div class="mb-6 p-4 rounded-2xl border-2 border-primary/40 bg-card">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Trophy class="w-6 h-6 text-primary" />
      </div>
      <div class="flex-1 min-w-0">
        <Select.Root type="single" bind:value={selectedTournamentId}>
          <Select.Trigger class="w-full border-0 bg-transparent p-0 h-auto shadow-none">
            <div class="text-left">
              <div class="font-semibold text-lg">{selectedTournament?.name || 'Select tournament'}</div>
              {#if selectedTournament}
                <div class="text-sm text-muted-foreground">
                  {selectedTournament.status === 'setup' ? 'Setting up' : selectedTournament.status === 'in_progress' ? 'In progress' : 'Completed'}
                </div>
              {/if}
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
      </div>
      {#if selectedTournament}
        <Button 
          variant="ghost" 
          size="icon" 
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          onclick={onDeleteTournament}
        >
          <Trash2 class="w-5 h-5" />
        </Button>
      {/if}
    </div>
  </div>

  {#if selectedTournament}
    {#if selectedTournament.status === 'setup'}
      <!-- SETUP MODE: Master-Detail Layout -->
      <div class="flex gap-0 h-[calc(100vh-280px)] min-h-[500px] rounded-xl overflow-hidden border border-border/50">
        
        <!-- Left: Stepper Panel -->
        <div class="w-64 shrink-0 bg-card border-r border-border/50 flex flex-col">
          <!-- Stepper Header -->
          <div class="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <span class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Setup Steps</span>
            <Badge variant="secondary" class="text-xs">{currentStep}/3</Badge>
          </div>
          
          <!-- Steps List -->
          <div class="flex-1 overflow-y-auto p-2">
            {#each steps as step, idx}
              {@const isComplete = (step.num === 1 && participants.length > 0) || (step.num === 2 && matches.length > 0)}
              {@const isActive = currentStep === step.num}
              {@const StepIcon = step.icon}
              <button
                class={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                  isActive ? "bg-primary/10 border-l-[3px] border-l-primary" : "hover:bg-muted/50 border-l-[3px] border-l-transparent"
                )}
              >
                <div class={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isComplete ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {#if isComplete}
                    <Check class="w-4 h-4" />
                  {:else}
                    <StepIcon class="w-4 h-4" />
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <div class={cn(
                    "font-medium text-sm",
                    isActive ? "text-primary" : isComplete ? "text-emerald-400" : "text-foreground"
                  )}>{step.name}</div>
                  <div class="text-xs text-muted-foreground truncate">{getStepDescription(step.num)}</div>
                </div>
              </button>
              
              {#if idx < steps.length - 1}
                <div class={cn(
                  "w-0.5 h-4 ml-[22px] mb-1",
                  isComplete ? "bg-emerald-500" : "bg-border"
                )}></div>
              {/if}
            {/each}
          </div>
          
          <!-- Progress Footer -->
          <div class="p-4 border-t border-border/50">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="text-muted-foreground">Progress</span>
              <span class="font-semibold">{Math.round((currentStep - 1) / 3 * 100)}%</span>
            </div>
            <Progress value={(currentStep - 1) / 3 * 100} class="h-1.5" />
          </div>
        </div>
        
        <!-- Right: Content Panel -->
        <div class="flex-1 min-w-0 flex flex-col bg-background">
          <!-- Content Header -->
          <div class="px-6 py-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <div>
              <div class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Step {currentStep} of 3</div>
              <h3 class="text-xl font-semibold">
                {#if currentStep === 1}
                  Add Participants
                {:else if currentStep === 2}
                  Assign Courts
                {:else}
                  Ready to Start
                {/if}
              </h3>
            </div>
            <div class="flex items-center gap-2">
              {#if currentStep === 1}
                <Button variant="ghost" size="sm" onclick={onRefreshParticipants}>
                  <RefreshCw class="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button size="sm" disabled={participants.length === 0}>
                  Next <ChevronRight class="w-4 h-4 ml-1" />
                </Button>
              {:else if currentStep === 2}
                <Button size="sm" onclick={onGenerateMatches}>
                  <Swords class="w-4 h-4 mr-1" />
                  Generate Matches
                </Button>
              {:else}
                <Button size="sm" onclick={onStartTournament} class="bg-emerald-600 hover:bg-emerald-700">
                  <Play class="w-4 h-4 mr-1" />
                  Start Tournament
                </Button>
              {/if}
            </div>
          </div>
          
          <!-- Content Body -->
          <div class="flex-1 overflow-auto p-6">
            <!-- STEP 1: Participants -->
            {#if currentStep === 1 || (currentStep === 2 && matches.length === 0)}
              <!-- Slim Stats Row -->
              <div class="flex gap-3 mb-5">
                <div class="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <span class="text-2xl font-bold text-emerald-500">{participants.length}</span>
                  <span class="text-xs text-muted-foreground">Registered</span>
                </div>
                <div class="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <span class="text-2xl font-bold text-blue-500">{availableMembers.length}</span>
                  <span class="text-xs text-muted-foreground">Available</span>
                </div>
                <div class="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-muted/30">
                  <span class="text-2xl font-bold">{groupsWithRegistered.length}</span>
                  <span class="text-xs text-muted-foreground">Groups</span>
                </div>
                <div class="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5">
                  <span class="text-2xl font-bold text-violet-500">{availableGuests.length}</span>
                  <span class="text-xs text-muted-foreground">Guests</span>
                </div>
              </div>
              
              <!-- Dual Panel -->
              <div class="grid grid-cols-2 gap-4 h-[calc(100%-80px)]">
                <!-- Left: Registered -->
                <div class="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.02] flex flex-col overflow-hidden">
                  <div class="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/10 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Check class="w-4 h-4 text-emerald-500" />
                      <span class="font-semibold text-emerald-500">Registered</span>
                      <Badge variant="secondary" class="bg-emerald-500/20 text-emerald-400 text-xs">{participants.length}</Badge>
                    </div>
                    {#if onClearAllParticipants && participants.length > 0}
                      <Button variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:text-destructive" onclick={onClearAllParticipants}>
                        Clear All
                      </Button>
                    {/if}
                  </div>
                  
                  <ScrollArea.Root class="flex-1">
                    <div class="p-3" bind:this={registeredListEl}>
                      {#each groupsWithRegistered as group (group.groupId)}
                        {@const groupMembers = registeredByGroup.get(group.groupId) || []}
                        <div class="mb-3">
                          <div class={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg mb-1",
                            group.hantei ? "bg-[var(--accent-fire)]/10 border-l-[3px] border-l-[var(--accent-fire)]" : "bg-emerald-500/10"
                          )}>
                            <span class={cn(
                              "text-xs font-semibold",
                              group.hantei ? "text-[var(--accent-fire)]" : "text-emerald-400"
                            )}>
                              {group.name} ({groupMembers.length})
                            </span>
                            <Button variant="ghost" size="sm" class="h-6 text-[10px] text-muted-foreground hover:text-destructive px-2" onclick={() => handleUnregisterGroup(group.groupId)}>
                              Remove All
                            </Button>
                          </div>
                          {#each groupMembers as member (member._id)}
                            <div class="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-emerald-500/5">
                              <div class="flex items-center gap-2">
                                <div class={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold",
                                  group.hantei ? "bg-[var(--accent-fire)]/20 text-[var(--accent-fire)]" : "bg-emerald-500/20 text-emerald-400"
                                )}>
                                  {getInitials(member.firstName, member.lastName)}
                                </div>
                                <span class="text-sm">{member.firstName} {member.lastName}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                class="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onclick={() => handleUnregisterMember(member._id)}
                              >
                                <X class="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Users class="w-10 h-10 mb-3 opacity-30" />
                          <p class="text-sm">No participants yet</p>
                          <p class="text-xs">Add members from the right panel</p>
                        </div>
                      {/each}
                      
                      <!-- Registered Guests -->
                      {#if registeredGuests.length > 0}
                        <div class="mb-3">
                          <div class="flex items-center justify-between px-3 py-2 rounded-lg mb-1 bg-violet-500/10 border-l-[3px] border-l-violet-500">
                            <span class="text-xs font-semibold text-violet-400">
                              <Sparkles class="w-3 h-3 inline mr-1" />
                              Guests ({registeredGuests.length})
                            </span>
                          </div>
                          {#each registeredGuests as guest (guest._id)}
                            <div class="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-violet-500/5">
                              <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-semibold">
                                  {getInitials(guest.firstName, guest.lastName)}
                                </div>
                                <div class="flex flex-col">
                                  <span class="text-sm">{guest.firstName} {guest.lastName}</span>
                                  {#if guest.dojo}
                                    <span class="text-[10px] text-muted-foreground">{guest.dojo}</span>
                                  {/if}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                class="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onclick={() => handleUnregisterMember(guest._id)}
                              >
                                <X class="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </ScrollArea.Root>
                </div>
                
                <!-- Right: Quick Add Sections -->
                <div class="flex flex-col gap-3 overflow-hidden">
                  <!-- Quick Add: Members -->
                  <Collapsible.Root bind:open={membersCollapsibleOpen} class="rounded-xl border border-border bg-card flex flex-col overflow-hidden flex-1">
                    <Collapsible.Trigger class="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-l-[3px] border-l-blue-500">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Users class="w-4 h-4 text-blue-500" />
                        </div>
                        <div class="text-left">
                          <span class="font-semibold text-sm">Quick Add: Members</span>
                          <span class="text-xs text-muted-foreground ml-2">{availableMembers.length} available</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          class="h-7 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-400"
                          onclick={(e) => { e.stopPropagation(); onAddAllParticipants(); }}
                        >
                          + Add All
                        </Button>
                        <ChevronDown class={cn("w-4 h-4 text-muted-foreground transition-transform", membersCollapsibleOpen && "rotate-180")} />
                      </div>
                    </Collapsible.Trigger>
                    <Collapsible.Content class="flex-1 overflow-hidden flex flex-col">
                      <div class="px-3 py-2 border-t border-border/50">
                        <div class="relative">
                          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="text" 
                            placeholder="Search members..." 
                            bind:value={availableSearchQuery}
                            class="pl-9 h-8 text-sm bg-muted/50"
                          />
                        </div>
                      </div>
                      <ScrollArea.Root class="flex-1">
                        <div class="p-2" bind:this={availableListEl}>
                          {#each groupsWithAvailable as group (group.groupId)}
                            {@const groupMembers = availableByGroup.get(group.groupId) || []}
                            <div class="mb-2">
                              <div class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-blue-500/10 mb-1">
                                <span class="text-xs font-semibold text-blue-400">{group.name} ({groupMembers.length})</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  class="h-5 text-[10px] text-blue-400 hover:text-blue-400 px-2"
                                  onclick={() => handleRegisterGroup(group.groupId)}
                                >
                                  Add All
                                </Button>
                              </div>
                              {#each groupMembers as member (member._id)}
                                <div class="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-blue-500/5">
                                  <div class="flex items-center gap-2">
                                    <div class="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-semibold">
                                      {getInitials(member.firstName, member.lastName)}
                                    </div>
                                    <span class="text-sm">{member.firstName} {member.lastName}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    class="h-7 w-7 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-400"
                                    onclick={() => handleRegisterMember(member._id)}
                                  >
                                    <Plus class="w-4 h-4" />
                                  </Button>
                                </div>
                              {/each}
                            </div>
                          {:else}
                            <div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
                              <CheckCircle2 class="w-8 h-8 mb-2 text-emerald-500/50" />
                              <p class="text-sm">All members registered!</p>
                            </div>
                          {/each}
                        </div>
                      </ScrollArea.Root>
                    </Collapsible.Content>
                  </Collapsible.Root>
                  
                  <!-- Quick Add: Guests -->
                  <Collapsible.Root bind:open={guestsCollapsibleOpen} class="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
                    <Collapsible.Trigger class="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-l-[3px] border-l-violet-500">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                          <Sparkles class="w-4 h-4 text-violet-500" />
                        </div>
                        <div class="text-left">
                          <span class="font-semibold text-sm">Quick Add: Guests</span>
                          <span class="text-xs text-muted-foreground ml-2">{availableGuests.length} available</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        {#if availableGuests.length > 0}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            class="h-7 text-xs bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-400"
                            onclick={(e) => { e.stopPropagation(); addAllGuests(); }}
                          >
                            + Add All
                          </Button>
                        {/if}
                        <ChevronDown class={cn("w-4 h-4 text-muted-foreground transition-transform", guestsCollapsibleOpen && "rotate-180")} />
                      </div>
                    </Collapsible.Trigger>
                    <Collapsible.Content class="overflow-hidden">
                      {#if availableGuests.length > 0}
                        <div class="px-3 py-2 border-t border-border/50">
                          <div class="relative">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="text" 
                              placeholder="Search guests..." 
                              bind:value={guestSearchQuery}
                              class="pl-9 h-8 text-sm bg-muted/50"
                            />
                          </div>
                        </div>
                        <div class="p-2 max-h-[200px] overflow-y-auto">
                          {#each availableGuests as guest (guest._id)}
                            <div class="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-violet-500/5">
                              <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-semibold">
                                  {getInitials(guest.firstName, guest.lastName)}
                                </div>
                                <div class="flex flex-col">
                                  <span class="text-sm">{guest.firstName} {guest.lastName}</span>
                                  {#if guest.dojo}
                                    <span class="text-[10px] text-muted-foreground">{guest.dojo}</span>
                                  {/if}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                class="h-7 w-7 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-400"
                                onclick={() => handleRegisterMember(guest._id)}
                              >
                                <Plus class="w-4 h-4" />
                              </Button>
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <div class="p-4 border-t border-border/50">
                          <p class="text-sm text-muted-foreground text-center">No guests available</p>
                        </div>
                      {/if}
                    </Collapsible.Content>
                  </Collapsible.Root>
                </div>
              </div>
            {/if}
            
            <!-- STEP 2: Courts -->
            {#if currentStep === 2 && participants.length > 0 && matches.length === 0}
              <div class="space-y-4">
                <p class="text-sm text-muted-foreground mb-4">
                  Drag groups to reorder. Select court assignment for each group.
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
                      <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen class="w-5 h-5 text-primary" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium">{group.name}</div>
                        <div class="text-xs text-muted-foreground">
                          {membersByGroupId.get(groupId)?.filter(m => registeredMemberIds.has(m._id)).length || 0} participants
                          {#if group.hantei}
                            <Badge variant="outline" class="ml-2 text-[10px] border-[var(--accent-fire)]/30 text-[var(--accent-fire)]">Hantei</Badge>
                          {/if}
                        </div>
                      </div>
                      <ToggleGroup.Root
                        type="single"
                        value={court}
                        onValueChange={(val) => val && onSetGroupCourt(groupId, val as 'A' | 'B' | 'A+B')}
                        class="bg-muted rounded-lg p-1"
                      >
                        <ToggleGroup.Item value="A" class={cn('px-4 py-2 text-sm rounded-md font-medium', court === 'A' && 'bg-amber-500 text-white')}>A</ToggleGroup.Item>
                        <ToggleGroup.Item value="A+B" class={cn('px-4 py-2 text-sm rounded-md font-medium', court === 'A+B' && 'bg-emerald-500 text-white')}>A+B</ToggleGroup.Item>
                        <ToggleGroup.Item value="B" class={cn('px-4 py-2 text-sm rounded-md font-medium', court === 'B' && 'bg-sky-500 text-white')}>B</ToggleGroup.Item>
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

            <!-- STEP 3: Ready to Start -->
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
          </div>
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
        {#if isComplete}
          <Button onclick={onCompleteTournament} class="w-full bg-emerald-600 hover:bg-emerald-700">
            <Archive class="w-4 h-4 mr-2" />
            Complete Tournament
          </Button>
        {/if}
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
