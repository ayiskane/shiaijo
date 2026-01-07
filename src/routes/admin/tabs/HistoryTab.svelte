<script lang="ts">
  import autoAnimate from '@formkit/auto-animate';
  import * as Card from '$lib/components/ui/card';
  import { History } from '@lucide/svelte';

  export let tournaments: any[] = [];

  let listEl: HTMLElement;
  $: listEl && autoAnimate(listEl);

  $: completedTournaments = tournaments.filter((t) => t.status === 'completed');
</script>

<h1 class="mb-6 text-2xl font-bold">Tournament History</h1>
{#if completedTournaments.length === 0}
  <Card.Root class="border-dashed">
    <Card.Content class="flex flex-col items-center justify-center py-12">
      <History class="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p class="text-muted-foreground">No completed tournaments yet</p>
    </Card.Content>
  </Card.Root>
{:else}
  <div class="space-y-4" bind:this={listEl}>
    {#each completedTournaments as tournament (tournament._id)}
      <Card.Root>
        <Card.Header>
          <Card.Title class="truncate">{tournament.name}</Card.Title>
          <Card.Description>📅 {tournament.date}</Card.Description>
        </Card.Header>
      </Card.Root>
    {/each}
  </div>
{/if}
