<script lang="ts">
  import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    LayoutGrid,
    List,
    MoreHorizontal,
    Plus,
    Star,
    Upload,
    Users,
    UserPlus,
  } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { formatTimeSince } from '../lib/dates';
  import { homeView, ROW_HEIGHT } from '../lib/home.svelte';
  import { fullName, type Contact } from '../lib/repo/contacts';
  import Avatar from './Avatar.svelte';
  import IconButton from './IconButton.svelte';

  let {
    contacts,
    selectedId,
    now,
    page,
    onselect,
    onadd,
    onpage,
  }: {
    contacts: Contact[];
    selectedId: number | null;
    now: Date;
    page: number | null;
    onselect: (id: number) => void;
    onadd: () => void;
    onpage: (page: number | null) => void;
  } = $props();

  // The list measures itself, so a page holds as many rows as fit. A height of
  // 0 means the list is not laid out yet, so every row shows until it is. Home
  // owns the page the arrows asked for, and null means the page that holds the
  // panel's contact. A new height asks for that page again.
  let measuredHeight = $state(0);

  const view = $derived(homeView(contacts, selectedId, { listHeight: measuredHeight || Infinity, page }));

  function measured(height: number) {
    if (measuredHeight !== 0 && height !== measuredHeight) onpage(null);
    measuredHeight = height;
  }

  const chips = [
    { label: 'All', icon: Users },
    { label: 'Recent', icon: Clock },
    { label: 'Favourites', icon: Star },
    { label: 'Groups', icon: Users },
  ];
</script>

<section class="flex min-h-0 min-w-0 flex-1 flex-col" data-testid="contacts-column">
  {#if contacts.length === 0}
    <div class="flex flex-1 flex-col items-start gap-3" data-testid="contacts-empty">
      <p class="text-sm text-muted-foreground">No contacts yet. Add the first one.</p>
      <Button data-testid="add-contact" onclick={onadd}><Plus aria-hidden="true" />Add contact</Button>
    </div>
  {:else}
    <div class="mb-3 flex items-center gap-2">
      {#each chips as chip, index (chip.label)}
        <Button variant={index === 0 ? 'secondary' : 'ghost'} aria-pressed={index === 0}>
          <chip.icon aria-hidden="true" />{chip.label}
        </Button>
      {/each}
      <div class="ml-auto flex items-center gap-1">
        <IconButton label="List view" variant="secondary"><List aria-hidden="true" /></IconButton>
        <IconButton label="Grid view"><LayoutGrid aria-hidden="true" /></IconButton>
      </div>
    </div>

    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-base font-semibold">All contacts ({contacts.length})</h2>
      <Button variant="outline" size="sm">Sort: Recent<ChevronDown aria-hidden="true" /></Button>
    </div>

    <ul class="min-h-0 flex-1 overflow-hidden" data-testid="contacts-list" bind:clientHeight={null, measured}>
      {#each view.rows as contact (contact.id)}
        {@const selected = contact.id === selectedId}
        <!-- The row's own button gives the keyboard a way in. The row also takes the click, so the whole width selects. -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <li
          class="border-border flex cursor-pointer items-center gap-3 rounded-lg border px-3 transition-colors hover:bg-accent {selected
            ? 'bg-accent border-primary'
            : 'border-transparent'}"
          style:height="{ROW_HEIGHT}px"
          data-testid="contact-row"
          data-contact-name={fullName(contact)}
          aria-current={selected ? 'true' : undefined}
          onclick={() => onselect(contact.id)}
        >
          <button type="button" class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left" onclick={() => onselect(contact.id)}>
            <Avatar picture={contact.picture} name={fullName(contact)} size={40} />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{fullName(contact)}</span>
              <span class="block truncate text-xs text-muted-foreground" data-testid="contact-row-email">{contact.email ?? ''}</span>
            </span>
            <span class="shrink-0 text-xs text-muted-foreground" data-testid="contact-row-time">{formatTimeSince(contact.last_viewed_at, now)}</span>
          </button>
          {#if selected}
            <IconButton label="More actions" data-testid="contact-row-menu"><MoreHorizontal aria-hidden="true" /></IconButton>
          {:else}
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" data-testid="contact-row-chevron" />
          {/if}
        </li>
      {/each}
    </ul>

    <div class="mt-3 flex items-center gap-2">
      <span class="text-sm text-muted-foreground" data-testid="contact-count">{contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}</span>
      <Button variant="outline" data-testid="add-contact" onclick={onadd}><UserPlus aria-hidden="true" />Add contact</Button>
      <Button variant="outline"><Download aria-hidden="true" />Import</Button>
      <Button variant="outline"><Upload aria-hidden="true" />Export</Button>
      <div class="ml-auto flex items-center gap-1">
        <IconButton label="Previous page" disabled={view.page <= 1} onclick={() => onpage(view.page - 1)}><ChevronLeft aria-hidden="true" /></IconButton>
        <span class="px-2 text-sm" data-testid="pager">{view.page} / {view.pages}</span>
        <IconButton label="Next page" disabled={view.page >= view.pages} onclick={() => onpage(view.page + 1)}><ChevronRight aria-hidden="true" /></IconButton>
      </div>
    </div>
  {/if}
</section>
