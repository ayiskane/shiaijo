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

  // Derived data
  let members = $derived(membersQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);

  // UI State
  let selectedGroupId = $state<string | null>(null);
  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'registered' | 'unregistered'>('all');
  let currentPage = $state(1);
  let rowsPerPage = $state(10);
  
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
        <button class="btn btn-primary btn-sm">
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>
      <div class="search-box">
        <Search size={16} class="search-icon" />
        <input type="text" placeholder="Search groups..." class="search-input" />
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
          <Users size={18} />
        </div>
        <div class="group-info">
          <div class="group-name">All Members</div>
          <div class="group-meta">{getMemberCount(null)} members</div>
        </div>
      </button>

      <!-- Individual Groups -->
      {#each groups as group}
        {@const Icon = group.isHantei ? UserCheck : Users}
        <button 
          class="group-card"
          class:selected={selectedGroupId === group.groupId}
          class:hantei={group.isHantei}
          onclick={() => selectedGroupId = group.groupId}
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
            <div class="group-meta">{getMemberCount(group.groupId)} members · {group.groupId}</div>
          </div>
          <button class="group-edit-btn" onclick={(e) => { e.stopPropagation(); }}>
            <Pencil size={12} />
          </button>
        </button>
      {/each}
    </div>

    <div class="groups-footer">
      <div class="groups-stat">
        <div class="groups-stat-value">{groups.filter(g => !g.isHantei).length}</div>
        <div class="groups-stat-label">Bogu</div>
      </div>
      <div class="groups-stat">
        <div class="groups-stat-value hantei">{groups.filter(g => g.isHantei).length}</div>
        <div class="groups-stat-label">Hantei</div>
      </div>
    </div>
  </aside>

  <!-- MEMBERS PANEL (Detail) -->
  <div class="members-panel">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="breadcrumb">Admin / Members</div>
        <div class="page-title">{selectedGroupId ? getGroup(selectedGroupId)?.name || 'Group' : 'All Members'}</div>
      </div>
      <div class="top-bar-stats">
        <div class="stat">
          <div class="stat-value">{filteredMembers().length}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <div class="stat-value registered">{members.filter(m => m.isGuest).length}</div>
          <div class="stat-label">Guests</div>
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
        >Members</button>
        <button 
          class="filter-btn"
          class:active={filterStatus === 'unregistered'}
          onclick={() => filterStatus = 'unregistered'}
        >Guests</button>
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
            <th>Member</th>
            <th>Group</th>
            <th>Type</th>
            <th style="width: 100px;">Actions</th>
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
                {#if member.isGuest}
                  <span class="badge badge-guest">Guest</span>
                {:else}
                  <span class="badge badge-member">Member</span>
                {/if}
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn" onclick={() => openEditModal(member)}>
                    <Pencil size={14} />
                  </button>
                  <button class="action-btn danger" onclick={() => showDeleteConfirm = member._id}>
                    <Trash2 size={14} />
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

<style>
  .members-page {
    display: flex;
    height: 100%;
    min-height: calc(100vh - 64px);
    margin: -24px;
  }

  /* ===== GROUPS PANEL ===== */
  .groups-panel {
    width: 300px;
    background: #0f0e0c;
    border-right: 1px solid rgba(92, 99, 112, 0.2);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .groups-header {
    padding: 16px;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
  }

  .groups-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .groups-title {
    font-size: 16px;
    font-weight: 700;
    color: #eaeaec;
    margin: 0;
  }

  .groups-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .group-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
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
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #60a5fa;
  }

  .group-emoji {
    font-size: 18px;
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
  }

  .group-meta {
    font-size: 11px;
    color: #5c6370;
    margin-top: 2px;
  }

  .group-edit-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: #5c6370;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.15s;
  }

  .group-card:hover .group-edit-btn {
    opacity: 1;
  }

  .group-edit-btn:hover {
    background: rgba(92, 99, 112, 0.2);
    color: #eaeaec;
  }

  .groups-footer {
    padding: 12px;
    border-top: 1px solid rgba(92, 99, 112, 0.2);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .groups-stat {
    text-align: center;
    padding: 10px;
    background: #1a1916;
    border-radius: 8px;
  }

  .groups-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #60a5fa;
  }

  .groups-stat-value.hantei {
    color: #e86f3a;
  }

  .groups-stat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #5c6370;
    margin-top: 2px;
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

  .breadcrumb {
    font-size: 11px;
    color: #5c6370;
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
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #5c6370;
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
    font-size: 13px;
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
    font-size: 12px;
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
  }

  .data-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #3d4148;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
    background: #0f0e0c;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table td {
    padding: 12px 16px;
    font-size: 13px;
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
    font-size: 11px;
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
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
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
    font-size: 12px;
    color: #9ca0ad;
  }

  .rows-select {
    background: #1a1916;
    border: 1px solid rgba(92, 99, 112, 0.2);
    border-radius: 6px;
    padding: 4px 8px;
    color: #eaeaec;
    font-size: 12px;
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
    font-size: 12px;
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
    font-size: 13px;
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
    font-size: 12px;
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
    font-size: 14px;
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
    font-size: 14px;
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
