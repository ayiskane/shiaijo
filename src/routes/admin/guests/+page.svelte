<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import type { Doc, Id } from '../../../convex/_generated/dataModel';
  
  // shadcn components
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  
  // Icons
  import Search from '@lucide/svelte/icons/search';
  import Plus from '@lucide/svelte/icons/plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Users from '@lucide/svelte/icons/users';
  import UserCheck from '@lucide/svelte/icons/user-check';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import X from '@lucide/svelte/icons/x';
  import Home from '@lucide/svelte/icons/home';
  import MapPin from '@lucide/svelte/icons/map-pin';

  const client = useConvexClient();

  // Data queries
  const membersQuery = useQuery(api.members.list, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const dojosQuery = useQuery(api.dojos.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const participantsQuery = useQuery(api.participants.listAll, () => ({}));

  // Derived data
  let allMembers = $derived(membersQuery.data ?? []);
  let guests = $derived(allMembers.filter(m => m.isGuest && !m.archived));
  let groups = $derived(groupsQuery.data ?? []);
  let dojos = $derived(dojosQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let participants = $derived(participantsQuery.data ?? []);
  
  // Get active tournament
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress' || t.status === 'setup'));
  
  // Check if guest is registered for active tournament
  function isRegistered(memberId: Id<'members'>) {
    if (!activeTournament) return false;
    return participants.some(p => p.memberId === memberId && p.tournamentId === activeTournament._id);
  }
  
  // Get participant info (for group)
  function getParticipantInfo(memberId: Id<'members'>) {
    if (!activeTournament) return null;
    return participants.find(p => p.memberId === memberId && p.tournamentId === activeTournament._id);
  }
  
  // Get registered count
  let registeredCount = $derived(() => {
    if (!activeTournament) return 0;
    return guests.filter(g => isRegistered(g._id)).length;
  });

  // UI State
  let selectedDojoId = $state<string | null>(null);
  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'registered' | 'unregistered'>('all');
  let currentPage = $state(1);
  let rowsPerPage = $state(10);
  let dojosEditMode = $state(false);
  
  // Guest modal state
  let showAddGuestModal = $state(false);
  let editingGuest = $state<Doc<'members'> | null>(null);
  let showDeleteGuestConfirm = $state<Id<'members'> | null>(null);
  
  // Dojo modal state
  let showDojoModal = $state(false);
  let editingDojo = $state<Doc<'dojos'> | null>(null);
  let showDeleteDojoConfirm = $state<Id<'dojos'> | null>(null);
  let dojoFormId = $state('');
  let dojoFormName = $state('');
  let dojoFormLocation = $state('');
  
  // Guest form state
  let guestFormFirstName = $state('');
  let guestFormLastName = $state('');
  let guestFormDojoId = $state('');
  
  // Registration modal state
  let showRegisterModal = $state(false);
  let registeringGuest = $state<Doc<'members'> | null>(null);
  let selectedGroupId = $state('');

  // Get guest count by dojo
  function getGuestCount(dojoId: string | null) {
    if (dojoId === null) return guests.length;
    return guests.filter(g => g.dojo === dojoId).length;
  }

  // Get dojo by ID
  function getDojo(dojoId: string) {
    return dojos.find(d => d.dojoId === dojoId);
  }
  
  // Get group by ID
  function getGroup(groupId: string) {
    return groups.find(g => g.groupId === groupId);
  }

  // Filter guests
  let filteredGuests = $derived(() => {
    let result = guests;
    
    // Dojo filter
    if (selectedDojoId) {
      result = result.filter(g => g.dojo === selectedDojoId);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q)
      );
    }
    
    // Registration status filter
    if (filterStatus === 'registered') {
      result = result.filter(g => isRegistered(g._id));
    } else if (filterStatus === 'unregistered') {
      result = result.filter(g => !isRegistered(g._id));
    }
    
    return result;
  });

  // Pagination
  let totalPages = $derived(Math.ceil(filteredGuests().length / rowsPerPage));
  let paginatedGuests = $derived(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredGuests().slice(start, start + rowsPerPage);
  });

  // Reset page when filters change
  $effect(() => {
    selectedDojoId;
    searchQuery;
    filterStatus;
    currentPage = 1;
  });

  // Dojo icon based on name
  function getDojoIcon(dojo: Doc<'dojos'>) {
    const name = dojo.name.toLowerCase();
    if (name.includes('seattle')) return '⚔️';
    if (name.includes('bellevue')) return '🎋';
    if (name.includes('portland')) return '🗻';
    if (name.includes('vancouver')) return '🍁';
    if (name.includes('tacoma')) return '🌲';
    return '🏠';
  }

  // Guest modal handlers
  function openAddGuestModal() {
    guestFormFirstName = '';
    guestFormLastName = '';
    guestFormDojoId = dojos[0]?.dojoId || '';
    editingGuest = null;
    showAddGuestModal = true;
  }

  function openEditGuestModal(guest: Doc<'members'>) {
    guestFormFirstName = guest.firstName;
    guestFormLastName = guest.lastName;
    guestFormDojoId = guest.dojo || '';
    editingGuest = guest;
    showAddGuestModal = true;
  }

  async function saveGuest() {
    if (!guestFormFirstName.trim() || !guestFormLastName.trim()) return;
    
    if (editingGuest) {
      await client.mutation(api.members.update, {
        id: editingGuest._id,
        firstName: guestFormFirstName.trim(),
        lastName: guestFormLastName.trim(),
        dojo: guestFormDojoId || undefined,
      });
    } else {
      await client.mutation(api.members.create, {
        firstName: guestFormFirstName.trim(),
        lastName: guestFormLastName.trim(),
        groupId: 'GUEST', // Placeholder - actual group selected during registration
        isGuest: true,
        dojo: guestFormDojoId || undefined,
      });
    }
    
    showAddGuestModal = false;
  }

  async function deleteGuest(id: Id<'members'>) {
    await client.mutation(api.members.remove, { id });
    showDeleteGuestConfirm = null;
  }

  // Dojo modal handlers
  function openAddDojoModal() {
    dojoFormId = '';
    dojoFormName = '';
    dojoFormLocation = '';
    editingDojo = null;
    showDojoModal = true;
  }

  function openEditDojoModal(dojo: Doc<'dojos'>) {
    dojoFormId = dojo.dojoId;
    dojoFormName = dojo.name;
    dojoFormLocation = dojo.location || '';
    editingDojo = dojo;
    showDojoModal = true;
  }

  async function saveDojo() {
    if (!dojoFormId.trim() || !dojoFormName.trim()) return;
    
    if (editingDojo) {
      await client.mutation(api.dojos.update, {
        id: editingDojo._id,
        dojoId: dojoFormId.trim().toUpperCase(),
        name: dojoFormName.trim(),
        location: dojoFormLocation.trim() || undefined,
      });
    } else {
      await client.mutation(api.dojos.create, {
        dojoId: dojoFormId.trim().toUpperCase(),
        name: dojoFormName.trim(),
        location: dojoFormLocation.trim() || undefined,
      });
    }
    
    showDojoModal = false;
  }

  async function deleteDojo(id: Id<'dojos'>) {
    await client.mutation(api.dojos.remove, { id });
    showDeleteDojoConfirm = null;
    selectedDojoId = null;
  }

  // Registration handlers
  function openRegisterModal(guest: Doc<'members'>) {
    registeringGuest = guest;
    selectedGroupId = groups[0]?.groupId || '';
    showRegisterModal = true;
  }

  async function registerGuest() {
    if (!registeringGuest || !selectedGroupId || !activeTournament) return;
    
    await client.mutation(api.participants.register, {
      tournamentId: activeTournament._id,
      memberId: registeringGuest._id,
      groupId: selectedGroupId,
    });
    
    showRegisterModal = false;
    registeringGuest = null;
  }

  async function unregisterGuest(guestId: Id<'members'>) {
    if (!activeTournament) return;
    
    const participant = participants.find(
      p => p.memberId === guestId && p.tournamentId === activeTournament._id
    );
    
    if (participant) {
      await client.mutation(api.participants.unregister, { id: participant._id });
    }
  }

  // Register all guests from selected dojo
  async function registerAllFromDojo() {
    if (!activeTournament || !selectedDojoId || !selectedGroupId) return;
    
    const dojoGuests = guests.filter(g => g.dojo === selectedDojoId && !isRegistered(g._id));
    
    for (const guest of dojoGuests) {
      await client.mutation(api.participants.register, {
        tournamentId: activeTournament._id,
        memberId: guest._id,
        groupId: selectedGroupId,
      });
    }
  }

  // Get selected dojo info
  let selectedDojoInfo = $derived(() => {
    if (!selectedDojoId) return null;
    return dojos.find(d => d.dojoId === selectedDojoId);
  });
