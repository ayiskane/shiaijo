<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import type { Doc, Id } from '../../../convex/_generated/dataModel';
  
  // shadcn components
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Select from '$lib/components/ui/select';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  
  // Icons
  import Search from '@lucide/svelte/icons/search';
  import Plus from '@lucide/svelte/icons/plus';
  import Upload from '@lucide/svelte/icons/upload';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Users from '@lucide/svelte/icons/users';
  import UserCheck from '@lucide/svelte/icons/user-check';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import X from '@lucide/svelte/icons/x';
  import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
  import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Check from '@lucide/svelte/icons/check';
  import Archive from '@lucide/svelte/icons/archive';
  import ArchiveRestore from '@lucide/svelte/icons/archive-restore';

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
  
  // Group modal state
  let showGroupModal = $state(false);
  let editingGroup = $state<Doc<'groups'> | null>(null);
  let groupFormId = $state('');
  let groupFormName = $state('');
  let groupFormIsHantei = $state(false);
  
  // CSV Import state
  let showImportModal = $state(false);
  let importTab = $state('upload');
  let isDragging = $state(false);
  let csvText = $state('');
  let parsedData = $state<Array<{firstName: string; lastName: string; groupId: string; isGuest: boolean}>>([]);
  let parseError = $state('');
  let isImporting = $state(false);
  let importSuccess = $state(false);

  // Form state
  let formFirstName = $state('');
  let formLastName = $state('');
  let formGroupId = $state('');
  
  // Bulk add state
  let showBulkAddModal = $state(false);
  let bulkRows = $state<Array<{firstName: string; lastName: string; groupId: string}>>([
    { firstName: '', lastName: '', groupId: '' }
  ]);

  // Archive state
  let showArchiveConfirm = $state<Doc<'members'> | null>(null);
  let showUnarchivePrompt = $state<Doc<'members'> | null>(null);
  let pendingRegistration = $state<Doc<'members'> | null>(null);

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
    editingMember = null;
    showAddModal = true;
  }

  function openEditModal(member: Doc<'members'>) {
    formFirstName = member.firstName;
    formLastName = member.lastName;
    formGroupId = member.groupId;
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
        isGuest: false,
      });
    }
    closeModal();
  }

  async function deleteMember(id: Id<'members'>) {
    await client.mutation(api.members.remove, { id });
    showDeleteConfirm = null;
  }

  // Archive handlers
  async function archiveMember(member: Doc<'members'>) {
    await client.mutation(api.members.update, { id: member._id, archived: true });
    showArchiveConfirm = null;
  }

  async function unarchiveMember(member: Doc<'members'>) {
    await client.mutation(api.members.update, { id: member._id, archived: false });
    showUnarchivePrompt = null;
    // If there was a pending registration, register the member now
    if (pendingRegistration && pendingRegistration._id === member._id && activeTournament) {
      await client.mutation(api.participants.add, {
        tournamentId: activeTournament._id,
        memberId: member._id,
        groupId: member.groupId,
      });
      pendingRegistration = null;
    }
  }

  // Register member handler
  async function handleRegisterClick(member: Doc<'members'>) {
    if (!activeTournament) return;
    
    // Check if member is archived
    if (member.archived) {
      pendingRegistration = member;
      showUnarchivePrompt = member;
      return;
    }
    
    // Register the member
    await client.mutation(api.participants.add, {
      tournamentId: activeTournament._id,
      memberId: member._id,
      groupId: member.groupId,
    });
  }

  // Register all group members
  async function registerAllGroupMembers() {
    if (!activeTournament || !selectedGroupId) return;
    
    await client.mutation(api.participants.registerGroupMembers, {
      tournamentId: activeTournament._id,
      groupId: selectedGroupId,
    });
  }

  async function deleteGroup(id: Id<'groups'>) {
    await client.mutation(api.groups.remove, { id });
    showDeleteGroupConfirm = null;
  }

  // Bulk add handlers
  function openBulkAddModal() {
    bulkRows = [{ firstName: '', lastName: '', groupId: groups[0]?.groupId || '' }];
    showBulkAddModal = true;
  }

  function closeBulkAddModal() {
    showBulkAddModal = false;
    bulkRows = [{ firstName: '', lastName: '', groupId: '' }];
  }

  function addBulkRow() {
    bulkRows = [...bulkRows, { firstName: '', lastName: '', groupId: groups[0]?.groupId || '' }];
  }

  function removeBulkRow(index: number) {
    if (bulkRows.length > 1) {
      bulkRows = bulkRows.filter((_, i) => i !== index);
    }
  }

  function updateBulkRow(index: number, field: 'firstName' | 'lastName' | 'groupId', value: string) {
    bulkRows = bulkRows.map((row, i) => i === index ? { ...row, [field]: value } : row);
  }

  async function saveBulkMembers() {
    const validRows = bulkRows.filter(row => row.firstName.trim() && row.lastName.trim() && row.groupId);
    if (validRows.length === 0) return;

    await client.mutation(api.members.bulkCreate, {
      members: validRows.map(row => ({
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        groupId: row.groupId,
        isGuest: false,
      }))
    });
    closeBulkAddModal();
  }

  // Group modal handlers
  function openAddGroupModal() {
    groupFormId = '';
    groupFormName = '';
    groupFormIsHantei = false;
    editingGroup = null;
    showGroupModal = true;
  }

  function openEditGroupModal(group: Doc<'groups'>) {
    groupFormId = group.groupId;
    groupFormName = group.name;
    groupFormIsHantei = group.isHantei;
    editingGroup = group;
    showGroupModal = true;
  }

  function closeGroupModal() {
    showGroupModal = false;
    editingGroup = null;
  }

  async function saveGroup() {
    if (!groupFormId.trim() || !groupFormName.trim()) return;
    
    if (editingGroup) {
      await client.mutation(api.groups.update, {
        id: editingGroup._id,
        groupId: groupFormId.trim(),
        name: groupFormName.trim(),
        isHantei: groupFormIsHantei,
      });
    } else {
      await client.mutation(api.groups.create, {
        groupId: groupFormId.trim(),
        name: groupFormName.trim(),
        isHantei: groupFormIsHantei,
      });
    }
    closeGroupModal();
  }

  // ===== CSV IMPORT FUNCTIONS =====
  
  function openImportModal() {
    showImportModal = true;
    importTab = 'upload';
    csvText = '';
    parsedData = [];
    parseError = '';
    isImporting = false;
    importSuccess = false;
  }

  function closeImportModal() {
    showImportModal = false;
    csvText = '';
    parsedData = [];
    parseError = '';
  }

  function parseCSV(text: string) {
    parseError = '';
    parsedData = [];
    
    if (!text.trim()) {
      parseError = 'No data provided';
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      parseError = 'CSV must have a header row and at least one data row';
      return;
    }

    // Parse header
    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Find column indices
    const firstNameIdx = header.findIndex(h => h.includes('first') || h === 'firstname');
    const lastNameIdx = header.findIndex(h => h.includes('last') || h === 'lastname');
    const groupIdx = header.findIndex(h => h.includes('group') || h === 'groupid' || h === 'division');

    if (firstNameIdx === -1 || lastNameIdx === -1) {
      parseError = 'CSV must have "First Name" and "Last Name" columns';
      return;
    }

    // Parse data rows
    const results: Array<{firstName: string; lastName: string; groupId: string; isGuest: boolean}> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length === 0 || row.every(cell => !cell.trim())) continue;
      
      const firstName = row[firstNameIdx]?.trim() || '';
      const lastName = row[lastNameIdx]?.trim() || '';
      
      if (!firstName || !lastName) continue;
      
      let groupId = groupIdx !== -1 ? row[groupIdx]?.trim() || '' : '';
      // If groupId doesn't match any existing group, use the first group
      if (!groups.some(g => g.groupId === groupId)) {
        groupId = groups[0]?.groupId || '';
      }
      
      results.push({ firstName, lastName, groupId, isGuest: false });
    }

    if (results.length === 0) {
      parseError = 'No valid data rows found';
      return;
    }

    parsedData = results;
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  }

  function handleFileDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    
    const file = e.dataTransfer?.files[0];
    if (file) {
      readFile(file);
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      readFile(file);
    }
  }

  function readFile(file: File) {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      parseError = 'Please upload a CSV file';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      csvText = text;
      parseCSV(text);
    };
    reader.onerror = () => {
      parseError = 'Error reading file';
    };
    reader.readAsText(file);
  }

  function handlePaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') || '';
    if (text) {
      csvText = text;
      parseCSV(text);
    }
  }

  function handleTextareaChange() {
    if (csvText.trim()) {
      parseCSV(csvText);
    } else {
      parsedData = [];
      parseError = '';
    }
  }

  async function importMembers() {
    if (parsedData.length === 0) return;
    
    isImporting = true;
    
    try {
      await client.mutation(api.members.bulkCreate, {
        members: parsedData.map(m => ({
          firstName: m.firstName,
          lastName: m.lastName,
          groupId: m.groupId,
          isGuest: m.isGuest,
        }))
      });
      
      importSuccess = true;
      setTimeout(() => {
        closeImportModal();
      }, 1500);
    } catch (error) {
      parseError = 'Error importing members. Please try again.';
    } finally {
      isImporting = false;
    }
  }
