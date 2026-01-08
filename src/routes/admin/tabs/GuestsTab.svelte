<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Separator } from '$lib/components/ui/separator';
  import { UserPlus, Upload, Users } from '@lucide/svelte';

  export let guests: any[] = [];
  export let groups: any[] = [];
  export let selectedTournament: any = null;
  export let registeredMemberIds: Set<string> = new Set();

  export let onCreateGuest: () => void;
  export let onBulkAddGuests: () => void;
  export let onUpdateGuestGroup: (id: string, groupId: string) => void;
  export let onToggleGuestRegistration: (id: string, groupId: string, checked: boolean) => void;

  export let newGuest = { firstName: '', lastName: '', dojo: '', groupId: '' };
  export let bulkGuestsText = '';
  export let registerGuestsGroupId = '';
  export let registerGuestsToTournament = true;

  function groupLabel(id: string) {
    const g = groups.find((g) => g.groupId === id);
    return g ? g.name : id || 'Select group';
  }
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <h2 class="text-xl font-semibold">Guests</h2>
      <Badge variant="secondary">{guests.length} guests</Badge>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={onBulkAddGuests}><Upload class="w-4 h-4 mr-1" /> Bulk add</Button>
      <Button size="sm" onclick={onCreateGuest}><UserPlus class="w-4 h-4 mr-1" /> Add guest</Button>
    </div>
  </div>

  <div class="grid gap-3 md:grid-cols-2">
    <div class="card glass p-4 space-y-3">
      <h3 class="text-sm font-semibold">New guest</h3>
      <div class="grid grid-cols-2 gap-2">
        <Input placeholder="First name" bind:value={newGuest.firstName} />
        <Input placeholder="Last name" bind:value={newGuest.lastName} />
      </div>
      <Input placeholder="Dojo (optional)" bind:value={newGuest.dojo} />
      <Select.Root value={newGuest.groupId} onValueChange={(v) => newGuest.groupId = v}>
        <Select.Trigger class="w-full h-10">{groupLabel(newGuest.groupId)}</Select.Trigger>
        <Select.Content>
          {#each groups as g}
            <Select.Item value={g.groupId}>{g.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <div class="flex items-center gap-2 text-sm">
        <Checkbox checked={registerGuestsToTournament} on:click={() => registerGuestsToTournament = !registerGuestsToTournament} />
        <span>Register to current tournament after adding</span>
      </div>
      <Button class="w-full" onclick={onCreateGuest}>Add guest</Button>
    </div>

    <div class="card glass p-4 space-y-3">
      <h3 class="text-sm font-semibold">Bulk add</h3>
      <p class="text-xs text-muted-foreground">One per line: first,last,dojo,groupId</p>
      <textarea class="w-full h-28 rounded-md bg-muted/40 p-2 text-sm" bind:value={bulkGuestsText}></textarea>
      <div class="grid grid-cols-2 gap-2 items-center">
        <Select.Root value={registerGuestsGroupId} onValueChange={(v) => registerGuestsGroupId = v}>
          <Select.Trigger class="w-full h-10">{groupLabel(registerGuestsGroupId)}</Select.Trigger>
          <Select.Content>
            {#each groups as g}
              <Select.Item value={g.groupId}>{g.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <div class="flex items-center gap-2 text-sm">
          <Checkbox checked={registerGuestsToTournament} on:click={() => registerGuestsToTournament = !registerGuestsToTournament} />
          <span>Register all to tournament</span>
        </div>
      </div>
      <Button class="w-full" variant="outline" onclick={onBulkAddGuests}>Bulk add guests</Button>
    </div>
  </div>

  <div class="card glass p-4 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Users class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-semibold">Guest list</span>
      </div>
      {#if !selectedTournament}
        <Badge variant="outline">No tournament selected</Badge>
      {:else}
        <Badge variant="secondary">{selectedTournament.name}</Badge>
      {/if}
    </div>
    <div class="overflow-auto border rounded-md">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th class="text-left px-3 py-2">Name</th>
            <th class="text-left px-3 py-2">Dojo</th>
            <th class="text-left px-3 py-2">Group</th>
            <th class="text-left px-3 py-2 w-28">Status</th>
          </tr>
        </thead>
        <tbody>
          {#if guests.length === 0}
            <tr><td colspan="4" class="px-3 py-4 text-center text-muted-foreground text-sm">No guests yet.</td></tr>
          {:else}
            {#each guests as guest (guest._id)}
              <tr class="border-t">
                <td class="px-3 py-2 font-medium">{guest.firstName} {guest.lastName}</td>
                <td class="px-3 py-2 text-muted-foreground">{guest.dojo || '—'}</td>
                <td class="px-3 py-2">
                  <Select.Root value={guest.groupId} onValueChange={(v) => onUpdateGuestGroup(guest._id, v)}>
                    <Select.Trigger class="h-9 w-[200px]">{groupLabel(guest.groupId)}</Select.Trigger>
                    <Select.Content>
                      {#each groups as g}
                        <Select.Item value={g.groupId}>{g.name}</Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </td>
                <td class="px-3 py-2">
                  <label class="inline-flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={registeredMemberIds.has(guest._id as any)}
                      disabled={!selectedTournament}
                      on:click={() => onToggleGuestRegistration(guest._id, guest.groupId, true)}
                    />
                    <span>{registeredMemberIds.has(guest._id as any) ? 'Registered' : 'Register'}</span>
                  </label>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .card {
    border: 1px solid var(--border-subtle);
    border-radius: 16px;
  }
</style>
