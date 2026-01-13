<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import type { Doc, Id } from '../../../convex/_generated/dataModel';
  
  // Shared admin components
  import { AdminSidePanel, AdminTopBar, AdminToolbar, AdminDataTable } from '$lib/components/admin';
  
  // shadcn components
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  
  // Icons
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import UserPlus from '@lucide/svelte/icons/user-plus';

  const client = useConvexClient();

  // Data queries
  const guestsQuery = useQuery(api.members.listGuests, () => ({}));
  const dojosQuery = useQuery(api.dojos.list, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const participantsQuery = useQuery(api.participants.listAll, () => ({}));

  // Derived data
  let guests = $derived(guestsQuery.data ?? []);
  let dojos = $derived(dojosQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let participants = $derived(participantsQuery.data ?? []);
  
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress' || t.status === 'setup'));
  
  function isRegistered(memberId: Id<'members'>) {
    if (!activeTournament) return false;
    return participants.some(p => p.memberId === memberId && p.tournamentId === activeTournament._id);
  }
  
  function getRegisteredGroup(memberId: Id<'members'>) {
    if (!activeTournament) return null;
    const participant = participants.find(p => p.memberId === memberId && p.tournamentId === activeTournament._id);
    if (!participant) return null;
    return groups.find(g => g.groupId === participant.groupId);
  }

  // UI State
  let selectedDojoId = $state<string | null>(null);
  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'registered' | 'unregistered'>('all');
  let currentPage = $state(1);
  let rowsPerPage = $state(10);
  let dojosEditMode = $state(false);
  
  // Modal states
  let showAddGuestModal = $state(false);
  let editingGuest = $state<Doc<'members'> | null>(null);
  let showDeleteGuestConfirm = $state<Id<'members'> | null>(null);
  let showDojoModal = $state(false);
  let editingDojo = $state<Doc<'dojos'> | null>(null);
  let dojoFormName = $state('');
  let dojoFormLocation = $state('');
  let showDeleteDojoConfirm = $state<Id<'dojos'> | null>(null);
  let formFirstName = $state('');
  let formLastName = $state('');
  let formDojoId = $state<Id<'dojos'> | undefined>(undefined);
  let showRegisterModal = $state(false);
  let registeringGuest = $state<Doc<'members'> | null>(null);
  let selectedGroupId = $state<string>('');

  // Dojo panel items
  let dojoPanelItems = $derived(dojos.map((d: Doc<'dojos'>) => ({
    id: d._id as string,
    name: d.name,
    subtitle: d.location,
    count: guests.filter(g => g.dojoId === d._id && !g.archived).length,
    icon: getDojoIcon(d),
  })));

  function getDojoIcon(dojo: Doc<'dojos'>) {
    const name = dojo.name.toLowerCase();
    if (name.includes('seattle')) return '⚔️';
    if (name.includes('bellevue')) return '🎋';
    if (name.includes('portland')) return '🗻';
    if (name.includes('vancouver')) return '🍁';
    return '🏠';
  }

  function getDojo(dojoId: Id<'dojos'> | undefined) {
    if (!dojoId) return null;
    return dojos.find((d: Doc<'dojos'>) => d._id === dojoId);
  }

  let filteredGuests = $derived(() => {
    let result = guests.filter(g => !g.archived);
    if (selectedDojoId) result = result.filter(g => g.dojoId === selectedDojoId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => g.firstName.toLowerCase().includes(q) || g.lastName.toLowerCase().includes(q));
    }
    if (filterStatus === 'registered') result = result.filter(g => isRegistered(g._id));
    else if (filterStatus === 'unregistered') result = result.filter(g => !isRegistered(g._id));
    return result;
  });

  let registeredCount = $derived(() => {
    if (!activeTournament) return 0;
    return filteredGuests().filter(g => isRegistered(g._id)).length;
  });

  $effect(() => { selectedDojoId; searchQuery; filterStatus; currentPage = 1; });

  let selectedDojoName = $derived(() => {
    if (!selectedDojoId) return 'All Guests';
    return dojos.find((d: Doc<'dojos'>) => d._id === selectedDojoId)?.name || 'All Guests';
  });

  let selectedDojoLocation = $derived(() => {
    if (!selectedDojoId) return '';
    return dojos.find((d: Doc<'dojos'>) => d._id === selectedDojoId)?.location || '';
  });

  // Modal handlers
  function openAddGuestModal() {
    formFirstName = ''; formLastName = ''; formDojoId = dojos[0]?._id; editingGuest = null; showAddGuestModal = true;
  }
  function openEditGuestModal(guest: Doc<'members'>) {
    formFirstName = guest.firstName; formLastName = guest.lastName; formDojoId = guest.dojoId; editingGuest = guest; showAddGuestModal = true;
  }
  function openAddDojoModal() {
    dojoFormName = ''; dojoFormLocation = ''; editingDojo = null; showDojoModal = true;
  }
  function openEditDojoModal(item: { id: string | null }) {
    const dojo = dojos.find((d: Doc<'dojos'>) => d._id === item.id);
    if (dojo) { dojoFormName = dojo.name; dojoFormLocation = dojo.location || ''; editingDojo = dojo; showDojoModal = true; }
  }
  function openRegisterModal(guest: Doc<'members'>) {
    registeringGuest = guest; selectedGroupId = groups[0]?.groupId || ''; showRegisterModal = true;
  }

  // CRUD operations
  async function saveGuest() {
    if (!formFirstName.trim() || !formLastName.trim()) return;
    if (editingGuest) {
      await client.mutation(api.members.update, { id: editingGuest._id, firstName: formFirstName.trim(), lastName: formLastName.trim(), dojoId: formDojoId });
    } else {
      await client.mutation(api.members.create, { firstName: formFirstName.trim(), lastName: formLastName.trim(), groupId: 'GUEST', isGuest: true, dojoId: formDojoId });
    }
    showAddGuestModal = false;
  }
  async function deleteGuest(id: Id<'members'>) {
    await client.mutation(api.members.remove, { id }); showDeleteGuestConfirm = null;
  }
  async function saveDojo() {
    if (!dojoFormName.trim()) return;
    if (editingDojo) {
      await client.mutation(api.dojos.update, { id: editingDojo._id, name: dojoFormName.trim(), location: dojoFormLocation.trim() || undefined });
    } else {
      await client.mutation(api.dojos.create, { name: dojoFormName.trim(), location: dojoFormLocation.trim() || undefined });
    }
    showDojoModal = false;
  }
  async function deleteDojo(item: { id: string | null }) {
    if (item.id) {
      await client.mutation(api.dojos.remove, { id: item.id as Id<'dojos'> });
      showDeleteDojoConfirm = null;
      if (selectedDojoId === item.id) selectedDojoId = null;
    }
  }
  async function registerGuest() {
    if (!registeringGuest || !activeTournament || !selectedGroupId) return;
    await client.mutation(api.participants.add, { tournamentId: activeTournament._id, memberId: registeringGuest._id, groupId: selectedGroupId });
    showRegisterModal = false; registeringGuest = null;
  }
</script>

<div class="admin-page">
  <AdminSidePanel
    title="Dojos"
    items={dojoPanelItems}
    selectedId={selectedDojoId}
    editMode={dojosEditMode}
    allItemsLabel="All Guests"
    allItemsIcon="🏠"
    totalCount={guests.filter(g => !g.archived).length}
    onSelect={(id) => selectedDojoId = id}
    onAdd={openAddDojoModal}
    onEdit={openEditDojoModal}
    onDelete={(item) => { showDeleteDojoConfirm = item.id as Id<'dojos'>; }}
    onToggleEdit={() => dojosEditMode = !dojosEditMode}
  />

  <main class="admin-content">
    <AdminTopBar
      title={selectedDojoName()}
      subtitle={selectedDojoLocation() ? `📍 ${selectedDojoLocation()}` : ''}
      stats={[
        { value: filteredGuests().length, label: 'Guests' },
        { value: registeredCount(), label: 'Registered', variant: 'success' },
        { value: filteredGuests().length - registeredCount(), label: 'Not Reg.', variant: 'muted' },
      ]}
    >
      {#snippet actions()}
        <Button variant="default" onclick={openAddGuestModal}><UserPlus size={16} />Add Guest</Button>
      {/snippet}
    </AdminTopBar>

    <AdminToolbar bind:searchValue={searchQuery} searchPlaceholder="Search guests...">
      {#snippet filters()}
        <ToggleGroup.Root type="single" value={filterStatus} spacing={0} class="inline-flex shadow-sm" onValueChange={(v) => { if (v) filterStatus = v as typeof filterStatus; }}>
          <ToggleGroup.Item value="all">All</ToggleGroup.Item>
          <ToggleGroup.Item value="registered">Registered</ToggleGroup.Item>
          <ToggleGroup.Item value="unregistered">Not Reg.</ToggleGroup.Item>
        </ToggleGroup.Root>
      {/snippet}
    </AdminToolbar>

    <AdminDataTable data={filteredGuests()} bind:currentPage bind:rowsPerPage emptyMessage="No guests found">
      {#snippet columns()}
        <th style="width: 44px;"><Checkbox /></th>
        <th style="width: 200px;">Guest</th>
        <th style="width: 180px;">Dojo</th>
        <th style="width: 140px;">Group</th>
        <th style="width: 120px;">Status</th>
        <th style="width: 80px;">Actions</th>
      {/snippet}
      {#snippet row(guest, index)}
        {@const registeredGroup = getRegisteredGroup(guest._id)}
        {@const guestDojo = getDojo(guest.dojoId)}
        <td><Checkbox /></td>
        <td><span class="name">{guest.firstName} {guest.lastName}</span></td>
        <td>{#if guestDojo}<span class="badge badge-default">{guestDojo.name}</span>{:else}<span class="text-muted">—</span>{/if}</td>
        <td>{#if registeredGroup}<span class="badge" class:badge-primary={!registeredGroup.isHantei} class:badge-hantei={registeredGroup.isHantei}>{registeredGroup.name}</span>{:else}<span class="text-muted">—</span>{/if}</td>
        <td>{#if !activeTournament}<span class="status-inactive">No Shiai</span>{:else if isRegistered(guest._id)}<span class="badge badge-success">✓ Registered</span>{:else}<Button variant="link" size="sm" class="p-0 h-auto" onclick={() => openRegisterModal(guest)}>+ Register</Button>{/if}</td>
        <td><div class="action-buttons"><Button variant="ghost" size="icon-sm" onclick={() => openEditGuestModal(guest)}><Pencil size={14} /></Button><Button variant="ghost" size="icon-sm" class="text-red-500 hover:text-red-400 hover:bg-red-500/10" onclick={() => showDeleteGuestConfirm = guest._id}><Trash2 size={14} /></Button></div></td>
      {/snippet}
    </AdminDataTable>
  </main>
</div>

<!-- MODALS -->
<Dialog.Root bind:open={showAddGuestModal}><Dialog.Content><Dialog.Header><Dialog.Title>{editingGuest ? 'Edit Guest' : 'Add Guest'}</Dialog.Title></Dialog.Header><div class="form-grid"><div class="form-group"><Label for="firstName">First Name</Label><Input id="firstName" bind:value={formFirstName} placeholder="First name" /></div><div class="form-group"><Label for="lastName">Last Name</Label><Input id="lastName" bind:value={formLastName} placeholder="Last name" /></div><div class="form-group full-width"><Label for="dojo">Dojo</Label><Select.Root type="single" value={formDojoId} onValueChange={(v) => formDojoId = v as Id<'dojos'>}><Select.Trigger>{formDojoId ? dojos.find((d: Doc<'dojos'>) => d._id === formDojoId)?.name : 'Select dojo...'}</Select.Trigger><Select.Content>{#each dojos as dojo}<Select.Item value={dojo._id}>{dojo.name}</Select.Item>{/each}</Select.Content></Select.Root></div></div><Dialog.Footer><Button variant="ghost" onclick={() => showAddGuestModal = false}>Cancel</Button><Button onclick={saveGuest} disabled={!formFirstName.trim() || !formLastName.trim()}>{editingGuest ? 'Save' : 'Add Guest'}</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root bind:open={showDojoModal}><Dialog.Content><Dialog.Header><Dialog.Title>{editingDojo ? 'Edit Dojo' : 'Add Dojo'}</Dialog.Title></Dialog.Header><div class="form-stack"><div class="form-group"><Label for="dojoName">Dojo Name</Label><Input id="dojoName" bind:value={dojoFormName} placeholder="e.g. Seattle Kendo Kai" /></div><div class="form-group"><Label for="dojoLocation">Location (optional)</Label><Input id="dojoLocation" bind:value={dojoFormLocation} placeholder="e.g. Seattle, WA" /></div></div><Dialog.Footer><Button variant="ghost" onclick={() => showDojoModal = false}>Cancel</Button><Button onclick={saveDojo} disabled={!dojoFormName.trim()}>{editingDojo ? 'Save' : 'Add Dojo'}</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root bind:open={showRegisterModal}><Dialog.Content><Dialog.Header><Dialog.Title>Register Guest</Dialog.Title><Dialog.Description>{#if registeringGuest}{registeringGuest.firstName} {registeringGuest.lastName}{/if}</Dialog.Description></Dialog.Header><div class="form-group"><Label>Select Group</Label><RadioGroup.Root bind:value={selectedGroupId} class="mt-2 space-y-2">{#each groups as group}<Label class="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"><RadioGroup.Item value={group.groupId} /><span class="font-medium">{group.name}</span>{#if group.isHantei}<span class="ml-auto text-xs font-bold text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded">H</span>{/if}</Label>{/each}</RadioGroup.Root></div><Dialog.Footer><Button variant="ghost" onclick={() => showRegisterModal = false}>Cancel</Button><Button onclick={registerGuest} disabled={!selectedGroupId}>Register</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root open={showDeleteGuestConfirm !== null} onOpenChange={(open) => { if (!open) showDeleteGuestConfirm = null; }}><Dialog.Content><Dialog.Header><Dialog.Title>Delete Guest</Dialog.Title><Dialog.Description>Are you sure? This cannot be undone.</Dialog.Description></Dialog.Header><Dialog.Footer><Button variant="ghost" onclick={() => showDeleteGuestConfirm = null}>Cancel</Button><Button variant="destructive" onclick={() => showDeleteGuestConfirm && deleteGuest(showDeleteGuestConfirm)}>Delete</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root open={showDeleteDojoConfirm !== null} onOpenChange={(open) => { if (!open) showDeleteDojoConfirm = null; }}><Dialog.Content><Dialog.Header><Dialog.Title>Delete Dojo</Dialog.Title><Dialog.Description>Are you sure? Guests from this dojo will have their dojo cleared.</Dialog.Description></Dialog.Header><Dialog.Footer><Button variant="ghost" onclick={() => showDeleteDojoConfirm = null}>Cancel</Button><Button variant="destructive" onclick={() => showDeleteDojoConfirm && deleteDojo({ id: showDeleteDojoConfirm })}>Delete</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<style>
  .admin-page { display: flex; height: calc(100vh - 64px); margin: -24px; overflow: hidden; }
  .admin-content { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--background); overflow: hidden; }
  
  /* Table cell styles */
  .name { font-weight: 500; }
  .text-muted { color: #52525b; }
  
  /* Badges */
  .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .badge-default { background: #27272a; color: #a1a1aa; }
  .badge-primary { background: rgba(129, 140, 248, 0.15); color: #a78bfa; }
  .badge-hantei { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
  .badge-success { background: rgba(52, 211, 153, 0.15); color: #34d399; }
  
  /* Status */
  .status-inactive { color: #71717a; font-size: 13px; font-style: italic; }
  
  /* Actions */
  .action-buttons { display: flex; gap: 4px; }
  
  /* Forms */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid .full-width { grid-column: 1 / -1; }
  .form-stack { display: flex; flex-direction: column; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
</style>
