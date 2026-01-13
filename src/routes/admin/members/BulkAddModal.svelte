<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { api } from '../../../convex/_generated/api';
  import type { Doc } from '../../../convex/_generated/dataModel';
  
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';

  let { 
    open = $bindable(false), 
    groups 
  }: { 
    open: boolean; 
    groups: Doc<'groups'>[];
  } = $props();

  const client = useConvexClient();

  let bulkRows = $state<Array<{firstName: string; lastName: string; groupId: string}>>([
    { firstName: '', lastName: '', groupId: '' }
  ]);

  function addBulkRow() { 
    bulkRows = [...bulkRows, { firstName: '', lastName: '', groupId: groups[0]?.groupId || '' }]; 
  }
  
  function removeBulkRow(index: number) { 
    if (bulkRows.length > 1) bulkRows = bulkRows.filter((_, i) => i !== index); 
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
        isGuest: false 
      })) 
    });
    open = false;
  }

  let readyCount = $derived(bulkRows.filter(r => r.firstName && r.lastName).length);

  // Reset state when modal opens
  $effect(() => {
    if (open) {
      bulkRows = [{ firstName: '', lastName: '', groupId: groups[0]?.groupId || '' }];
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[560px]">
    <Dialog.Header>
      <Dialog.Title>Add Multiple Members</Dialog.Title>
    </Dialog.Header>
    <div class="bulk-body">
      <div class="bulk-header">
        <span>First Name</span>
        <span>Last Name</span>
        <span>Group</span>
        <span></span>
      </div>
      {#each bulkRows as row, i}
        <div class="bulk-row">
          <Input 
            placeholder="First" 
            value={row.firstName} 
            oninput={(e) => updateBulkRow(i, 'firstName', e.currentTarget.value)} 
          />
          <Input 
            placeholder="Last" 
            value={row.lastName} 
            oninput={(e) => updateBulkRow(i, 'lastName', e.currentTarget.value)} 
          />
          <Select.Root type="single" value={row.groupId} onValueChange={(v) => updateBulkRow(i, 'groupId', v)}>
            <Select.Trigger>
              <Select.Value placeholder="Group" />
            </Select.Trigger>
            <Select.Content>
              {#each groups as g}
                <Select.Item value={g.groupId}>{g.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          <Button variant="ghost" size="icon-sm" class="text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onclick={() => removeBulkRow(i)} disabled={bulkRows.length === 1}>
            <X size={14} />
          </Button>
        </div>
      {/each}
      <Button variant="ghost" class="w-full" onclick={addBulkRow}>
        <Plus size={14} />Add Row
      </Button>
    </div>
    <Dialog.Footer>
      <span class="mr-auto text-muted-foreground">{readyCount} ready</span>
      <Button variant="ghost" onclick={() => open = false}>Cancel</Button>
      <Button onclick={saveBulkMembers}>Add Members</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .bulk-body { display: flex; flex-direction: column; gap: 8px; }
  .bulk-header { 
    display: grid; 
    grid-template-columns: 1fr 1fr 1fr 32px; 
    gap: 8px; 
    font-size: 12px; 
    font-weight: 600; 
    color: #71717a; 
    padding: 0 4px; 
  }
  .bulk-row { 
    display: grid; 
    grid-template-columns: 1fr 1fr 1fr 32px; 
    gap: 8px; 
    align-items: center; 
  }
</style>
