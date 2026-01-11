<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import type { Doc, Id } from '../../../convex/_generated/dataModel';
  
  // Icons
  import Search from '@lucide/svelte/icons/search';
  import Plus from '@lucide/svelte/icons/plus';
  import Upload from '@lucide/svelte/icons/upload';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Users from '@lucide/svelte/icons/users';
  import UserCheck from '@lucide/svelte/icons/user-check';
  import X from '@lucide/svelte/icons/x';

  const client = useConvexClient();

  // Data queries
  const membersQuery = useQuery(api.members.list, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const participantsQuery = useQuery(api.participants.listAll, () => ({}));

  // Derived data
  let members = $derived(membersQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let participants = $derived(participantsQuery.data ?? []);
  
  // Get active tournament
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress' || t.status === 'setup'));
  
  // Check if member is registered for active tournament
  function isRegistered(memberId: Id<'members'>) {
    if (!activeTournament) return false;
    return participants.some(p => p.memberId === memberId && p.tournamentId === activeTournament._id);
  }
  
  // Get registered count
  let registeredCount = $derived(() => {
    if (!activeTournament) return 0;
    return members.filter(m => !m.archived && isRegistered(m._id)).length;
  });

  // UI State
  let selectedGroupId = $state<string | null>(null);
  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'registered' | 'unregistered'>('all');
  let currentPage = $state(1);
  let rowsPerPage = $state(10);
  let groupsEditMode = $state(false);
  let showDeleteGroupConfirm = $state<Id<'groups'> | null>(null);
  
  // Modal state
  let showAddModal = $state(false);
  let editingMember = $state<Doc<'members'> | null>(null);
  let showDeleteConfirm = $state<Id<'members'> | null>(null);

  // Form state
  let formFirstName = $state('');
  let formLastName = $state('');
  let formGroupId = $state('');
  let formIsGuest = $state(false);

  // Get member count by group
  function getMemberCount(groupId: string | null) {
    if (groupId === null) return members.length;
    return members.filter(m => m.groupId === groupId && !m.archived).length;
  }

  // Get group by ID
  function getGroup(groupId: string) {
    return groups.find(g => g.groupId === groupId);
  }

  // Filter members
  let filteredMembers = $derived(() => {
    let result = members.filter(m => !m.archived);
    
    // Group filter
    if (selectedGroupId) {
      result = result.filter(m => m.groupId === selectedGroupId);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)
      );
    }
    
    // Registration status filter
    if (filterStatus === 'registered') {
      result = result.filter(m => isRegistered(m._id));
    } else if (filterStatus === 'unregistered') {
      result = result.filter(m => !isRegistered(m._id));
    }
    
    return result;
  });

  // Pagination
  let totalPages = $derived(Math.ceil(filteredMembers().length / rowsPerPage));
  let paginatedMembers = $derived(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMembers().slice(start, start + rowsPerPage);
  });

  // Reset page when filters change
  $effect(() => {
    selectedGroupId;
    searchQuery;
    filterStatus;
    currentPage = 1;
  });

  // Avatar initials
  function getInitials(firstName: string, lastName: string) {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }

  // Avatar color based on name
  function getAvatarColor(name: string) {
    const colors = [
      'linear-gradient(135deg, #3b82f6, #60a5fa)',
      'linear-gradient(135deg, #ec4899, #f472b6)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      'linear-gradient(135deg, #f97316, #fb923c)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Group icon/emoji based on name
  function getGroupIcon(group: Doc<'groups'>) {
    const name = group.name.toLowerCase();
    if (name.includes('youth')) return '👶';
    if (name.includes('mudansha') || name.includes('kyu')) return '🥋';
    if (name.includes('yudansha') || name.includes('dan')) return '⚔️';
    if (name.includes('beginner')) return '🌱';
    if (name.includes('sensei') || name.includes('instructor')) return '🎓';
    return '👥';
  }

  // Group icon background color
  function getGroupIconBg(group: Doc<'groups'>) {
    if (group.isHantei) return 'rgba(232, 111, 58, 0.15)';
    const name = group.name.toLowerCase();
    if (name.includes('youth')) return 'rgba(251, 191, 36, 0.15)';
    if (name.includes('mudansha')) return 'rgba(56, 189, 248, 0.15)';
    if (name.includes('yudansha')) return 'rgba(139, 92, 246, 0.15)';
    return 'rgba(59, 130, 246, 0.15)';
  }

  // Modal handlers
  function openAddModal() {
    formFirstName = '';
    formLastName = '';
    formGroupId = groups[0]?.groupId || '';
    formIsGuest = false;
    editingMember = null;
    showAddModal = true;
  }

  function openEditModal(member: Doc<'members'>) {
    formFirstName = member.firstName;
    formLastName = member.lastName;
    formGroupId = member.groupId;
    formIsGuest = member.isGuest;
    editingMember = member;
    showAddModal = true;
  }

  function closeModal() {
    showAddModal = false;
    editingMember = null;
  }

  async function saveMember() {
    if (!formFirstName.trim() || !formLastName.trim() || !formGroupId) return;
    
    if (editingMember) {
      await client.mutation(api.members.update, {
        id: editingMember._id,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        groupId: formGroupId,
      });
    } else {
      await client.mutation(api.members.create, {
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        groupId: formGroupId,
        isGuest: formIsGuest,
      });
    }
    closeModal();
  }

  async function deleteMember(id: Id<'members'>) {
    await client.mutation(api.members.remove, { id });
    showDeleteConfirm = null;
  }

  async function deleteGroup(id: Id<'groups'>) {
    await client.mutation(api.groups.remove, { id });
    showDeleteGroupConfirm = null;
  }
</script>

<svelte:head>
  <title>Members - Admin Portal</title>
</svelte:head>

<div class="members-page">
  <!-- GROUPS PANEL (Master) -->
  <aside class="groups-panel">
    <div class="groups-header">
      <div class="groups-header-top">
        <h2 class="groups-title">Groups</h2>
        <div class="groups-header-actions">
          {#if groupsEditMode}
            <button class="btn btn-ghost btn-sm" onclick={() => groupsEditMode = false}>
              Done
            </button>
          {:else}
            <button class="btn btn-ghost btn-sm" onclick={() => groupsEditMode = true}>
              Edit
            </button>
            <button class="btn btn-primary btn-sm">
              <Plus size={14} />
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="groups-list">
      <!-- All Members -->
      <button 
        class="group-card" 
        class:selected={selectedGroupId === null}
        onclick={() => selectedGroupId = null}
      >
        <div class="group-icon" style="background: rgba(59, 130, 246, 0.15);">
          <Users size={16} />
        </div>
        <div class="group-info">
          <div class="group-name">All Members</div>
        </div>
        <div class="group-count-box">{getMemberCount(null)}</div>
      </button>

      <!-- Individual Groups -->
      {#each groups as group}
        {@const Icon = group.isHantei ? UserCheck : Users}
        <div 
          class="group-card"
          class:selected={selectedGroupId === group.groupId}
          class:hantei={group.isHantei}
          class:editing={groupsEditMode}
          onclick={() => !groupsEditMode && (selectedGroupId = group.groupId)}
          onkeydown={(e) => e.key === 'Enter' && !groupsEditMode && (selectedGroupId = group.groupId)}
          role="button"
          tabindex="0"
        >
          <div class="group-icon" style="background: {getGroupIconBg(group)};">
            <span class="group-emoji">{getGroupIcon(group)}</span>
          </div>
          <div class="group-info">
            <div class="group-name-row">
              <span class="group-name">{group.name}</span>
              {#if group.isHantei}
                <span class="badge badge-hantei">H</span>
              {/if}
            </div>
          </div>
          {#if groupsEditMode}
            <div class="group-actions">
              <button class="group-action-btn" onclick={(e) => { e.stopPropagation(); }}>
                <Pencil size={12} />
              </button>
              <button class="group-action-btn danger" onclick={(e) => { e.stopPropagation(); showDeleteGroupConfirm = group._id; }}>
                <Trash2 size={12} />
              </button>
            </div>
          {:else}
            <div class="group-count-box" class:hantei={group.isHantei}>{getMemberCount(group.groupId)}</div>
          {/if}
        </div>
      {/each}
    </div>

  </aside>

  <!-- MEMBERS PANEL (Detail) -->
  <div class="members-panel">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="page-title">{selectedGroupId ? getGroup(selectedGroupId)?.name || 'Group' : 'All Members'}</div>
      </div>
      <div class="top-bar-stats">
        <div class="stat">
          <div class="stat-value">{filteredMembers().length}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <div class="stat-value registered">{registeredCount()}</div>
          <div class="stat-label">Registered</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <div class="stat-value">{filteredMembers().length - registeredCount()}</div>
          <div class="stat-label">Not Reg.</div>
        </div>
      </div>
      <div class="top-bar-actions">
        <button class="btn btn-secondary btn-sm">
          <Upload size={14} />
          <span>Import CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick={openAddModal}>
          <Plus size={14} />
          <span>Add Member</span>
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box toolbar-search">
        <Search size={16} class="search-icon" />
        <input 
          type="text" 
          placeholder="Search members..." 
          class="search-input"
          bind:value={searchQuery}
        />
      </div>

      <div class="filter-toggle">
        <button 
          class="filter-btn" 
          class:active={filterStatus === 'all'}
          onclick={() => filterStatus = 'all'}
        >All</button>
        <button 
          class="filter-btn"
          class:active={filterStatus === 'registered'}
          onclick={() => filterStatus = 'registered'}
        >Registered</button>
        <button 
          class="filter-btn"
          class:active={filterStatus === 'unregistered'}
          onclick={() => filterStatus = 'unregistered'}
        >Not Registered</button>
      </div>

      <div class="toolbar-spacer"></div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 44px;">
              <input type="checkbox" class="checkbox" />
            </th>
            <th style="width: 200px;">Member</th>
            <th style="width: 140px;">Group</th>
            <th style="width: 120px;">Status</th>
            <th style="width: 80px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedMembers() as member}
            <tr>
              <td>
                <input type="checkbox" class="checkbox" />
              </td>
              <td>
                <div class="cell-member">
                  <div class="avatar" style="background: {getAvatarColor(member.lastName + member.firstName)};">
                    {getInitials(member.firstName, member.lastName)}
                  </div>
                  <span class="member-name">{member.lastName}, {member.firstName}</span>
                </div>
              </td>
              <td>
                {#if getGroup(member.groupId)}
                  {@const group = getGroup(member.groupId)}
                  <span class="badge badge-group" class:badge-hantei={group?.isHantei}>
                    {group?.name}
                  </span>
                {:else}
                  <span class="text-muted">{member.groupId}</span>
                {/if}
              </td>
              <td>
                {#if isRegistered(member._id)}
                  <span class="badge badge-registered">✓ Registered</span>
                {:else}
                  <span class="status-unregistered">+ Register</span>
                {/if}
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn" onclick={() => openEditModal(member)}>
                    <Pencil size={12} />
                  </button>
                  <button class="action-btn danger" onclick={() => showDeleteConfirm = member._id}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
          {#if paginatedMembers().length === 0}
            <tr>
              <td colspan="5" class="empty-state">
                No members found
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="table-footer">
      <div class="pagination-info">
        <span>Rows:</span>
        <select class="rows-select" bind:value={rowsPerPage}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span class="showing">
          Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredMembers().length)}-{Math.min(currentPage * rowsPerPage, filteredMembers().length)} of {filteredMembers().length}
        </span>
      </div>
      <div class="pagination">
        <button 
          class="pagination-btn" 
          disabled={currentPage === 1}
          onclick={() => currentPage--}
        >
          <ChevronLeft size={14} />
        </button>
        {#each Array(Math.min(5, totalPages)) as _, i}
          {@const page = i + 1}
          <button 
            class="pagination-btn"
            class:active={currentPage === page}
            onclick={() => currentPage = page}
          >{page}</button>
        {/each}
        <button 
          class="pagination-btn"
          disabled={currentPage === totalPages || totalPages === 0}
          onclick={() => currentPage++}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Add/Edit Modal -->
{#if showAddModal}
  <div class="modal-overlay" onclick={closeModal}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">{editingMember ? 'Edit Member' : 'Add Member'}</h3>
        <button class="modal-close" onclick={closeModal}>
          <X size={20} />
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input type="text" class="form-input" bind:value={formFirstName} />
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input type="text" class="form-input" bind:value={formLastName} />
        </div>
        <div class="form-group">
          <label class="form-label">Group</label>
          <select class="form-input" bind:value={formGroupId}>
            {#each groups as group}
              <option value={group.groupId}>{group.name}</option>
            {/each}
          </select>
        </div>
        {#if !editingMember}
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" bind:checked={formIsGuest} />
              <span>Guest (not a dojo member)</span>
            </label>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={closeModal}>Cancel</button>
        <button class="btn btn-primary" onclick={saveMember}>
          {editingMember ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation -->
{#if showDeleteConfirm}
  <div class="modal-overlay" onclick={() => showDeleteConfirm = null}>
    <div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">Delete Member</h3>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this member? This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => showDeleteConfirm = null}>Cancel</button>
        <button class="btn btn-danger" onclick={() => deleteMember(showDeleteConfirm!)}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Group Confirmation -->
{#if showDeleteGroupConfirm}
  <div class="modal-overlay" onclick={() => showDeleteGroupConfirm = null}>
    <div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">Delete Group</h3>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this group? Members in this group will need to be reassigned.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => showDeleteGroupConfirm = null}>Cancel</button>
        <button class="btn btn-danger" onclick={() => deleteGroup(showDeleteGroupConfirm!)}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .members-page {
    display: flex;
    height: 100%;
    min-height: calc(100vh - 64px);
    margin: -24px;
  }

  /* ===== GROUPS PANEL ===== */
  .groups-panel {
    width: 240px;
    background: #0f0e0c;
    border-right: 1px solid rgba(92, 99, 112, 0.2);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .groups-header {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
  }

  .groups-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .groups-title {
    font-size: 14px;
    font-weight: 700;
    color: #eaeaec;
    margin: 0;
  }

  .groups-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .group-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 100%;
    font: inherit;
    color: inherit;
  }

  .group-card:hover {
    background: #1a1916;
    border-color: rgba(92, 99, 112, 0.2);
  }

  .group-card.selected {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
  }

  .group-card.hantei {
    border-color: rgba(232, 111, 58, 0.3);
  }

  .group-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #60a5fa;
  }

  .group-emoji {
    font-size: 14px;
  }

  .group-info {
    flex: 1;
    min-width: 0;
  }

  .group-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .group-name {
    font-size: 14px;
    font-weight: 600;
    color: #eaeaec;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .group-meta {
    font-size: 11px;
    color: #71717a;
    margin-top: 0;
  }



  .groups-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .group-count-box {
    min-width: 28px;
    height: 24px;
    padding: 0 6px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #60a5fa;
    flex-shrink: 0;
    margin-left: auto;
  }

  .group-count-box.hantei {
    background: rgba(232, 111, 58, 0.15);
    border-color: rgba(232, 111, 58, 0.3);
    color: #e86f3a;
  }

  .group-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  .group-action-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: rgba(92, 99, 112, 0.1);
    border: none;
    color: #9ca0ad;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .group-action-btn:hover {
    background: rgba(92, 99, 112, 0.2);
    color: #eaeaec;
  }

  .group-action-btn.danger:hover {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }

  .group-card.editing {
    cursor: default;
  }

  /* ===== MEMBERS PANEL ===== */
  .members-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #0c0b09;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #0f0e0c;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
    min-height: 64px;
  }

  .top-bar-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }


  .page-title {
    font-size: 18px;
    font-weight: 700;
    color: #eaeaec;
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
    color: #eaeaec;
  }

  .stat-value.registered {
    color: #4ade80;
  }

  .stat-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
  }

  .stat-divider {
    width: 1px;
    height: 32px;
    background: rgba(92, 99, 112, 0.2);
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
    background: #0f0e0c;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
  }

  .toolbar-search {
    flex: 1;
    max-width: 320px;
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
    color: #5c6370;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    background: #0c0b09;
    border: 1px solid rgba(92, 99, 112, 0.2);
    border-radius: 8px;
    padding: 10px 14px 10px 40px;
    font-size: 15px;
    color: #eaeaec;
    font-family: inherit;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .search-input::placeholder {
    color: #5c6370;
  }

  .filter-toggle {
    display: flex;
    background: #141310;
    border: 1px solid rgba(92, 99, 112, 0.2);
    border-radius: 8px;
    padding: 4px;
  }

  .filter-btn {
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    color: #9ca0ad;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .filter-btn:hover {
    color: #eaeaec;
  }

  .filter-btn.active {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  /* ===== DATA TABLE ===== */
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
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
    background: #0f0e0c;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table td {
    padding: 12px 16px;
    font-size: 15px;
    color: #eaeaec;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
    vertical-align: middle;
  }

  .data-table tbody tr:hover {
    background: #1a1916;
  }

  .checkbox {
    accent-color: #3b82f6;
  }

  .cell-member {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .member-name {
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    color: #5c6370;
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
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .badge-group {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .badge-hantei {
    background: rgba(232, 111, 58, 0.15);
    color: #e86f3a;
    border: 1px solid rgba(232, 111, 58, 0.3);
  }

  .badge-member {
    background: rgba(74, 222, 128, 0.12);
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .badge-guest {
    background: rgba(156, 160, 173, 0.12);
    color: #9ca0ad;
    border: 1px solid rgba(156, 160, 173, 0.3);
  }

  .badge-registered {
    background: rgba(74, 222, 128, 0.12);
    color: #4ade80;
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .status-unregistered {
    color: #71717a;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .status-unregistered:hover {
    color: #60a5fa;
  }

  .text-muted {
    color: #5c6370;
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
    color: #5c6370;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: #1a1916;
    color: #eaeaec;
  }

  .action-btn.danger:hover {
    background: rgba(248, 113, 113, 0.1);
    color: #f87171;
  }

  /* ===== TABLE FOOTER ===== */
  .table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f0e0c;
    border-top: 1px solid rgba(92, 99, 112, 0.2);
  }

  .pagination-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #9ca0ad;
  }

  .rows-select {
    background: #1a1916;
    border: 1px solid rgba(92, 99, 112, 0.2);
    border-radius: 6px;
    padding: 4px 8px;
    color: #eaeaec;
    font-size: 14px;
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
    font-size: 14px;
    color: #9ca0ad;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #1a1916;
    color: #eaeaec;
  }

  .pagination-btn.active {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .pagination-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ===== BUTTONS ===== */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #60a5fa;
  }

  .btn-secondary {
    background: #1a1916;
    color: #eaeaec;
    border: 1px solid rgba(92, 99, 112, 0.35);
  }

  .btn-secondary:hover {
    background: #141310;
    border-color: rgba(156, 160, 173, 0.4);
  }

  .btn-ghost {
    background: transparent;
    color: #9ca0ad;
    border: none;
  }

  .btn-ghost:hover {
    color: #eaeaec;
    background: rgba(92, 99, 112, 0.15);
  }

  .btn-danger {
    background: #f87171;
    color: white;
  }

  .btn-danger:hover {
    background: #ef4444;
  }

  /* ===== MODAL ===== */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: #141310;
    border: 1px solid rgba(92, 99, 112, 0.35);
    border-radius: 16px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }

  .modal-sm {
    max-width: 360px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
  }

  .modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #eaeaec;
    margin: 0;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: #5c6370;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .modal-close:hover {
    background: rgba(92, 99, 112, 0.2);
    color: #eaeaec;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-body p {
    color: #9ca0ad;
    line-height: 1.5;
    margin: 0;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px;
    border-top: 1px solid rgba(92, 99, 112, 0.2);
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #9ca0ad;
    margin-bottom: 6px;
  }

  .form-input {
    width: 100%;
    background: #0c0b09;
    border: 1px solid rgba(92, 99, 112, 0.35);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 15px;
    color: #eaeaec;
    font-family: inherit;
    transition: border-color 0.15s;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .form-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: #9ca0ad;
    cursor: pointer;
  }

  .form-checkbox input {
    accent-color: #3b82f6;
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    .groups-panel {
      display: none;
    }

    .members-page {
      flex-direction: column;
    }

    .top-bar-stats {
      display: none;
    }
  }
</style>






