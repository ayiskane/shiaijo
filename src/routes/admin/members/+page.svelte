<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import type { Doc, Id } from '../../../convex/_generated/dataModel';
  
  // Shared admin components
  import { AdminSidePanel, AdminTopBar, AdminToolbar, AdminDataTable } from '$lib/components/admin';
  
  // shadcn components
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Select from '$lib/components/ui/select';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Textarea } from '$lib/components/ui/textarea';
  
  // Icons
  import Plus from '@lucide/svelte/icons/plus';
  import Upload from '@lucide/svelte/icons/upload';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Users from '@lucide/svelte/icons/users';
  import UserCheck from '@lucide/svelte/icons/user-check';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import X from '@lucide/svelte/icons/x';
  import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
  import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
  import Archive from '@lucide/svelte/icons/archive';
  import ArchiveRestore from '@lucide/svelte/icons/archive-restore';

  const client = useConvexClient();

  // Data queries
  const membersQuery = useQuery(api.members.listMembers, () => ({}));
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const participantsQuery = useQuery(api.participants.listAll, () => ({}));

  // Derived data
  let members = $derived(membersQuery.data ?? []);
  let groups = $derived(groupsQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let participants = $derived(participantsQuery.data ?? []);
  
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress' || t.status === 'setup'));
  
  function isRegistered(memberId: Id<'members'>) {
    if (!activeTournament) return false;
    return participants.some(p => p.memberId === memberId && p.tournamentId === activeTournament._id);
  }

  // UI State
  let selectedGroupId = $state<string | null>(null);
  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'registered' | 'unregistered'>('all');
  let currentPage = $state(1);
  let rowsPerPage = $state(10);
  let groupsEditMode = $state(false);
  
  // Modal states
  let showAddModal = $state(false);
  let editingMember = $state<Doc<'members'> | null>(null);
  let showDeleteConfirm = $state<Id<'members'> | null>(null);
  let showGroupModal = $state(false);
  let editingGroup = $state<Doc<'groups'> | null>(null);
  let showDeleteGroupConfirm = $state<Id<'groups'> | null>(null);
  let showArchiveConfirm = $state<Doc<'members'> | null>(null);
  let showUnarchivePrompt = $state<Doc<'members'> | null>(null);
  let pendingRegistration = $state<Doc<'members'> | null>(null);
  let showBulkAddModal = $state(false);
  let showImportModal = $state(false);
  
  // Form states
  let formFirstName = $state('');
  let formLastName = $state('');
  let formGroupId = $state('');
  let groupFormId = $state('');
  let groupFormName = $state('');
  let groupFormIsHantei = $state(false);
  let bulkRows = $state<Array<{firstName: string; lastName: string; groupId: string}>>([{ firstName: '', lastName: '', groupId: '' }]);
  
  // CSV Import state
  let importTab = $state('upload');
  let isDragging = $state(false);
  let csvText = $state('');
  let parsedData = $state<Array<{firstName: string; lastName: string; groupId: string; isGuest: boolean}>>([]);
  let parseError = $state('');
  let isImporting = $state(false);
  let importSuccess = $state(false);

  // Group panel items
  let groupPanelItems = $derived(groups.map(g => ({
    id: g.groupId,
    name: g.name,
    subtitle: g.isHantei ? 'Hantei' : undefined,
    count: members.filter(m => m.groupId === g.groupId && !m.archived).length,
    icon: getGroupIcon(g),
  })));

  function getGroupIcon(group: Doc<'groups'>) {
    const name = group.name.toLowerCase();
    if (group.isHantei) return '⚖️';
    if (name.includes('youth')) return '👶';
    if (name.includes('mudansha') || name.includes('kyu')) return '🥋';
    if (name.includes('yudansha') || name.includes('dan')) return '⚔️';
    if (name.includes('beginner')) return '🌱';
    return '👥';
  }

  function getGroup(groupId: string) {
    return groups.find(g => g.groupId === groupId);
  }

  let filteredMembers = $derived(() => {
    let result = members.filter(m => !m.archived);
    if (selectedGroupId) result = result.filter(m => m.groupId === selectedGroupId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q));
    }
    if (filterStatus === 'registered') result = result.filter(m => isRegistered(m._id));
    else if (filterStatus === 'unregistered') result = result.filter(m => !isRegistered(m._id));
    return result;
  });

  let registeredCount = $derived(() => {
    if (!activeTournament) return 0;
    return filteredMembers().filter(m => isRegistered(m._id)).length;
  });

  $effect(() => { selectedGroupId; searchQuery; filterStatus; currentPage = 1; });

  let selectedGroupName = $derived(() => {
    if (!selectedGroupId) return 'All Members';
    return groups.find(g => g.groupId === selectedGroupId)?.name || 'All Members';
  });

  // Modal handlers
  function openAddModal() { formFirstName = ''; formLastName = ''; formGroupId = groups[0]?.groupId || ''; editingMember = null; showAddModal = true; }
  function openEditModal(member: Doc<'members'>) { formFirstName = member.firstName; formLastName = member.lastName; formGroupId = member.groupId; editingMember = member; showAddModal = true; }
  function openAddGroupModal() { groupFormId = ''; groupFormName = ''; groupFormIsHantei = false; editingGroup = null; showGroupModal = true; }
  function openEditGroupModal(item: { id: string | null }) {
    const group = groups.find(g => g.groupId === item.id);
    if (group) { groupFormId = group.groupId; groupFormName = group.name; groupFormIsHantei = group.isHantei; editingGroup = group; showGroupModal = true; }
  }
  function openBulkAddModal() { bulkRows = [{ firstName: '', lastName: '', groupId: groups[0]?.groupId || '' }]; showBulkAddModal = true; }
  function openImportModal() { importTab = 'upload'; csvText = ''; parsedData = []; parseError = ''; isImporting = false; importSuccess = false; showImportModal = true; }

  // CRUD operations
  async function saveMember() {
    if (!formFirstName.trim() || !formLastName.trim() || !formGroupId) return;
    if (editingMember) {
      await client.mutation(api.members.update, { id: editingMember._id, firstName: formFirstName.trim(), lastName: formLastName.trim(), groupId: formGroupId });
    } else {
      await client.mutation(api.members.create, { firstName: formFirstName.trim(), lastName: formLastName.trim(), groupId: formGroupId, isGuest: false });
    }
    showAddModal = false;
  }

  async function deleteMember(id: Id<'members'>) { await client.mutation(api.members.remove, { id }); showDeleteConfirm = null; }
  
  async function archiveMember(member: Doc<'members'>) { await client.mutation(api.members.update, { id: member._id, archived: true }); showArchiveConfirm = null; }
  
  async function unarchiveMember(member: Doc<'members'>) {
    await client.mutation(api.members.update, { id: member._id, archived: false });
    showUnarchivePrompt = null;
    if (pendingRegistration && pendingRegistration._id === member._id && activeTournament) {
      await client.mutation(api.participants.add, { tournamentId: activeTournament._id, memberId: member._id, groupId: member.groupId });
      pendingRegistration = null;
    }
  }

  async function handleRegisterClick(member: Doc<'members'>) {
    if (!activeTournament) return;
    if (member.archived) { pendingRegistration = member; showUnarchivePrompt = member; return; }
    await client.mutation(api.participants.add, { tournamentId: activeTournament._id, memberId: member._id, groupId: member.groupId });
  }

  async function registerAllGroupMembers() {
    if (!activeTournament || !selectedGroupId) return;
    await client.mutation(api.participants.registerGroupMembers, { tournamentId: activeTournament._id, groupId: selectedGroupId });
  }

  async function saveGroup() {
    if (!groupFormId.trim() || !groupFormName.trim()) return;
    if (editingGroup) {
      await client.mutation(api.groups.update, { id: editingGroup._id, groupId: groupFormId.trim(), name: groupFormName.trim(), isHantei: groupFormIsHantei });
    } else {
      await client.mutation(api.groups.create, { groupId: groupFormId.trim(), name: groupFormName.trim(), isHantei: groupFormIsHantei });
    }
    showGroupModal = false;
  }

  async function deleteGroup(item: { id: string | null }) {
    const group = groups.find(g => g.groupId === item.id);
    if (group) { await client.mutation(api.groups.remove, { id: group._id }); showDeleteGroupConfirm = null; }
  }

  // Bulk add
  function addBulkRow() { bulkRows = [...bulkRows, { firstName: '', lastName: '', groupId: groups[0]?.groupId || '' }]; }
  function removeBulkRow(index: number) { if (bulkRows.length > 1) bulkRows = bulkRows.filter((_, i) => i !== index); }
  function updateBulkRow(index: number, field: 'firstName' | 'lastName' | 'groupId', value: string) { bulkRows = bulkRows.map((row, i) => i === index ? { ...row, [field]: value } : row); }
  async function saveBulkMembers() {
    const validRows = bulkRows.filter(row => row.firstName.trim() && row.lastName.trim() && row.groupId);
    if (validRows.length === 0) return;
    await client.mutation(api.members.bulkCreate, { members: validRows.map(row => ({ firstName: row.firstName.trim(), lastName: row.lastName.trim(), groupId: row.groupId, isGuest: false })) });
    showBulkAddModal = false;
  }

  // CSV Import
  function parseCSV(text: string) {
    parseError = ''; parsedData = [];
    if (!text.trim()) { parseError = 'No data provided'; return; }
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) { parseError = 'CSV must have a header row and at least one data row'; return; }
    const header = lines[0].split(',').map(h => h.toLowerCase().trim().replace(/"/g, ''));
    const firstNameIdx = header.findIndex(h => h.includes('first') || h === 'firstname');
    const lastNameIdx = header.findIndex(h => h.includes('last') || h === 'lastname');
    const groupIdx = header.findIndex(h => h.includes('group') || h === 'groupid');
    if (firstNameIdx === -1 || lastNameIdx === -1) { parseError = 'CSV must have "First Name" and "Last Name" columns'; return; }
    const results: typeof parsedData = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      const firstName = row[firstNameIdx] || '';
      const lastName = row[lastNameIdx] || '';
      if (!firstName || !lastName) continue;
      let groupId = groupIdx !== -1 ? row[groupIdx] || '' : '';
      if (!groups.some(g => g.groupId === groupId)) groupId = groups[0]?.groupId || '';
      results.push({ firstName, lastName, groupId, isGuest: false });
    }
    if (results.length === 0) { parseError = 'No valid data rows found'; return; }
    parsedData = results;
  }

  function handleFileDrop(e: DragEvent) { e.preventDefault(); isDragging = false; const file = e.dataTransfer?.files[0]; if (file) readFile(file); }
  function handleFileSelect(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (file) readFile(file); }
  function readFile(file: File) {
    if (!file.name.endsWith('.csv')) { parseError = 'Please upload a CSV file'; return; }
    const reader = new FileReader();
    reader.onload = (e) => { csvText = e.target?.result as string; parseCSV(csvText); };
    reader.readAsText(file);
  }

  async function importMembers() {
    if (parsedData.length === 0) return;
    isImporting = true;
    try {
      await client.mutation(api.members.bulkCreate, { members: parsedData });
      importSuccess = true;
      setTimeout(() => { showImportModal = false; }, 1500);
    } catch { parseError = 'Error importing members'; }
    isImporting = false;
  }
