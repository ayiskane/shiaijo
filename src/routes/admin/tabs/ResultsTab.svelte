<script lang="ts">
  import autoAnimate from '@formkit/auto-animate';
  import { cn } from '$lib/utils';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Skeleton } from '$lib/components/ui/skeleton';

  export let groups: any[] = [];
  export let matches: any[] = [];
  export let selectedTournament: any = null;
  export let matchesByGroupId: Map<string, any[]> = new Map();
  export let completedMatchesByGroupId: Map<string, any[]> = new Map();
  export let standingsData: any;
  export let SCORE_LABELS: Record<number, string> = {};
  export let buildScoreTimeline: (match: any) => any[];
  export let getTieKey: (row: any) => string;
  export let getMemberName: (id: string) => string;
  export let formatTimer: (s: number) => string;

  let listEl: HTMLElement;
  $: listEl && autoAnimate(listEl);
  
  $: completedMatches = matches.filter(m => m.status === 'completed');
</script>

<!-- Top Bar -->
<div class="top-bar">
  <div class="top-bar-left">
    <div class="top-bar-breadcrumb">Admin / Shiai</div>
    <h1 class="top-bar-title">Results & Standings</h1>
  </div>
  {#if selectedTournament}
    <div class="top-bar-center">
      <div class="flex items-center gap-3 px-4 py-2 rounded-lg" style="background: var(--background); border: 1px solid var(--border-subtle);">
        <span class="text-xs" style="color: var(--text-muted);">Tournament:</span>
        <span class="text-sm font-semibold" style="color: var(--text-primary);">{selectedTournament.name}</span>
      </div>
    </div>
  {/if}
  <div class="top-bar-right">
    <button class="btn-sm ghost">📄 Export</button>
    <button class="btn-sm ghost">🖨 Print</button>
  </div>
</div>

{#if !selectedTournament}
  <p class="text-muted-foreground">No tournament selected</p>
{:else if matches.length === 0}
  <p class="text-muted-foreground">No matches in this tournament</p>
{:else}
  <div class="space-y-4" bind:this={listEl}>
    {#each groups as group (group._id)}
      {@const gm = matchesByGroupId.get(group.groupId) ?? []}
      {@const done = completedMatchesByGroupId.get(group.groupId) ?? []}
      {#if gm.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-base sm:text-lg">
              <span class="truncate">{group.name}</span>
              <Badge variant="outline" class="text-xs shrink-0">{done.length}/{gm.length}</Badge>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {@const standings = standingsData.standingsByGroupId.get(group.groupId) ?? []}
            {@const tiedKeys = standingsData.tieKeysByGroupId.get(group.groupId) ?? new Set()}
            {@const top3 = standings.slice(0, 3)}
            {@const needsSuddenDeath = top3.some(row => tiedKeys.has(getTieKey(row)))}
            {#if standings.length > 0}
              <div class="mb-4 rounded-lg border border-border bg-background/40 p-3">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Standings</p>
                  {#if needsSuddenDeath}
                    <Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">Tie → Sudden Death Needed</Badge>
                  {/if}
                </div>
                <div class="grid grid-cols-[1fr_70px_50px_60px] gap-2 text-[10px] uppercase text-muted-foreground">
                  <span>Player</span>
                  <span class="text-center">W-T-L</span>
                  <span class="text-center">Pts</span>
                  <span class="text-center">Ippons</span>
                </div>
                <div class="mt-2 space-y-1">
                  {#each standings as row, idx}
                    <div class={cn('grid grid-cols-[1fr_70px_50px_60px] gap-2 items-center rounded px-2 py-1 text-xs sm:text-sm', idx < 3 ? 'bg-emerald-900/20' : 'bg-muted/40')}>
                      <div class="flex items-center gap-2 truncate">
                        <span class="w-5 text-center text-muted-foreground">{idx + 1}</span>
                        <span class="truncate">{getMemberName(row.memberId)}</span>
                        {#if tiedKeys.has(getTieKey(row))}
                          <Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">TIE</Badge>
                        {/if}
                        {#if row.suddenDeathWins > 0}
                          <Badge variant="outline" class="text-[10px] border-purple-500 text-purple-400">SD {row.suddenDeathWins}</Badge>
                        {/if}
                      </div>
                      <span class="text-center tabular-nums">{row.wins}-{row.ties}-{row.losses}</span>
                      <span class="text-center tabular-nums font-semibold">{row.points}</span>
                      <span class="text-center tabular-nums">{row.ippons}</span>
                    </div>
                  {/each}
                </div>
                <p class="mt-2 text-[10px] text-muted-foreground">Tiebreakers: points → wins → ippons → sudden death.</p>
              </div>
            {/if}

            <div class="space-y-2">
              {#each done as match}
                {@const p1Win = match.winner === match.player1Id}
                {@const isTie = !match.winner}
                {@const events = buildScoreTimeline(match)}
                <div class="rounded bg-muted/50 px-3 py-2 text-xs sm:text-sm">
                  <div class="flex items-center gap-2">
                    <span class={cn('truncate flex-1', p1Win && 'font-semibold text-green-400')}>{getMemberName(match.player1Id)}{p1Win ? ' 🏆' : ''}</span>
                    <span class="text-muted-foreground shrink-0 flex items-center gap-2">
                      {match.player1Score?.length || 0} - {match.player2Score?.length || 0}
                      {#if isTie}<Badge variant="outline" class="text-[10px] border-amber-500 text-amber-400">TIE</Badge>{/if}
                      {#if match.isSuddenDeath}<Badge variant="outline" class="text-[10px] border-purple-500 text-purple-400">SD</Badge>{/if}
                    </span>
                    <span class={cn('truncate flex-1 text-right', !p1Win && match.winner && 'font-semibold text-green-400')}>{!p1Win && match.winner ? '🏆 ' : ''}{getMemberName(match.player2Id)}</span>
                  </div>
                  {#if events.length > 0}
                    <div class="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {#each events as event}
                        <span class="flex items-center gap-1 rounded bg-background/40 px-2 py-1">
                          <Badge variant="outline" class={cn('text-[9px] border-transparent', event.player === 'AKA' ? 'text-red-400' : 'text-slate-300')}>{event.player}</Badge>
                          <span>{SCORE_LABELS[event.type] || `Score ${event.type}`}</span>
                          <span class="font-mono">{event.time !== undefined ? formatTimer(event.time) : '--:--'}</span>
                        </span>
                      {/each}
                    </div>
                  {:else if (match.player1Score?.length || 0) + (match.player2Score?.length || 0) > 0}
                    <div class="mt-2 text-[10px] text-muted-foreground">Score timeline unavailable (missing timestamps).</div>
                  {/if}
                </div>
              {:else}
                <p class="text-sm text-muted-foreground">No completed matches</p>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .text_center { text-align: center; }
</style>

