<script lang="ts">
  let { contactId }: { contactId: number | null } = $props();
</script>

<section class="p-6" data-testid="screen-contact">
  <h1 class="text-xl font-semibold">Contact</h1>
  <p class="mt-2 text-sm text-muted">Everything you know about this person.</p>
  {#if contactId !== null}
    <p class="mt-2 text-sm text-muted" data-testid="contact-id">Contact {contactId}</p>
  {/if}
</section>