</script>

<svelte:head><title>Members - Admin Portal</title></svelte:head>

<div class="admin-page">
  <AdminSidePanel
    title="Groups"
    items={groupPanelItems}
    selectedId={selectedGroupId}
    editMode={groupsEditMode}
    allItemsLabel="All Members"
    allItemsIcon="👥"
    totalCount={members.filter(m => !m.archived).length}
    onSelect={(id) => selectedGroupId = id}
    onAdd={openAddGroupModal}
    onEdit={openEditGroupModal}
    onDelete={(item) => { showDeleteGroupConfirm = groups.find(g => g.groupId === item.id)?._id || null; }}
    onToggleEdit={() => groupsEditMode = !groupsEditMode}
  />

  <main class="admin-content">
    <AdminTopBar
      title={selectedGroupName()}
      subtitle={selectedGroupId ? `ID: ${selectedGroupId}` : ''}
      stats={[
        { value: filteredMembers().length, label: 'Members' },
        { value: registeredCount(), label: 'Registered', variant: 'success' },
        { value: filteredMembers().length - registeredCount(), label: 'Not Reg.', variant: 'muted' },
      ]}
    >
      {#snippet actions()}
        {#if selectedGroupId && activeTournament}
          <Button variant="default" size="sm" class="btn-success" onclick={registerAllGroupMembers}><UserCheck size={14} />Register All</Button>
        {/if}
        <Button variant="secondary" size="sm" onclick={openImportModal}><Upload size={14} />Import CSV</Button>
        <div class="add-split">
          <Button size="sm" onclick={openAddModal}><Plus size={14} />Add Member</Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="dropdown-toggle"><ChevronDown size={14} /></DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={openAddModal}><UserPlus size={14} class="mr-2" />Add Single</DropdownMenu.Item>
              <DropdownMenu.Item onclick={openBulkAddModal}><Users size={14} class="mr-2" />Add Bulk</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      {/snippet}
    </AdminTopBar>

    <AdminToolbar bind:searchValue={searchQuery} searchPlaceholder="Search members...">
      {#snippet filters()}
        <ToggleGroup.Root type="single" value={filterStatus} onValueChange={(v) => { if (v) filterStatus = v as typeof filterStatus; }}>
          <ToggleGroup.Item value="all">All</ToggleGroup.Item>
          <ToggleGroup.Item value="registered">Registered</ToggleGroup.Item>
          <ToggleGroup.Item value="unregistered">Not Reg.</ToggleGroup.Item>
        </ToggleGroup.Root>
      {/snippet}
    </AdminToolbar>

    <AdminDataTable data={filteredMembers()} bind:currentPage bind:rowsPerPage emptyMessage="No members found">
      {#snippet columns()}
        <th style="width: 44px;"><Checkbox /></th>
        <th style="width: 200px;">Member</th>
        <th style="width: 140px;">Group</th>
        <th style="width: 120px;">Status</th>
        <th style="width: 100px;">Actions</th>
      {/snippet}
      {#snippet row(member, index)}
        {@const group = getGroup(member.groupId)}
        <td><Checkbox /></td>
        <td><span class="name">{member.firstName} {member.lastName}</span>{#if member.archived}<span class="badge-archived">Archived</span>{/if}</td>
        <td>{#if group}<span class="badge" class:badge-primary={!group.isHantei} class:badge-hantei={group.isHantei}>{group.name}</span>{:else}<span class="text-muted">{member.groupId}</span>{/if}</td>
        <td>{#if member.archived}<span class="status-archived">Archived</span>{:else if !activeTournament}<span class="status-inactive">No Shiai</span>{:else if isRegistered(member._id)}<span class="badge badge-success">✓ Registered</span>{:else}<button class="status-link" onclick={() => handleRegisterClick(member)}>+ Register</button>{/if}</td>
        <td><div class="action-buttons">
          <button class="action-btn" onclick={() => openEditModal(member)}><Pencil size={14} /></button>
          {#if member.archived}<button class="action-btn restore" onclick={() => unarchiveMember(member)} title="Unarchive"><ArchiveRestore size={14} /></button>
          {:else}<button class="action-btn archive" onclick={() => showArchiveConfirm = member} title="Archive"><Archive size={14} /></button>{/if}
          <button class="action-btn danger" onclick={() => showDeleteConfirm = member._id}><Trash2 size={14} /></button>
        </div></td>
      {/snippet}
    </AdminDataTable>
  </main>
</div>

<!-- ADD/EDIT MEMBER MODAL -->
<Dialog.Root bind:open={showAddModal}><Dialog.Content><Dialog.Header><Dialog.Title>{editingMember ? 'Edit Member' : 'Add Member'}</Dialog.Title></Dialog.Header>
<div class="form-stack"><div class="form-group"><Label>First Name</Label><Input bind:value={formFirstName} placeholder="First name" /></div><div class="form-group"><Label>Last Name</Label><Input bind:value={formLastName} placeholder="Last name" /></div><div class="form-group"><Label>Group</Label><Select.Root type="single" bind:value={formGroupId}><Select.Trigger><Select.Value placeholder="Select group" /></Select.Trigger><Select.Content>{#each groups as g}<Select.Item value={g.groupId}>{g.name}</Select.Item>{/each}</Select.Content></Select.Root></div></div>
<Dialog.Footer><Button variant="ghost" onclick={() => showAddModal = false}>Cancel</Button><Button onclick={saveMember}>{editingMember ? 'Save' : 'Add Member'}</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<!-- ADD/EDIT GROUP MODAL -->
<Dialog.Root bind:open={showGroupModal}><Dialog.Content><Dialog.Header><Dialog.Title>{editingGroup ? 'Edit Group' : 'Add Group'}</Dialog.Title></Dialog.Header>
<div class="form-stack"><div class="form-group"><Label>Group ID</Label><Input bind:value={groupFormId} placeholder="e.g., YUD, MUD" /><span class="form-hint">Short identifier</span></div><div class="form-group"><Label>Display Name</Label><Input bind:value={groupFormName} placeholder="e.g., Yudansha" /></div><div class="form-group"><div class="flex items-center gap-2"><Checkbox id="hantei" bind:checked={groupFormIsHantei} /><Label for="hantei">Hantei</Label></div></div></div>
<Dialog.Footer><Button variant="ghost" onclick={() => showGroupModal = false}>Cancel</Button><Button onclick={saveGroup}>{editingGroup ? 'Save' : 'Add Group'}</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<!-- BULK ADD MODAL -->
<Dialog.Root bind:open={showBulkAddModal}><Dialog.Content class="sm:max-w-[560px]"><Dialog.Header><Dialog.Title>Add Multiple Members</Dialog.Title></Dialog.Header>
<div class="bulk-body"><div class="bulk-header"><span>First Name</span><span>Last Name</span><span>Group</span><span></span></div>
{#each bulkRows as row, i}<div class="bulk-row"><Input placeholder="First" value={row.firstName} oninput={(e) => updateBulkRow(i, 'firstName', e.currentTarget.value)} /><Input placeholder="Last" value={row.lastName} oninput={(e) => updateBulkRow(i, 'lastName', e.currentTarget.value)} /><Select.Root type="single" value={row.groupId} onValueChange={(v) => updateBulkRow(i, 'groupId', v)}><Select.Trigger><Select.Value placeholder="Group" /></Select.Trigger><Select.Content>{#each groups as g}<Select.Item value={g.groupId}>{g.name}</Select.Item>{/each}</Select.Content></Select.Root><button class="bulk-remove" onclick={() => removeBulkRow(i)} disabled={bulkRows.length === 1}><X size={14} /></button></div>{/each}
<Button variant="ghost" class="w-full" onclick={addBulkRow}><Plus size={14} />Add Row</Button></div>
<Dialog.Footer><span class="mr-auto text-muted-foreground">{bulkRows.filter(r => r.firstName && r.lastName).length} ready</span><Button variant="ghost" onclick={() => showBulkAddModal = false}>Cancel</Button><Button onclick={saveBulkMembers}>Add Members</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<!-- CSV IMPORT MODAL -->
<Dialog.Root bind:open={showImportModal}><Dialog.Content class="sm:max-w-[520px]"><Dialog.Header><Dialog.Title>Import Members</Dialog.Title><Dialog.Description>Upload CSV or paste data. Required: First Name, Last Name. Optional: Group.</Dialog.Description></Dialog.Header>
<Tabs.Root bind:value={importTab}><Tabs.List><Tabs.Trigger value="upload"><FileSpreadsheet size={16} />Upload</Tabs.Trigger><Tabs.Trigger value="paste"><ClipboardPaste size={16} />Paste</Tabs.Trigger></Tabs.List>
<Tabs.Content value="upload"><div class="dropzone" class:dragging={isDragging} role="group" ondragover={(e) => { e.preventDefault(); isDragging = true; }} ondragleave={() => isDragging = false} ondrop={handleFileDrop}><input type="file" accept=".csv" class="file-input" onchange={handleFileSelect} /><FileSpreadsheet size={32} /><p>Drop CSV here or click to browse</p></div></Tabs.Content>
<Tabs.Content value="paste"><Textarea placeholder="Paste CSV data here..." bind:value={csvText} oninput={() => csvText && parseCSV(csvText)} rows={6} /></Tabs.Content></Tabs.Root>
{#if parseError}<p class="error">{parseError}</p>{/if}
{#if parsedData.length > 0}<p class="success">{parsedData.length} members ready to import</p>{/if}
{#if importSuccess}<p class="success">✓ Import successful!</p>{/if}
<Dialog.Footer><Button variant="ghost" onclick={() => showImportModal = false}>Cancel</Button><Button onclick={importMembers} disabled={parsedData.length === 0 || isImporting}>{isImporting ? 'Importing...' : 'Import'}</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<!-- DELETE/ARCHIVE CONFIRMATIONS -->
<Dialog.Root open={showArchiveConfirm !== null} onOpenChange={(o) => { if (!o) showArchiveConfirm = null; }}><Dialog.Content><Dialog.Header><Dialog.Title>Archive Member</Dialog.Title></Dialog.Header><Dialog.Description>{#if showArchiveConfirm}Archive <strong>{showArchiveConfirm.firstName} {showArchiveConfirm.lastName}</strong>? They cannot be registered until unarchived.{/if}</Dialog.Description><Dialog.Footer><Button variant="ghost" onclick={() => showArchiveConfirm = null}>Cancel</Button><Button onclick={() => showArchiveConfirm && archiveMember(showArchiveConfirm)}>Archive</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root open={showUnarchivePrompt !== null} onOpenChange={(o) => { if (!o) { showUnarchivePrompt = null; pendingRegistration = null; } }}><Dialog.Content><Dialog.Header><Dialog.Title>Member is Archived</Dialog.Title></Dialog.Header><Dialog.Description>{#if showUnarchivePrompt}<strong>{showUnarchivePrompt.firstName} {showUnarchivePrompt.lastName}</strong> is archived. Unarchive and register?{/if}</Dialog.Description><Dialog.Footer><Button variant="ghost" onclick={() => { showUnarchivePrompt = null; pendingRegistration = null; }}>Cancel</Button><Button onclick={() => showUnarchivePrompt && unarchiveMember(showUnarchivePrompt)}>Unarchive & Register</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root open={showDeleteConfirm !== null} onOpenChange={(o) => { if (!o) showDeleteConfirm = null; }}><Dialog.Content><Dialog.Header><Dialog.Title>Delete Member</Dialog.Title></Dialog.Header><Dialog.Description>Are you sure? This cannot be undone.</Dialog.Description><Dialog.Footer><Button variant="ghost" onclick={() => showDeleteConfirm = null}>Cancel</Button><Button variant="destructive" onclick={() => showDeleteConfirm && deleteMember(showDeleteConfirm)}>Delete</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<Dialog.Root open={showDeleteGroupConfirm !== null} onOpenChange={(o) => { if (!o) showDeleteGroupConfirm = null; }}><Dialog.Content><Dialog.Header><Dialog.Title>Delete Group</Dialog.Title></Dialog.Header><Dialog.Description>Are you sure? Members in this group will need reassignment.</Dialog.Description><Dialog.Footer><Button variant="ghost" onclick={() => showDeleteGroupConfirm = null}>Cancel</Button><Button variant="destructive" onclick={() => showDeleteGroupConfirm && client.mutation(api.groups.remove, { id: showDeleteGroupConfirm }).then(() => showDeleteGroupConfirm = null)}>Delete</Button></Dialog.Footer></Dialog.Content></Dialog.Root>

<style>
  .admin-page { display: flex; height: calc(100vh - 64px); margin: -24px; overflow: hidden; }
  .admin-content { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--background); overflow: hidden; }
  
  /* Table cells */
  .name { font-weight: 500; }
  .text-muted { color: #52525b; }
  .badge-archived { font-size: 10px; background: rgba(113, 113, 122, 0.2); color: #71717a; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
  
  /* Badges */
  .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .badge-primary { background: rgba(129, 140, 248, 0.15); color: #a78bfa; }
  .badge-hantei { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
  .badge-success { background: rgba(52, 211, 153, 0.15); color: #34d399; }
  
  /* Status */
  .status-archived { color: #71717a; font-size: 13px; }
  .status-inactive { color: #71717a; font-size: 13px; font-style: italic; }
  .status-link { background: none; border: none; color: #818cf8; font-size: 13px; cursor: pointer; font-family: inherit; padding: 0; }
  .status-link:hover { color: #a78bfa; }
  
  /* Actions */
  .action-buttons { display: flex; gap: 4px; }
  .action-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #71717a; background: transparent; border: none; cursor: pointer; transition: all 0.15s; }
  .action-btn:hover { background: #27272a; color: #fafafa; }
  .action-btn.danger:hover { background: rgba(248, 113, 113, 0.15); color: #f87171; }
  .action-btn.archive:hover { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
  .action-btn.restore:hover { background: rgba(52, 211, 153, 0.15); color: #34d399; }
  
  /* Top bar buttons */
  :global(.btn-success) { background: #34d399 !important; color: #09090b !important; font-weight: 600; }
  :global(.btn-success:hover) { background: #4ade80 !important; }
  
  /* Split button (Add Member with dropdown) */
  .add-split { display: flex; }
  .add-split :global(button:first-child) { border-top-right-radius: 0; border-bottom-right-radius: 0; }
  .add-split :global(.dropdown-toggle) { 
    height: 36px; 
    width: 32px; 
    padding: 0; 
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-top-left-radius: 0; 
    border-bottom-left-radius: 0; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    background: var(--primary, #818cf8);
    color: var(--primary-foreground, #fafafa);
  }
  .add-split :global(.dropdown-toggle:hover) { background: #a78bfa; }
  
  /* Forms */
  .form-stack { display: flex; flex-direction: column; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-hint { font-size: 12px; color: #71717a; }
  
  /* Bulk add */
  .bulk-body { display: flex; flex-direction: column; gap: 8px; }
  .bulk-header { display: grid; grid-template-columns: 1fr 1fr 1fr 32px; gap: 8px; font-size: 12px; font-weight: 600; color: #71717a; padding: 0 4px; }
  .bulk-row { display: grid; grid-template-columns: 1fr 1fr 1fr 32px; gap: 8px; align-items: center; }
  .bulk-remove { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #71717a; cursor: pointer; }
  .bulk-remove:hover:not(:disabled) { background: rgba(248, 113, 113, 0.15); color: #f87171; }
  .bulk-remove:disabled { opacity: 0.3; cursor: not-allowed; }
  
  /* CSV Import */
  .dropzone { border: 2px dashed rgba(82, 82, 91, 0.4); border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; position: relative; color: #71717a; transition: all 0.2s; }
  .dropzone:hover, .dropzone.dragging { border-color: #818cf8; background: rgba(129, 140, 248, 0.05); }
  .dropzone .file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .dropzone p { margin-top: 8px; font-size: 14px; }
  .error { color: #f87171; font-size: 13px; margin-top: 8px; }
  .success { color: #34d399; font-size: 13px; margin-top: 8px; }
</style>