</script>

<div class="guests-page">
  <!-- Dojo Panel (Left) -->
  <aside class="dojo-panel" class:editing={dojosEditMode}>
    <div class="dojo-header">
      <div class="dojo-header-top">
        {#if dojosEditMode}
          <span class="dojo-title editing-label">✎ Editing Dojos</span>
          <Button variant="default" size="sm" onclick={() => dojosEditMode = false}>Done</Button>
        {:else}
          <span class="dojo-title">Dojos</span>
          <div class="dojo-header-actions">
            <Button variant="ghost" size="sm" onclick={() => dojosEditMode = true}>Edit</Button>
            <Button variant="ghost" size="sm" onclick={openAddDojoModal}>
              <Plus size={14} />
            </Button>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="dojo-list">
      <!-- All Guests -->
      <button 
        class="dojo-card"
        class:selected={selectedDojoId === null}
        onclick={() => { if (!dojosEditMode) selectedDojoId = null; }}
        disabled={dojosEditMode}
      >
        <div class="dojo-icon" style="background: rgba(129, 140, 248, 0.15);">
          <span class="dojo-emoji">🏠</span>
        </div>
        <div class="dojo-info">
          <span class="dojo-name">All Guests</span>
        </div>
        <span class="dojo-count">{guests.length}</span>
      </button>
      
      <!-- Individual Dojos -->
      {#each dojos as dojo}
        <div 
          class="dojo-card"
          class:selected={selectedDojoId === dojo.dojoId && !dojosEditMode}
          class:editing={dojosEditMode}
          onclick={() => { if (!dojosEditMode) selectedDojoId = dojo.dojoId; }}
          onkeydown={(e) => { if (e.key === 'Enter' && !dojosEditMode) selectedDojoId = dojo.dojoId; }}
          role="button"
          tabindex="0"
        >
          <div class="dojo-icon" style="background: rgba(129, 140, 248, 0.15);">
            <span class="dojo-emoji">{getDojoIcon(dojo)}</span>
          </div>
          <div class="dojo-info">
            <span class="dojo-name">{dojo.name}</span>
            {#if dojo.location}
              <span class="dojo-location">{dojo.location}</span>
            {/if}
          </div>
          
          {#if dojosEditMode}
            <div class="dojo-actions">
              <button class="dojo-action-btn" onclick={(e) => { e.stopPropagation(); openEditDojoModal(dojo); }}>
                <Pencil size={12} />
              </button>
              <button class="dojo-action-btn danger" onclick={(e) => { e.stopPropagation(); showDeleteDojoConfirm = dojo._id; }}>
                <Trash2 size={12} />
              </button>
            </div>
          {:else}
            <span class="dojo-count">{getGuestCount(dojo.dojoId)}</span>
          {/if}
        </div>
      {/each}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="guests-content">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="page-title-row">
          <h1 class="page-title">
            {selectedDojoId ? selectedDojoInfo()?.name : 'All Guests'}
          </h1>
          {#if selectedDojoId && selectedDojoInfo()}
            <span class="page-id-tag">ID: {selectedDojoId}</span>
          {/if}
        </div>
      </div>
      
      <div class="top-bar-stats">
        <div class="stat">
          <div class="stat-value">{selectedDojoId ? getGuestCount(selectedDojoId) : guests.length}</div>
          <div class="stat-label">Guests</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <div class="stat-value registered">{registeredCount()}</div>
          <div class="stat-label">Registered</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <div class="stat-value muted">{(selectedDojoId ? getGuestCount(selectedDojoId) : guests.length) - registeredCount()}</div>
          <div class="stat-label">Not Reg.</div>
        </div>
      </div>
      
      <div class="top-bar-actions">
        <Button variant="default" onclick={openAddGuestModal}>
          <Plus size={16} />
          Add Guest
        </Button>
      </div>
    </div>
    
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-search">
        <div class="search-box">
          <Search size={16} class="search-icon" />
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search guests..."
            bind:value={searchQuery}
          />
        </div>
      </div>
      
      <ToggleGroup.Root type="single" value={filterStatus} onValueChange={(v) => { if (v) filterStatus = v as typeof filterStatus; }}>
        <ToggleGroup.Item value="all">All</ToggleGroup.Item>
        <ToggleGroup.Item value="registered">Registered</ToggleGroup.Item>
        <ToggleGroup.Item value="unregistered">Not Reg.</ToggleGroup.Item>
      </ToggleGroup.Root>
      
      <div class="toolbar-spacer"></div>
    </div>
    
    <!-- Table -->
    <div class="table-wrapper">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 44px;"></th>
              <th style="width: 200px;">Guest</th>
              <th style="width: 180px;">Dojo</th>
              <th style="width: 140px;">Group</th>
              <th style="width: 120px;">Status</th>
              <th style="width: 100px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedGuests() as guest}
              {@const participantInfo = getParticipantInfo(guest._id)}
              {@const registered = isRegistered(guest._id)}
              {@const dojo = guest.dojo ? getDojo(guest.dojo) : null}
              {@const group = participantInfo ? getGroup(participantInfo.groupId) : null}
              <tr>
                <td>
                  <Checkbox />
                </td>
                <td>
                  <span class="guest-name">{guest.firstName} {guest.lastName}</span>
                </td>
                <td>
                  {#if dojo}
                    <span class="badge badge-dojo">{dojo.name}</span>
                  {:else if guest.dojo}
                    <span class="badge badge-dojo">{guest.dojo}</span>
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if group}
                    <span class="badge" class:badge-group={!group.isHantei} class:badge-hantei={group.isHantei}>
                      {group.name}
                    </span>
                  {:else}
                    <span class="text-muted">—</span>
                  {/if}
                </td>
                <td>
                  {#if !activeTournament}
                    <span class="status-no-shiai">No Shiai</span>
                  {:else if registered}
                    <span class="badge badge-registered">✓ Registered</span>
                  {:else}
                    <button class="status-unregistered" onclick={() => openRegisterModal(guest)}>
                      + Register
                    </button>
                  {/if}
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn" onclick={() => openEditGuestModal(guest)} title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button class="action-btn danger" onclick={() => showDeleteGuestConfirm = guest._id} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="empty-state">
                  {#if searchQuery}
                    No guests found matching "{searchQuery}"
                  {:else if selectedDojoId}
                    No guests from this dojo yet
                  {:else}
                    No guests added yet
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Table Footer -->
      <div class="table-footer">
        <div class="pagination-info">
          <span>Rows:</span>
          <select class="rows-select" bind:value={rowsPerPage}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={9999}>Show All</option>
          </select>
          <span class="showing">
            Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredGuests().length)} - {Math.min(currentPage * rowsPerPage, filteredGuests().length)} of {filteredGuests().length}
          </span>
        </div>
        
        <div class="pagination">
          <button 
            class="pagination-btn" 
            onclick={() => currentPage--} 
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {#each Array(Math.min(5, totalPages)) as _, i}
            {@const pageNum = i + 1}
            <button 
              class="pagination-btn"
              class:active={currentPage === pageNum}
              onclick={() => currentPage = pageNum}
            >
              {pageNum}
            </button>
          {/each}
          
          <button 
            class="pagination-btn" 
            onclick={() => currentPage++} 
            disabled={currentPage >= totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Add/Edit Guest Modal -->
<Dialog.Root bind:open={showAddGuestModal}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{editingGuest ? 'Edit Guest' : 'Add Guest'}</Dialog.Title>
      <Dialog.Description>
        {editingGuest ? 'Update guest information' : 'Add a new guest from another dojo'}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="form-grid">
      <div class="form-group">
        <Label for="firstName">First Name</Label>
        <Input id="firstName" bind:value={guestFormFirstName} placeholder="First name" />
      </div>
      
      <div class="form-group">
        <Label for="lastName">Last Name</Label>
        <Input id="lastName" bind:value={guestFormLastName} placeholder="Last name" />
      </div>
      
      <div class="form-group full">
        <Label for="dojo">Dojo</Label>
        <Select.Root type="single" value={guestFormDojoId} onValueChange={(v) => guestFormDojoId = v}>
          <Select.Trigger>
            {dojos.find(d => d.dojoId === guestFormDojoId)?.name || 'Select dojo...'}
          </Select.Trigger>
          <Select.Content>
            {#each dojos as dojo}
              <Select.Item value={dojo.dojoId}>{dojo.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showAddGuestModal = false}>Cancel</Button>
      <Button onclick={saveGuest}>{editingGuest ? 'Save Changes' : 'Add Guest'}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Add/Edit Dojo Modal -->
<Dialog.Root bind:open={showDojoModal}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{editingDojo ? 'Edit Dojo' : 'Add Dojo'}</Dialog.Title>
      <Dialog.Description>
        {editingDojo ? 'Update dojo information' : 'Add a new dojo/club'}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="form-stack">
      <div class="form-group">
        <Label for="dojoId">Dojo ID</Label>
        <Input id="dojoId" bind:value={dojoFormId} placeholder="e.g., SKK" maxlength="10" />
        <span class="form-hint">Short identifier (e.g., SKK for Seattle Kendo Kai)</span>
      </div>
      
      <div class="form-group">
        <Label for="dojoName">Dojo Name</Label>
        <Input id="dojoName" bind:value={dojoFormName} placeholder="e.g., Seattle Kendo Kai" />
      </div>
      
      <div class="form-group">
        <Label for="dojoLocation">Location (optional)</Label>
        <Input id="dojoLocation" bind:value={dojoFormLocation} placeholder="e.g., Seattle, WA" />
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showDojoModal = false}>Cancel</Button>
      <Button onclick={saveDojo}>{editingDojo ? 'Save Changes' : 'Add Dojo'}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Registration Modal -->
<Dialog.Root bind:open={showRegisterModal}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Register Guest</Dialog.Title>
      <Dialog.Description>
        {#if registeringGuest}
          {registeringGuest.firstName} {registeringGuest.lastName}
          {#if registeringGuest.dojo}
            · {getDojo(registeringGuest.dojo)?.name || registeringGuest.dojo}
          {/if}
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    
    <div class="form-stack">
      <Label>Select Competition Group</Label>
      <div class="group-options">
        {#each groups as group}
          <button 
            class="group-option"
            class:selected={selectedGroupId === group.groupId}
            onclick={() => selectedGroupId = group.groupId}
          >
            <div class="group-option-radio">
              {#if selectedGroupId === group.groupId}
                <div class="radio-dot"></div>
              {/if}
            </div>
            <div class="group-option-info">
              <div class="group-option-name">{group.name}</div>
              <div class="group-option-id">ID: {group.groupId}</div>
            </div>
            {#if group.isHantei}
              <span class="badge badge-hantei-small">H</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
    
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showRegisterModal = false}>Cancel</Button>
      <Button variant="default" onclick={registerGuest} class="btn-success">Register</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Guest Confirm -->
<Dialog.Root open={showDeleteGuestConfirm !== null} onOpenChange={(open) => { if (!open) showDeleteGuestConfirm = null; }}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Guest</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this guest? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showDeleteGuestConfirm = null}>Cancel</Button>
      <Button variant="destructive" onclick={() => showDeleteGuestConfirm && deleteGuest(showDeleteGuestConfirm)}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Dojo Confirm -->
<Dialog.Root open={showDeleteDojoConfirm !== null} onOpenChange={(open) => { if (!open) showDeleteDojoConfirm = null; }}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Dojo</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this dojo? Guests from this dojo will not be deleted.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="ghost" onclick={() => showDeleteDojoConfirm = null}>Cancel</Button>
      <Button variant="destructive" onclick={() => showDeleteDojoConfirm && deleteDojo(showDeleteDojoConfirm)}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .guests-page {
    display: flex;
    height: calc(100vh - 64px);
    margin: -24px;
    overflow: hidden;
  }

  /* ===== DOJO PANEL ===== */
  .dojo-panel {
    width: 240px;
    background: #0a0a0c;
    border-right: 1px solid rgba(82, 82, 91, 0.4);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    transition: background 0.2s;
  }

  .dojo-panel.editing {
    background: #0c0c0e;
  }

  .dojo-header {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(82, 82, 91, 0.4);
    flex-shrink: 0;
  }

  .dojo-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dojo-title {
    font-size: 13px;
    font-weight: 700;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .dojo-title.editing-label {
    color: #818cf8;
  }

  .dojo-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .dojo-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dojo-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 100%;
    font: inherit;
    color: inherit;
  }

  .dojo-card:hover:not(:disabled) {
    background: #18181b;
  }

  .dojo-card.selected {
    background: rgba(129, 140, 248, 0.15);
    border-color: rgba(129, 140, 248, 0.4);
  }

  .dojo-card.editing {
    border: 1px dashed rgba(129, 140, 248, 0.4);
    cursor: default;
  }

  .dojo-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dojo-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dojo-emoji {
    font-size: 16px;
  }

  .dojo-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dojo-name {
    font-size: 14px;
    font-weight: 600;
    color: #fafafa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dojo-location {
    font-size: 11px;
    color: #71717a;
  }

  .dojo-count {
    min-width: 28px;
    height: 24px;
    padding: 0 8px;
    background: rgba(129, 140, 248, 0.15);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #a78bfa;
    flex-shrink: 0;
  }

  .dojo-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .dojo-action-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: rgba(82, 82, 91, 0.2);
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .dojo-action-btn:hover {
    background: rgba(82, 82, 91, 0.4);
    color: #fafafa;
  }

  .dojo-action-btn.danger:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }

  /* ===== MAIN CONTENT ===== */
  .guests-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #09090b;
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #0a0a0c;
    border-bottom: 1px solid rgba(82, 82, 91, 0.4);
    min-height: 64px;
    flex-shrink: 0;
  }

  .top-bar-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .page-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .page-title {
    font-size: 18px;
    font-weight: 700;
    color: #fafafa;
  }

  .page-id-tag {
    font-size: 11px;
    font-weight: 600;
    color: #a1a1aa;
    background: #3f3f46;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .top-bar-stats {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #fafafa;
  }

  .stat-value.registered {
    color: #34d399;
  }

  .stat-value.muted {
    color: #71717a;
  }

  .stat-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
  }

  .stat-divider {
    width: 1px;
    height: 32px;
    background: rgba(82, 82, 91, 0.4);
  }

  .top-bar-actions {
    display: flex;
    gap: 8px;
  }

  /* ===== TOOLBAR ===== */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 24px;
    background: #0a0a0c;
    border-bottom: 1px solid rgba(82, 82, 91, 0.4);
    flex-shrink: 0;
  }

  .toolbar-search {
    flex: 1;
    max-width: 300px;
  }

  .toolbar-spacer {
    flex: 1;
  }

  .search-box {
    position: relative;
  }

  .search-box :global(.search-icon) {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #52525b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: #09090b;
    border: 1px solid rgba(82, 82, 91, 0.4);
    border-radius: 8px;
    padding: 10px 14px 10px 40px;
    font-size: 14px;
    color: #fafafa;
    font-family: inherit;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    outline: none;
    border-color: #818cf8;
  }

  .search-input::placeholder {
    color: #52525b;
  }

  /* ===== TABLE ===== */
  .table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .table-container {
    flex: 1;
    overflow: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .data-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    border-bottom: 1px solid rgba(82, 82, 91, 0.4);
    background: #0a0a0c;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: #fafafa;
    border-bottom: 1px solid rgba(82, 82, 91, 0.4);
    vertical-align: middle;
  }

  .data-table tbody tr:hover {
    background: #18181b;
  }

  .guest-name {
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    color: #71717a;
    padding: 48px 16px !important;
  }

  /* ===== BADGES ===== */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .badge-dojo {
    background: #27272a;
    color: #a1a1aa;
  }

  .badge-group {
    background: rgba(129, 140, 248, 0.15);
    color: #a78bfa;
  }

  .badge-hantei {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
  }

  .badge-registered {
    background: rgba(52, 211, 153, 0.15);
    color: #34d399;
  }

  .badge-hantei-small {
    font-size: 9px;
    font-weight: 700;
    color: #fbbf24;
    background: rgba(251, 191, 36, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .status-no-shiai {
    color: #71717a;
    font-size: 13px;
    font-style: italic;
  }

  .status-unregistered {
    background: none;
    border: none;
    color: #818cf8;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    transition: color 0.15s;
  }

  .status-unregistered:hover {
    color: #a78bfa;
  }

  .text-muted {
    color: #52525b;
  }

  /* ===== ACTION BUTTONS ===== */
  .action-buttons {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #71717a;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: #27272a;
    color: #fafafa;
  }

  .action-btn.danger:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }

  /* ===== TABLE FOOTER ===== */
  .table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0a0a0c;
    border-top: 1px solid rgba(82, 82, 91, 0.4);
    flex-shrink: 0;
  }

  .pagination-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #a1a1aa;
  }

  .rows-select {
    background: #18181b;
    border: 1px solid rgba(82, 82, 91, 0.4);
    border-radius: 6px;
    padding: 4px 8px;
    color: #fafafa;
    font-size: 13px;
    font-family: inherit;
  }

  .showing {
    margin-left: 8px;
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pagination-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #a1a1aa;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #27272a;
    color: #fafafa;
  }

  .pagination-btn.active {
    background: rgba(129, 140, 248, 0.15);
    color: #a78bfa;
  }

  .pagination-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ===== FORM ===== */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group.full {
    grid-column: 1 / -1;
  }

  .form-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-hint {
    font-size: 12px;
    color: #71717a;
  }

  /* ===== GROUP OPTIONS (Registration Modal) ===== */
  .group-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .group-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #18181b;
    border: 1px solid rgba(82, 82, 91, 0.4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  .group-option:hover {
    border-color: rgba(129, 140, 248, 0.4);
  }

  .group-option.selected {
    background: rgba(129, 140, 248, 0.1);
    border-color: #818cf8;
  }

  .group-option-radio {
    width: 18px;
    height: 18px;
    border: 2px solid #52525b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .group-option.selected .group-option-radio {
    border-color: #818cf8;
  }

  .radio-dot {
    width: 10px;
    height: 10px;
    background: #818cf8;
    border-radius: 50%;
  }

  .group-option-info {
    flex: 1;
  }

  .group-option-name {
    font-weight: 600;
    font-size: 14px;
    color: #fafafa;
  }

  .group-option-id {
    font-size: 12px;
    color: #71717a;
  }

  /* Success button variant */
  :global(.btn-success) {
    background: #22c55e !important;
    color: white !important;
  }

  :global(.btn-success:hover) {
    background: #16a34a !important;
  }
</style>