</script>

<svelte:head>
  <title>Members - Admin Portal</title>
</svelte:head>

<div class="members-page">
  <!-- GROUPS PANEL (Master) -->
  <aside class="groups-panel" class:edit-mode={groupsEditMode}>
    <div class="groups-header" class:edit-mode={groupsEditMode}>
      <div class="groups-header-top">
        <h2 class="groups-title">
          {#if groupsEditMode}
            <span class="edit-indicator">✎ Editing Groups</span>
          {:else}
            Groups
          {/if}
        </h2>
        <div class="groups-header-actions">
          {#if groupsEditMode}
            <Button variant="default" size="sm" onclick={() => groupsEditMode = false}>
              Done
            </Button>
          {:else}
            <Button variant="ghost" size="sm" onclick={() => groupsEditMode = true}>
              Edit
            </Button>
            <Button size="sm" onclick={openAddGroupModal}>
              <Plus size={14} />
            </Button>
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
                <span class="badge-hantei-small">H</span>
              {/if}
            </div>
          </div>
          {#if groupsEditMode}
            <div class="group-actions">
              <Button variant="ghost" size="icon" class="group-action-btn" onclick={(e) => { e.stopPropagation(); openEditGroupModal(group); }}>
                <Pencil size={12} />
              </Button>
              <Button variant="ghost" size="icon" class="group-action-btn danger" onclick={(e) => { e.stopPropagation(); showDeleteGroupConfirm = group._id; }}>
                <Trash2 size={12} />
              </Button>
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
        <div class="page-title-row">
          <span class="page-title">{selectedGroupId ? getGroup(selectedGroupId)?.name || 'Group' : 'All Members'}</span>
          {#if selectedGroupId}
            <span class="page-id-tag">ID: {selectedGroupId}</span>
          {/if}
        </div>
      </div>
      <div class="top-bar-stats">
        <div class="stat">
          <div class="stat-value">{filteredMembers().length}</div>
          <div class="stat-label">Members</div>
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
        {#if selectedGroupId && activeTournament}
          <Button variant="default" size="sm" class="btn-success" onclick={registerAllGroupMembers}>
            <UserCheck size={14} />
            <span>Register All</span>
          </Button>
        {/if}
        <Button variant="secondary" size="sm" onclick={openImportModal}>
          <Upload size={14} />
          <span>Import CSV</span>
        </Button>
        <div class="add-member-split">
          <Button size="sm" onclick={openAddModal}>
            <Plus size={14} />
            <span>Add Member</span>
          </Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild let:builder>
              <Button builders={[builder]} size="sm" class="dropdown-toggle-btn">
                <ChevronDown size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={openAddModal}>
                <UserPlus size={14} class="mr-2" />
                Add Single Member
              </DropdownMenu.Item>
              <DropdownMenu.Item onclick={openBulkAddModal}>
                <Users size={14} class="mr-2" />
                Add Bulk Members
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box toolbar-search">
        <Search size={16} class="search-icon" />
        <Input 
          type="text" 
          placeholder="Search members..." 
          class="search-input"
          bind:value={searchQuery}
        />
      </div>

      <ToggleGroup.Root type="single" value={filterStatus} onValueChange={(v) => { if (v) filterStatus = v as typeof filterStatus; }} class="filter-toggle">
        <ToggleGroup.Item value="all">All</ToggleGroup.Item>
        <ToggleGroup.Item value="registered">Registered</ToggleGroup.Item>
        <ToggleGroup.Item value="unregistered">Not Registered</ToggleGroup.Item>
      </ToggleGroup.Root>

      <div class="toolbar-spacer"></div>
    </div>

    <!-- Table Container with internal scroll -->
    <div class="table-wrapper">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 44px;">
                <Checkbox />
              </th>
              <th style="width: 200px;">Member</th>
              <th style="width: 140px;">Group</th>
              <th style="width: 120px;">Status</th>
              <th style="width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each paginatedMembers() as member}
              <tr class:archived={member.archived}>
                <td>
                  <Checkbox />
                </td>
                <td>
                  <div class="member-cell">
                    <span class="member-name">{member.firstName} {member.lastName}</span>
                    {#if member.archived}
                      <span class="badge-archived">Archived</span>
                    {/if}
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
                  {#if member.archived}
                    <span class="status-archived">Archived</span>
                  {:else if !activeTournament}
                    <span class="status-no-shiai">No Shiai</span>
                  {:else if isRegistered(member._id)}
                    <span class="badge badge-registered">✓ Registered</span>
                  {:else}
                    <Button variant="ghost" size="sm" class="status-unregistered" onclick={() => handleRegisterClick(member)}>+ Register</Button>
                  {/if}
                </td>
                <td>
                  <div class="action-buttons">
                    <Button variant="ghost" size="icon" class="action-btn" onclick={() => openEditModal(member)}>
                      <Pencil size={12} />
                    </Button>
                    {#if member.archived}
                      <Button variant="ghost" size="icon" class="action-btn restore" onclick={() => unarchiveMember(member)} title="Unarchive">
                        <ArchiveRestore size={12} />
                      </Button>
                    {:else}
                      <Button variant="ghost" size="icon" class="action-btn archive" onclick={() => showArchiveConfirm = member} title="Archive">
                        <Archive size={12} />
                      </Button>
                    {/if}
                    <Button variant="ghost" size="icon" class="action-btn danger" onclick={() => showDeleteConfirm = member._id}>
                      <Trash2 size={12} />
                    </Button>
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
            <option value={9999}>Show All</option>
          </select>
          <span class="showing">
            Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredMembers().length)}-{Math.min(currentPage * rowsPerPage, filteredMembers().length)} of {filteredMembers().length}
          </span>
        </div>
        <div class="pagination">
          <Button 
            variant="ghost"
            size="icon"
            class="pagination-btn" 
            disabled={currentPage === 1}
            onclick={() => currentPage--}
          >
            <ChevronLeft size={14} />
          </Button>
          {#each Array(Math.min(5, totalPages)) as _, i}
            {@const page = i + 1}
            <Button 
              variant={currentPage === page ? "default" : "ghost"}
              size="sm"
              class="pagination-btn"
              onclick={() => currentPage = page}
            >{page}</Button>
          {/each}
          <Button 
            variant="ghost"
            size="icon"
            class="pagination-btn"
            disabled={currentPage === totalPages || totalPages === 0}
            onclick={() => currentPage++}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Add/Edit Member Modal -->
<Dialog.Root bind:open={showAddModal}>
  <Dialog.Content class="sm:max-w-[440px]">
    <Dialog.Header>
      <Dialog.Title>{editingMember ? 'Edit Member' : 'Add Member'}</Dialog.Title>
    </Dialog.Header>
    <div class="dialog-form">
      <div class="form-group">
        <label class="form-label">First Name</label>
        <Input bind:value={formFirstName} placeholder="First name" />
      </div>
      <div class="form-group">
        <label class="form-label">Last Name</label>
        <Input bind:value={formLastName} placeholder="Last name" />
      </div>
      <div class="form-group">
        <label class="form-label">Group</label>
        <Select.Root type="single" bind:value={formGroupId}>
          <Select.Trigger class="w-full">
            <Select.Value placeholder="Select group" />
          </Select.Trigger>
          <Select.Content>
            {#each groups as group}
              <Select.Item value={group.groupId}>{group.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={closeModal}>Cancel</Button>
      <Button onclick={saveMember}>
        {editingMember ? 'Save Changes' : 'Add Member'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Add/Edit Group Modal -->
<Dialog.Root bind:open={showGroupModal}>
  <Dialog.Content class="sm:max-w-[440px]">
    <Dialog.Header>
      <Dialog.Title>{editingGroup ? 'Edit Group' : 'Add Group'}</Dialog.Title>
    </Dialog.Header>
    <div class="dialog-form">
      <div class="form-group">
        <Label>Group ID</Label>
        <Input bind:value={groupFormId} placeholder="e.g., YUD, MUD, YTH" />
        <span class="form-hint">Short identifier used internally</span>
      </div>
      <div class="form-group">
        <Label>Display Name</Label>
        <Input bind:value={groupFormName} placeholder="e.g., Yudansha, Mudansha, Youth" />
      </div>
      <div class="form-group">
        <div class="flex items-center gap-2">
          <Checkbox id="hantei" bind:checked={groupFormIsHantei} />
          <Label for="hantei">Hantei</Label>
        </div>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={closeGroupModal}>Cancel</Button>
      <Button onclick={saveGroup}>
        {editingGroup ? 'Save Changes' : 'Add Group'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Archive Member Confirmation -->
<Dialog.Root open={showArchiveConfirm !== null} onOpenChange={(open) => { if (!open) showArchiveConfirm = null; }}>
  <Dialog.Content class="sm:max-w-[400px]">
    <Dialog.Header>
      <Dialog.Title>Archive Member</Dialog.Title>
    </Dialog.Header>
    <Dialog.Description>
      {#if showArchiveConfirm}
        Archive <strong>{showArchiveConfirm.firstName} {showArchiveConfirm.lastName}</strong>?
        <br /><br />
        <span class="text-muted-foreground text-sm">Archived members cannot be registered for tournaments. You can unarchive them later.</span>
      {/if}
    </Dialog.Description>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showArchiveConfirm = null}>Cancel</Button>
      <Button variant="default" class="btn-warning" onclick={() => archiveMember(showArchiveConfirm!)}>Archive</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Unarchive Prompt (when trying to register archived member) -->
<Dialog.Root open={showUnarchivePrompt !== null} onOpenChange={(open) => { if (!open) { showUnarchivePrompt = null; pendingRegistration = null; } }}>
  <Dialog.Content class="sm:max-w-[400px]">
    <Dialog.Header>
      <Dialog.Title>Member is Archived</Dialog.Title>
    </Dialog.Header>
    <Dialog.Description>
      {#if showUnarchivePrompt}
        <strong>{showUnarchivePrompt.firstName} {showUnarchivePrompt.lastName}</strong> is currently archived and cannot be registered.
        <br /><br />
        <span class="text-muted-foreground text-sm">Would you like to unarchive this member and register them for the tournament?</span>
      {/if}
    </Dialog.Description>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => { showUnarchivePrompt = null; pendingRegistration = null; }}>Cancel</Button>
      <Button onclick={() => unarchiveMember(showUnarchivePrompt!)}>Unarchive & Register</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Member Confirmation -->
<Dialog.Root open={showDeleteConfirm !== null} onOpenChange={(open) => { if (!open) showDeleteConfirm = null; }}>
  <Dialog.Content class="sm:max-w-[400px]">
    <Dialog.Header>
      <Dialog.Title>Delete Member</Dialog.Title>
    </Dialog.Header>
    <Dialog.Description>
      Are you sure you want to delete this member? This action cannot be undone.
    </Dialog.Description>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showDeleteConfirm = null}>Cancel</Button>
      <Button variant="destructive" onclick={() => deleteMember(showDeleteConfirm!)}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Group Confirmation -->
<Dialog.Root open={showDeleteGroupConfirm !== null} onOpenChange={(open) => { if (!open) showDeleteGroupConfirm = null; }}>
  <Dialog.Content class="sm:max-w-[400px]">
    <Dialog.Header>
      <Dialog.Title>Delete Group</Dialog.Title>
    </Dialog.Header>
    <Dialog.Description>
      Are you sure you want to delete this group? Members in this group will need to be reassigned.
    </Dialog.Description>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showDeleteGroupConfirm = null}>Cancel</Button>
      <Button variant="destructive" onclick={() => deleteGroup(showDeleteGroupConfirm!)}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Bulk Add Members Modal -->
<Dialog.Root bind:open={showBulkAddModal}>
  <Dialog.Content class="sm:max-w-[560px]">
    <Dialog.Header>
      <Dialog.Title>Add Multiple Members</Dialog.Title>
    </Dialog.Header>
    <div class="bulk-body">
      <div class="bulk-header-row">
        <span class="bulk-col-label">First Name</span>
        <span class="bulk-col-label">Last Name</span>
        <span class="bulk-col-label">Group</span>
        <span class="bulk-col-action"></span>
      </div>
      <div class="bulk-rows">
        {#each bulkRows as row, index}
          <div class="bulk-row">
            <Input 
              placeholder="First"
              value={row.firstName}
              oninput={(e) => updateBulkRow(index, 'firstName', e.currentTarget.value)}
            />
            <Input 
              placeholder="Last"
              value={row.lastName}
              oninput={(e) => updateBulkRow(index, 'lastName', e.currentTarget.value)}
            />
            <Select.Root type="single" value={row.groupId} onValueChange={(v) => updateBulkRow(index, 'groupId', v)}>
              <Select.Trigger class="bulk-select-trigger">
                <Select.Value placeholder="Group" />
              </Select.Trigger>
              <Select.Content>
                {#each groups as group}
                  <Select.Item value={group.groupId}>{group.name}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <Button 
              variant="ghost" 
              size="icon"
              class="bulk-remove-btn"
              onclick={() => removeBulkRow(index)}
              disabled={bulkRows.length === 1}
            >
              <X size={14} />
            </Button>
          </div>
        {/each}
      </div>
      <Button variant="ghost" class="add-row-btn w-full" onclick={addBulkRow}>
        <Plus size={14} />
        <span>Add Row</span>
      </Button>
    </div>
    <Dialog.Footer class="flex items-center">
      <span class="bulk-count mr-auto">{bulkRows.filter(r => r.firstName && r.lastName).length} members ready</span>
      <Button variant="outline" onclick={closeBulkAddModal}>Cancel</Button>
      <Button onclick={saveBulkMembers}>Add Members</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- CSV Import Modal -->
<Dialog.Root bind:open={showImportModal}>
  <Dialog.Content class="import-dialog">
    <Dialog.Header>
      <Dialog.Title>Import Members</Dialog.Title>
      <Dialog.Description>
        Upload a CSV file or paste data directly. Required columns: First Name, Last Name. Optional: Group.
      </Dialog.Description>
    </Dialog.Header>
    
    <Tabs.Root bind:value={importTab} class="import-tabs">
      <Tabs.List class="import-tabs-list">
        <Tabs.Trigger value="upload" class="import-tab-trigger">
          <FileSpreadsheet size={16} />
          <span>Upload File</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="paste" class="import-tab-trigger">
          <ClipboardPaste size={16} />
          <span>Paste Data</span>
        </Tabs.Trigger>
      </Tabs.List>
      
      <Tabs.Content value="upload" class="import-tab-content">
        <div 
          class="dropzone"
          class:dragging={isDragging}
          ondragover={(e) => { e.preventDefault(); isDragging = true; }}
          ondragleave={() => isDragging = false}
          ondrop={handleFileDrop}
        >
          <Input 
            type="file" 
            accept=".csv" 
            class="file-input" 
            id="csv-file-input"
            onchange={handleFileSelect}
          />
          <label for="csv-file-input" class="dropzone-content">
            <div class="dropzone-icon">
              <FileSpreadsheet size={32} />
            </div>
            <div class="dropzone-text">
              <p class="dropzone-title">Drop your CSV file here</p>
              <p class="dropzone-subtitle">or <span class="dropzone-link">browse</span> to choose a file</p>
            </div>
          </label>
        </div>
      </Tabs.Content>
      
      <Tabs.Content value="paste" class="import-tab-content">
        <Textarea 
          class="paste-textarea"
          placeholder="Paste CSV data here...&#10;&#10;Example:&#10;First Name,Last Name,Group&#10;John,Doe,YUD&#10;Jane,Smith,MUD"
          bind:value={csvText}
          oninput={handleTextareaChange}
          onpaste={handlePaste}
        />
      </Tabs.Content>
    </Tabs.Root>

    {#if parseError}
      <div class="import-error">
        <AlertCircle size={16} />
        <span>{parseError}</span>
      </div>
    {/if}

    {#if parsedData.length > 0}
      <div class="import-preview">
        <div class="import-preview-header">
          <span class="import-preview-title">Preview ({parsedData.length} members)</span>
        </div>
        <div class="import-preview-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
              </tr>
            </thead>
            <tbody>
              {#each parsedData.slice(0, 5) as row}
                <tr>
                  <td>{row.lastName}, {row.firstName}</td>
                  <td>{getGroup(row.groupId)?.name || row.groupId}</td>
                </tr>
              {/each}
              {#if parsedData.length > 5}
                <tr class="more-rows">
                  <td colspan="2">... and {parsedData.length - 5} more</td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    {#if importSuccess}
      <div class="import-success">
        <Check size={16} />
        <span>Successfully imported {parsedData.length} members!</span>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="outline" onclick={closeImportModal}>Cancel</Button>
      <Button 
        onclick={importMembers} 
        disabled={parsedData.length === 0 || isImporting || importSuccess}
      >
        {#if isImporting}
          Importing...
        {:else if importSuccess}
          Done!
        {:else}
          Import {parsedData.length} Members
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .members-page {
    display: flex;
    height: calc(100vh - 64px);
    margin: -24px;
    overflow: hidden;
  }

  /* ===== GROUPS PANEL ===== */
  .groups-panel {
    width: 240px;
    background: #0f0e0c;
    border-right: 1px solid rgba(92, 99, 112, 0.2);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }

  .groups-header {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
    flex-shrink: 0;
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
    gap: 6px;
  }

  .group-name {
    font-size: 14px;
    font-weight: 600;
    color: #eaeaec;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Small H badge for hantei groups - subtle, no border */
  .badge-hantei-small {
    font-size: 9px;
    font-weight: 700;
    color: #e86f3a;
    background: rgba(232, 111, 58, 0.2);
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
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
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    background: #0f0e0c;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
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
    color: #eaeaec;
  }

  .page-id-tag {
    font-size: 11px;
    font-weight: 600;
    color: #9ca0ad;
    background: #3f444e;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
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
    flex-shrink: 0;
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

  /* ===== TABLE WRAPPER - Internal scroll ===== */
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
  }

  .badge-hantei {
    background: rgba(232, 111, 58, 0.15);
    color: #e86f3a;
  }

  .badge-registered {
    background: rgba(74, 222, 128, 0.12);
    color: #4ade80;
  }

  .status-no-shiai {
    color: #71717a;
    font-size: 14px;
    font-style: italic;
  }

  .status-archived {
    color: #71717a;
    font-size: 14px;
    font-style: italic;
  }

  .status-unregistered {
    background: none;
    border: none;
    color: #71717a;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.15s;
    font-family: inherit;
    padding: 0;
  }

  .status-unregistered:hover {
    color: #60a5fa;
  }

  /* Member cell with archived badge */
  .member-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge-archived {
    font-size: 10px;
    font-weight: 600;
    color: #71717a;
    background: rgba(113, 113, 122, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  /* Archived row styling */
  tr.archived {
    opacity: 0.6;
  }

  tr.archived .member-name {
    color: #71717a;
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

  .action-btn.archive:hover {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
  }

  .action-btn.restore:hover {
    background: rgba(74, 222, 128, 0.1);
    color: #4ade80;
  }

  /* ===== TABLE FOOTER ===== */
  .table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f0e0c;
    border-top: 1px solid rgba(92, 99, 112, 0.2);
    flex-shrink: 0;
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

  .btn-success {
    background: #22c55e;
    color: white;
  }

  .btn-success:hover {
    background: #16a34a;
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
  }

  .btn-warning:hover {
    background: #d97706;
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

  .modal-body p + p {
    margin-top: 12px;
  }

  .modal-hint {
    font-size: 13px;
    color: #71717a;
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

  .form-hint {
    display: block;
    font-size: 12px;
    color: #71717a;
    margin-top: 4px;
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

  /* ===== CSV IMPORT MODAL ===== */
  :global(.import-dialog) {
    max-width: 600px !important;
    background: #141310 !important;
    border: 1px solid rgba(92, 99, 112, 0.35) !important;
  }

  :global(.import-tabs) {
    margin-top: 16px;
  }

  :global(.import-tabs-list) {
    display: flex;
    gap: 4px;
    background: #0c0b09;
    padding: 4px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  :global(.import-tab-trigger) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #9ca0ad;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  :global(.import-tab-trigger:hover) {
    color: #eaeaec;
  }

  :global(.import-tab-trigger[data-state="active"]) {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  :global(.import-tab-content) {
    min-height: 200px;
  }

  .dropzone {
    border: 2px dashed rgba(92, 99, 112, 0.4);
    border-radius: 12px;
    padding: 40px 24px;
    text-align: center;
    transition: all 0.2s;
    cursor: pointer;
  }

  .dropzone:hover,
  .dropzone.dragging {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  .file-input {
    display: none;
  }

  .dropzone-content {
    cursor: pointer;
  }

  .dropzone-icon {
    color: #5c6370;
    margin-bottom: 16px;
  }

  .dropzone-title {
    font-size: 16px;
    font-weight: 600;
    color: #eaeaec;
    margin: 0 0 8px;
  }

  .dropzone-subtitle {
    font-size: 14px;
    color: #71717a;
    margin: 0;
  }

  .dropzone-link {
    color: #60a5fa;
    text-decoration: underline;
    cursor: pointer;
  }

  .paste-textarea {
    width: 100%;
    min-height: 200px;
    background: #0c0b09;
    border: 1px solid rgba(92, 99, 112, 0.35);
    border-radius: 8px;
    padding: 16px;
    font-size: 14px;
    font-family: 'SF Mono', Monaco, 'Consolas', monospace;
    color: #eaeaec;
    resize: vertical;
    line-height: 1.5;
  }

  .paste-textarea:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .paste-textarea::placeholder {
    color: #5c6370;
  }

  .import-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: 8px;
    color: #f87171;
    font-size: 14px;
    margin-top: 16px;
  }

  .import-success {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.3);
    border-radius: 8px;
    color: #4ade80;
    font-size: 14px;
    margin-top: 16px;
  }

  .import-preview {
    margin-top: 16px;
    border: 1px solid rgba(92, 99, 112, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .import-preview-header {
    padding: 12px 16px;
    background: #0f0e0c;
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
  }

  .import-preview-title {
    font-size: 14px;
    font-weight: 600;
    color: #eaeaec;
  }

  .import-preview-table {
    max-height: 200px;
    overflow-y: auto;
  }

  .import-preview-table table {
    width: 100%;
    border-collapse: collapse;
  }

  .import-preview-table th {
    text-align: left;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
    background: #0c0b09;
    position: sticky;
    top: 0;
  }

  .import-preview-table td {
    padding: 10px 16px;
    font-size: 14px;
    color: #eaeaec;
    border-top: 1px solid rgba(92, 99, 112, 0.15);
  }

  .import-preview-table .more-rows td {
    color: #71717a;
    font-style: italic;
    text-align: center;
  }

  /* ===== EDIT MODE HIGHLIGHT ===== */
  .groups-panel.edit-mode {
    background: #12110f;
  }

  .groups-header.edit-mode {
    background: rgba(59, 130, 246, 0.1);
    border-bottom-color: rgba(59, 130, 246, 0.3);
  }

  .edit-indicator {
    color: #60a5fa;
    font-size: 13px;
  }

  .group-card.editing {
    opacity: 0.9;
    border: 1px dashed rgba(59, 130, 246, 0.4);
  }

  .group-card.editing:hover {
    border-color: rgba(59, 130, 246, 0.6);
    background: rgba(59, 130, 246, 0.05);
  }

  /* ===== ADD MEMBER DROPDOWN ===== */
  .add-member-dropdown {
    position: relative;
    display: flex;
  }

  .add-member-dropdown .btn:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .dropdown-toggle {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding: 6px 8px;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: #1a1916;
    border: 1px solid rgba(92, 99, 112, 0.35);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    z-index: 100;
    min-width: 180px;
    overflow: hidden;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    background: transparent;
    border: none;
    color: #eaeaec;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
  }

  .dropdown-item:hover {
    background: rgba(59, 130, 246, 0.15);
  }

  .dropdown-item:first-child {
    border-bottom: 1px solid rgba(92, 99, 112, 0.2);
  }

  /* ===== BULK ADD MODAL ===== */
  .modal-bulk {
    max-width: 560px;
  }

  .bulk-body {
    padding: 16px 24px;
  }

  .bulk-header-row {
    display: grid;
    grid-template-columns: 1fr 1fr 120px 32px;
    gap: 8px;
    margin-bottom: 8px;
    padding: 0 4px;
  }

  .bulk-col-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
  }

  .bulk-col-action {
    width: 32px;
  }

  .bulk-rows {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bulk-row {
    display: grid;
    grid-template-columns: 1fr 1fr 120px 32px;
    gap: 8px;
    align-items: center;
  }

  .bulk-input {
    background: #0c0b09;
    border: 1px solid rgba(92, 99, 112, 0.35);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 14px;
    color: #eaeaec;
    font-family: inherit;
  }

  .bulk-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .bulk-select {
    background: #0c0b09;
    border: 1px solid rgba(92, 99, 112, 0.35);
    border-radius: 6px;
    padding: 8px 6px;
    font-size: 13px;
    color: #eaeaec;
    font-family: inherit;
  }

  .bulk-select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .bulk-remove-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: #71717a;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .bulk-remove-btn:hover:not(:disabled) {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }

  .bulk-remove-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .add-row-btn {
    margin-top: 8px;
    width: 100%;
    justify-content: center;
    border: 1px dashed rgba(92, 99, 112, 0.35);
  }

  .add-row-btn:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.05);
  }

  .bulk-count {
    font-size: 13px;
    color: #71717a;
    margin-right: auto;
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
