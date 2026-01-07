<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { slide } from 'svelte/transition';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { cn } from '$lib/utils';
  import { ChevronRight, FolderOpen, Pencil, Trash2, UserPlus, Users } from '@lucide/svelte';

  export let groups: any[] = [];
  export let membersByGroupId: Map<string, any[]> = new Map();
  export let expandedGroupId: string | null = null;
  export let onExpand: (id: string | null) => void;
  export let onOpenAddGroup: () => void;
  export let onEditGroup: (group: any) => void;
  export let onDeleteGroup: (id: string) => void;
  export let onAddMemberToGroup: (groupId: string) => void;
  export let onDeleteMember: (id: string) => void;

  let listEl: HTMLElement;
  $: listEl && autoAnimate(listEl);

  onMount(() => {
    console.debug('[admin] GroupsTab mounted', {
      groupsCount: groups.length,
      expandedGroupId,
      membersByGroupIdSize: membersByGroupId.size,
    });
  });
</script>

<!-- Top Bar - Design 2 -->
<div class="top-bar sticky top-0 z-10 -mx-4 sm:-mx-6 px-5 py-4 mb-5" style="background: var(--surface); border-bottom: 1px solid var(--border-subtle);">
  <div class="flex items-center justify-between">
    <div>
      <div class="text-[0.6rem] uppercase tracking-widest mb-1" style="color: var(--text-faint);">Admin / Roster</div>
      <h1 class="font-jp text-lg font-bold" style="color: var(--text-primary);">Group Management</h1>
    </div>
    <div class="flex items-center gap-6">
      <div class="text-center">
        <div class="text-xl font-bold" style="color: var(--text-primary);">{groups.length}</div>
        <div class="text-[0.55rem] uppercase" style="color: var(--text-muted);">Groups</div>
      </div>
      <div class="w-px h-8" style="background: var(--border-subtle);"></div>
      <div class="text-center">
        <div class="text-xl font-bold" style="color: var(--indigo-light);">{groups.filter(g => g.type === 'bogu').length}</div>
        <div class="text-[0.55rem] uppercase" style="color: var(--text-muted);">Bogu</div>
      </div>
      <div class="w-px h-8" style="background: var(--border-subtle);"></div>
      <div class="text-center">
        <div class="text-xl font-bold" style="color: var(--accent-fire);">{groups.filter(g => g.type === 'hantei').length}</div>
        <div class="text-[0.55rem] uppercase" style="color: var(--text-muted);">Hantei</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <Button onclick={onOpenAddGroup} variant="outline" size="sm" class="btn-sm primary">
        + Add Group
      </Button>
    </div>
  </div>
</div>

<div class="flex flex-col gap-3" bind:this={listEl}>
  {#each groups as group (group._id)}
    {@const groupMembers = membersByGroupId.get(group.groupId) ?? []}
    {@const isExpanded = expandedGroupId === group._id}
    <div class={cn("rounded-2xl border-2 overflow-hidden transition-all duration-200", isExpanded ? "border-primary bg-card" : "border-border bg-card/50")}>
      <div
        role="button"
        tabindex="0"
        onclick={() => onExpand(isExpanded ? null : group._id)}
        onkeydown={(e) => e.key === 'Enter' && onExpand(isExpanded ? null : group._id)}
        class="w-full p-5 flex items-center gap-4 text-left hover:bg-accent/50 transition-colors min-h-[72px] cursor-pointer"
      >
        <div class={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200", isExpanded ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          <ChevronRight class={cn("h-5 w-5 transition-transform duration-200", isExpanded && "rotate-90")} />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg font-semibold truncate">{group.name}</span>
            {#if group.isHantei}
              <Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 shrink-0">HANTEI</Badge>
            {/if}
          </div>
          <div class="text-sm text-muted-foreground">{groupMembers.length} members · {group.groupId}</div>
        </div>

        <div class="flex gap-2 shrink-0" role="group">
          <button
            onclick={(e) => { e.stopPropagation(); onEditGroup({ ...group }); }}
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            onclick={(e) => { e.stopPropagation(); onDeleteGroup(group._id); }}
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      {#if isExpanded}
        <div class="px-5 pb-5 border-t border-border" transition:slide={{ duration: 200 }}>
          <div class="pt-4">
            <div class="flex justify-between items-center mb-3">
              <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members</span>
              <Button onclick={() => onAddMemberToGroup(group.groupId)} variant="ghost" size="sm" class="h-8 px-3 text-xs">
                <UserPlus class="mr-1.5 h-3.5 w-3.5" /> Add Member
              </Button>
            </div>

            {#if groupMembers.length > 0}
              <div class="flex flex-col gap-2">
                {#each groupMembers as member (member._id)}
                  <div class="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {member.lastName?.charAt(0) || '?'}
                    </div>
                    <span class="flex-1 text-sm font-medium truncate">{member.lastName}, {member.firstName}</span>
                    <button
                      onclick={() => onDeleteMember(member._id)}
                      class="px-3 py-1.5 text-xs rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-muted-foreground text-sm">
                <Users class="h-8 w-8 mx-auto mb-2 opacity-50" />
                No members in this group
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <Card.Root class="border-dashed">
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FolderOpen class="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p class="mb-4 text-muted-foreground">No groups yet</p>
        <Button onclick={onOpenAddGroup}>Create Your First Group</Button>
      </Card.Content>
    </Card.Root>
  {/each}
</div>
