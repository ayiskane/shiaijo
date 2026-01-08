<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../convex/_generated/api';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Select from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { Users, ClipboardList, HeartHandshake, Loader2, CheckCircle2 } from '@lucide/svelte';

  const client = useConvexClient();

  // Queries
  const volunteersQuery = useQuery(api.volunteers.list, () => ({}));
  const membersQuery = useQuery(api.members.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));

  let volunteers = $derived(volunteersQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);

  // Determine the current tournament (in setup or live)
  let activeTournament = $derived(() => {
    const candidates = tournaments.filter((t) => t.status === 'setup' || t.status === 'in_progress');
    if (candidates.length === 0) return null;
    // pick the most recent by date string
    return [...candidates].sort((a, b) => (a.date > b.date ? -1 : 1))[0];
  });

  // Signups for the active tournament
  const signupsQuery = useQuery(
    api.volunteers.listSignupsByTournament,
    () => (activeTournament ? { tournamentId: activeTournament._id } : 'skip')
  );
  let signups = $derived(signupsQuery.data ?? []);

  // Selection state
  let selectedVolunteerId = $state<string>('');
  let selectedVolunteerName = $state<string>('');
  let creating = $state(false);
  let signing = $state(false);
  let roleChoice: 'courtkeeper' | 'general' = $state('courtkeeper');

  // New volunteer form
  let firstName = $state('');
  let lastName = $state('');
  let relatedMemberIds = $state<Set<string>>(new Set());
  let memberSearch = $state('');

  $effect(() => {
    const v = volunteers.find((v) => v._id === selectedVolunteerId);
    selectedVolunteerName = v ? `${v.firstName} ${v.lastName}` : '';
  });

  const relatedMembersFiltered = $derived(() => {
    if (!memberSearch.trim()) return members;
    const term = memberSearch.trim().toLowerCase();
    return members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term) ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(term)
    );
  });

  function toggleRelated(id: string) {
    const next = new Set(relatedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    relatedMemberIds = next;
  }

  async function createVolunteer() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }
    creating = true;
    try {
      const id = await client.mutation(api.volunteers.create, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        relatedMemberIds: Array.from(relatedMemberIds).map((id) => id as any),
      });
      selectedVolunteerId = id as string;
      toast.success('Added to volunteer list');
      firstName = '';
      lastName = '';
      relatedMemberIds = new Set();
    } catch (err: any) {
      console.error(err);
      toast.error('Could not add volunteer');
    } finally {
      creating = false;
    }
  }

  async function signUp(role: 'courtkeeper' | 'general') {
    if (!activeTournament) {
      toast.error('No active or planning tournament right now');
      return;
    }
    if (!selectedVolunteerId) {
      toast.error('Select or add yourself first');
      return;
    }
    signing = true;
    try {
      await client.mutation(api.volunteers.signUp, {
        volunteerId: selectedVolunteerId as any,
        tournamentId: activeTournament._id,
        role,
      });
      toast.success(`Signed up as ${role === 'courtkeeper' ? 'Courtkeeper' : 'Volunteer'}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Sign-up failed');
    } finally {
      signing = false;
    }
  }

  const mySignupForActive = $derived(() => {
    if (!activeTournament || !selectedVolunteerId) return [];
    return signups.filter((s) => s.volunteerId === selectedVolunteerId);
  });
</script>

<svelte:head>
  <title>Volunteer | Shiaijo</title>
</svelte:head>

<div class="volunteer-hero">
  <div class="backdrop"></div>
  <div class="content">
    <div class="header">
      <div>
        <p class="eyebrow">RENBU · SHIAIJO</p>
        <h1>Volunteer Portal</h1>
        <p class="lede">
          Choose yourself from the roster or add your name, then sign up to help with the next tournament.
        </p>
      </div>
      <Badge class="chip">
        <HeartHandshake class="h-4 w-4 mr-2" /> Thank you for helping!
      </Badge>
    </div>

    <div class="grid">
      <!-- Step 1: pick existing -->
      <section class="card">
        <header>
          <div class="title">
            <Users class="h-5 w-5 text-primary" />
            <div>
              <p class="label">Step 1</p>
              <h2>Select yourself</h2>
            </div>
          </div>
          <Badge variant="secondary">{volunteers.length} people</Badge>
        </header>

        <div class="field">
          <Label class="text-xs text-muted-foreground">Pick your name</Label>
          <Select.Root value={selectedVolunteerId} onValueChange={(v) => (selectedVolunteerId = v)}>
            <Select.Trigger class="select">
              <Select.Value placeholder="Search and select" />
              <Select.Icon />
            </Select.Trigger>
            <Select.Content class="select-content">
              <Select.Item value="">Not selected</Select.Item>
              {#each volunteers as v}
                <Select.Item value={v._id}>{v.firstName} {v.lastName}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        {#if mySignupForActive.length > 0 && activeTournament}
          <div class="pill success">
            <CheckCircle2 class="h-4 w-4" />
            You are signed up for {activeTournament.name} ({mySignupForActive.map((s) => s.role).join(', ')}).
          </div>
        {/if}
      </section>

      <!-- Step 2: add yourself -->
      <section class="card">
        <header>
          <div class="title">
            <ClipboardList class="h-5 w-5 text-primary" />
            <div>
              <p class="label">Step 2</p>
              <h2>Not on the list?</h2>
            </div>
          </div>
          <Badge variant="outline">Add entry</Badge>
        </header>

        <div class="form-grid">
          <div class="field">
            <Label>First name</Label>
            <Input placeholder="Hana" bind:value={firstName} />
          </div>
          <div class="field">
            <Label>Last name</Label>
            <Input placeholder="Yamamoto" bind:value={lastName} />
          </div>
        </div>

        <div class="field">
          <div class="flex-between">
            <Label>Related members (optional)</Label>
            <Input
              size="sm"
              placeholder="Search members..."
              bind:value={memberSearch}
              class="search"
            />
          </div>
          <div class="member-list">
            {#if relatedMembersFiltered.length === 0}
              <p class="muted">No members match your search.</p>
            {:else}
              {#each relatedMembersFiltered as m}
                <button
                  type="button"
                  class="member-row"
                  onclick={() => toggleRelated(m._id as string)}
                >
                  <Checkbox checked={relatedMemberIds.has(m._id as string)} />
                  <span>{m.firstName} {m.lastName}</span>
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <Button class="w-full" disabled={creating} onclick={createVolunteer}>
          {#if creating}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Add me
        </Button>
      </section>

      <!-- Step 3: sign up -->
      <section class="card wide">
        <header>
          <div class="title">
            <HeartHandshake class="h-5 w-5 text-primary" />
            <div>
              <p class="label">Step 3</p>
              <h2>Join the current tournament</h2>
            </div>
          </div>
          {#if activeTournament}
            <Badge variant="secondary">{activeTournament.name}</Badge>
          {:else}
            <Badge variant="outline">No tournament right now</Badge>
          {/if}
        </header>

        {#if activeTournament}
          <div class="tournament-card">
            <div>
              <p class="muted text-xs">Date</p>
              <p class="strong">{activeTournament?.date ?? 'TBD'}</p>
            </div>
            <Separator orientation="vertical" />
            <div>
              <p class="muted text-xs">Status</p>
              <p class="strong capitalize">
                {activeTournament?.status ? activeTournament.status.replace('_', ' ') : 'pending'}
              </p>
            </div>
          </div>

          <div class="role-row">
            <Button
              variant={roleChoice === 'courtkeeper' ? 'default' : 'outline'}
              onclick={() => (roleChoice = 'courtkeeper')}
            >
              Courtkeeper
            </Button>
            <Button
              variant={roleChoice === 'general' ? 'default' : 'outline'}
              onclick={() => (roleChoice = 'general')}
            >
              General volunteer
            </Button>
          </div>

          <Button class="w-full" disabled={signing} onclick={() => signUp(roleChoice)}>
            {#if signing}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Confirm sign-up
          </Button>
        {:else}
          <div class="empty">
            <p class="muted">There are no planned tournaments right now. Please check back later.</p>
            <Button variant="outline" onclick={() => (window.location.href = '/')}>Return to main menu</Button>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background: #0c0b09;
  }
  .volunteer-hero {
    min-height: 100vh;
    color: #eaeaec;
    position: relative;
    padding: 48px 20px 64px;
    display: flex;
    justify-content: center;
  }
  .backdrop {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.08), transparent 25%),
      radial-gradient(circle at 80% 10%, rgba(232, 111, 58, 0.12), transparent 25%),
      #0c0b09;
    opacity: 0.9;
  }
  .content {
    width: min(1100px, 100%);
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .eyebrow {
    font-size: 12px;
    letter-spacing: 0.25em;
    color: #9ca0ad;
  }
  h1 {
    font-size: 32px;
    letter-spacing: 0.02em;
    margin: 4px 0;
  }
  .lede {
    color: #9ca0ad;
    max-width: 640px;
  }
  .chip {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
  }
  .card {
    background: rgba(20, 19, 16, 0.9);
    border: 1px solid rgba(59, 130, 246, 0.12);
    border-radius: 16px;
    padding: 18px 18px 20px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .card.wide {
    grid-column: span 2;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .title {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .label {
    font-size: 10px;
    letter-spacing: 0.15em;
    color: #9ca0ad;
    text-transform: uppercase;
  }
  h2 {
    font-size: 18px;
    margin-top: -2px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .select {
    width: 100%;
    height: 44px;
    border-radius: 10px;
    border: 1px solid rgba(59, 130, 246, 0.25);
    background: rgba(12, 11, 9, 0.8);
    color: #eaeaec;
  }
  .select-content {
    max-height: 260px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
    border: 1px solid rgba(74, 222, 128, 0.4);
    background: rgba(74, 222, 128, 0.12);
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .member-list {
    max-height: 180px;
    overflow: auto;
    border: 1px solid rgba(59, 130, 246, 0.12);
    border-radius: 12px;
    padding: 8px 10px;
    background: rgba(14, 13, 11, 0.6);
    display: grid;
    gap: 6px;
  }
  .member-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
    background: none;
    border: none;
    padding: 4px 6px;
    text-align: left;
    color: inherit;
  }
  .muted {
    color: #94a3b8;
  }
  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .search {
    width: 200px;
    height: 32px;
    font-size: 13px;
  }
  .tournament-card {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  .strong {
    font-weight: 700;
  }
  .role-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }
  .capitalize {
    text-transform: capitalize;
  }
  .empty {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border: 1px dashed rgba(59, 130, 246, 0.25);
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.05);
  }
  @media (max-width: 900px) {
    .card.wide {
      grid-column: span 1;
    }
  }
</style>
