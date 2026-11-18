<script lang="ts">
  import { Calendar, Info, Mail, MapPin, MessageSquare, Pencil, Phone, StickyNote, User, Video } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { labelFor } from '../lib/categories';
  import { dayOf, formatDate } from '../lib/dates';
  import { fullName, type ContactCard } from '../lib/repo/contacts';
  import Avatar from './Avatar.svelte';
  import IconButton from './IconButton.svelte';

  let { card, onopen }: { card: ContactCard | null; onopen: () => void } = $props();

  const actions = [
    { label: 'Message', icon: MessageSquare },
    { label: 'Call', icon: Phone },
    { label: 'Video', icon: Video },
    { label: 'Email', icon: Mail },
  ];
</script>

<aside class="flex h-full w-80 shrink-0 flex-col gap-3 overflow-y-auto" aria-label="Selected contact">
  {#if card === null}
    <Card.Root class="items-center p-6 text-center" data-testid="contact-panel-empty">
      <User class="size-8 text-muted-foreground" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">No contact to show. Add one to see their details here.</p>
    </Card.Root>
  {:else}
    {@const contact = card.contact}
    <div class="flex flex-col gap-3" data-testid="contact-panel">
      <Card.Root class="relative items-center gap-2 p-4">
        <div class="absolute top-2 right-2"><IconButton label="Edit contact"><Pencil aria-hidden="true" /></IconButton></div>
        <Avatar picture={contact.picture} name={fullName(contact)} size={96} />
        <h2 class="text-lg font-semibold" data-testid="panel-name">{fullName(contact)}</h2>
        <p class="text-sm text-muted-foreground">{contact.email ?? 'No email'}</p>
        <span class="rounded-full bg-accent px-3 py-0.5 text-xs font-medium" data-testid="panel-category">{labelFor(contact.category)}</span>
        <div class="mt-2 grid w-full grid-cols-4 gap-2">
          {#each actions as action (action.label)}
            <Button variant="outline" class="h-14 flex-col gap-1 text-xs"><action.icon aria-hidden="true" />{action.label}</Button>
          {/each}
        </div>
      </Card.Root>

      <Card.Root class="gap-2 p-4">
        <div class="flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-sm font-semibold"><Info class="size-4" aria-hidden="true" />About</h3>
          <IconButton label="Edit About"><Pencil aria-hidden="true" /></IconButton>
        </div>
        <dl class="grid gap-2 text-sm">
          <div class="flex gap-3"><User class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div class="min-w-0"><dt class="text-xs text-muted-foreground">Full name</dt><dd class="truncate">{fullName(contact)}</dd></div></div>
          <div class="flex gap-3"><Mail class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div class="min-w-0"><dt class="text-xs text-muted-foreground">Email</dt><dd class="truncate">{contact.email ?? 'No email'}</dd></div></div>
          <div class="flex gap-3"><Phone class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div class="min-w-0"><dt class="text-xs text-muted-foreground">Phone</dt><dd class="truncate">{contact.phone ?? 'No phone'}</dd></div></div>
          <div class="flex gap-3"><MapPin class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div class="min-w-0"><dt class="text-xs text-muted-foreground">Location</dt><dd class="truncate">{card.location ?? 'No location'}</dd></div></div>
          <div class="flex gap-3"><Calendar class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div class="min-w-0"><dt class="text-xs text-muted-foreground">Joined</dt><dd>{formatDate(dayOf(contact.created_at))}</dd></div></div>
        </dl>
      </Card.Root>

      <Card.Root class="gap-2 p-4">
        <div class="flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-sm font-semibold"><StickyNote class="size-4" aria-hidden="true" />Notes</h3>
          <IconButton label="Edit Notes"><Pencil aria-hidden="true" /></IconButton>
        </div>
        <p class="line-clamp-4 text-sm {card.note ? '' : 'text-muted-foreground italic'}" data-testid="panel-note">{card.note ?? 'No notes yet'}</p>
      </Card.Root>

      <Button data-testid="view-full-profile" onclick={onopen}>View full profile</Button>
    </div>
  {/if}
</aside>
