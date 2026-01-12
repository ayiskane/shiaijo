<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  
  const client = useConvexClient();

  // Form state
  let adminPassword = $state('');
  let courtkeeperPassword = $state('');
  let saving = $state<string | null>(null);
  let confirmClear = $state<string | null>(null);

  async function saveAdminPassword() {
    if (!adminPassword.trim()) return;
    saving = 'admin';
    try {
      await client.mutation(api.settings.set, { key: 'adminPassword', value: adminPassword });
      adminPassword = '';
    } catch (e) {
      console.error('Failed to save admin password:', e);
    }
    saving = null;
  }

  async function saveCourtkeeperPassword() {
    if (!courtkeeperPassword.trim()) return;
    saving = 'courtkeeper';
    try {
      await client.mutation(api.settings.set, { key: 'courtkeeperPassword', value: courtkeeperPassword });
      courtkeeperPassword = '';
    } catch (e) {
      console.error('Failed to save courtkeeper password:', e);
    }
    saving = null;
  }

  async function handleClearTournaments() {
    if (confirmClear !== 'tournaments') {
      confirmClear = 'tournaments';
      return;
    }
    try {
      await client.mutation(api.tournaments.clearAll, {});
      confirmClear = null;
    } catch (e) {
      console.error('Failed to clear tournaments:', e);
    }
  }

  async function handleClearMembers() {
    if (confirmClear !== 'members') {
      confirmClear = 'members';
      return;
    }
    try {
      await client.mutation(api.members.clearAll, {});
      confirmClear = null;
    } catch (e) {
      console.error('Failed to clear members:', e);
    }
  }

  function cancelConfirm() {
    confirmClear = null;
  }
</script>

<svelte:head>
  <title>Settings - Admin Portal</title>
</svelte:head>

<div class="settings-page">
  <h1 class="page-title">Settings</h1>

  <!-- PASSWORDS SECTION -->
  <section class="section">
    <h2 class="section-title">Passwords</h2>
    
    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-label">Admin Password</div>
        <div class="setting-desc">Password for admin portal access</div>
      </div>
      <div class="setting-action">
        <input 
          type="password" 
          class="form-input" 
          placeholder="New password"
          bind:value={adminPassword}
          disabled={saving === 'admin'}
        >
        <button 
          class="btn btn-primary" 
          onclick={saveAdminPassword}
          disabled={!adminPassword.trim() || saving === 'admin'}
        >
          {saving === 'admin' ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-label">Courtkeeper Password</div>
        <div class="setting-desc">Password for courtkeeper portal</div>
      </div>
      <div class="setting-action">
        <input 
          type="password" 
          class="form-input" 
          placeholder="New password"
          bind:value={courtkeeperPassword}
          disabled={saving === 'courtkeeper'}
        >
        <button 
          class="btn btn-primary" 
          onclick={saveCourtkeeperPassword}
          disabled={!courtkeeperPassword.trim() || saving === 'courtkeeper'}
        >
          {saving === 'courtkeeper' ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </section>

  <!-- DEBUG SECTION -->
  <section class="section danger">
    <h2 class="section-title">⚠️ Debug Actions</h2>
    
    <div class="danger-row">
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Clear All Tournaments</div>
          <div class="setting-desc">Delete all tournaments, matches, and results</div>
        </div>
        <div class="setting-action">
          {#if confirmClear === 'tournaments'}
            <button class="btn btn-ghost" onclick={cancelConfirm}>Cancel</button>
            <button class="btn btn-danger-solid" onclick={handleClearTournaments}>Confirm</button>
          {:else}
            <button class="btn btn-danger" onclick={handleClearTournaments}>Clear</button>
          {/if}
        </div>
      </div>
    </div>

    <div class="danger-row">
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">Clear All Members</div>
          <div class="setting-desc">Delete all member records from roster</div>
        </div>
        <div class="setting-action">
          {#if confirmClear === 'members'}
            <button class="btn btn-ghost" onclick={cancelConfirm}>Cancel</button>
            <button class="btn btn-danger-solid" onclick={handleClearMembers}>Confirm</button>
          {:else}
            <button class="btn btn-danger" onclick={handleClearMembers}>Clear</button>
          {/if}
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .settings-page {
    max-width: 700px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 32px;
  }

  .section {
    margin-bottom: 40px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #71717a;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #27272a;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #27272a;
  }

  .setting-row:last-child {
    border-bottom: none;
  }

  .setting-info {
    flex: 1;
    min-width: 0;
  }

  .setting-label {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
    color: #fafafa;
  }

  .setting-desc {
    font-size: 13px;
    color: #71717a;
  }

  .setting-action {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .form-input {
    width: 200px;
    padding: 12px 14px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    color: #fafafa;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
  }

  .form-input::placeholder {
    color: #52525b;
  }

  .form-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn {
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #818cf8;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #6366f1;
  }

  .btn-ghost {
    background: transparent;
    color: #a1a1aa;
    border: 1px solid #27272a;
  }

  .btn-ghost:hover:not(:disabled) {
    background: #18181b;
    color: #fafafa;
  }

  .btn-danger {
    background: transparent;
    color: #ef4444;
    border: 1px solid transparent;
  }

  .btn-danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-danger-solid {
    background: #ef4444;
    color: white;
  }

  .btn-danger-solid:hover:not(:disabled) {
    background: #dc2626;
  }

  .section.danger .section-title {
    color: #ef4444;
  }

  .danger-row {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    padding: 4px 16px;
    margin-bottom: 12px;
  }

  .danger-row:last-child {
    margin-bottom: 0;
  }

  .danger-row .setting-row {
    padding: 12px 0;
    border: none;
  }

  .btn:focus-visible, .form-input:focus-visible {
    outline: 3px solid #818cf8;
    outline-offset: 2px;
  }

  @media (max-width: 640px) {
    .setting-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .setting-action {
      justify-content: flex-end;
    }

    .form-input {
      width: 100%;
      flex: 1;
    }
  }
</style>

