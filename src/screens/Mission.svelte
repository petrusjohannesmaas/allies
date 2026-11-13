<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { AlignLeft, ArrowDown, ArrowLeft, ArrowUp, CalendarDays, ListChecks, Plus, Trash2, X } from '@lucide/svelte';
  import * as Card from '$lib/components/ui/card';
  import EditableCard from '../components/EditableCard.svelte';
  import FieldLabel from '../components/FieldLabel.svelte';
  import IconButton from '../components/IconButton.svelte';
  import MissionForm from '../components/MissionForm.svelte';
  import { db } from '../lib/db';
  import { goBackFromMission, navigation } from '../lib/navigation.svelte';
  import { fullName, getContact, type Contact } from '../lib/repo/contacts';
  import {
    addTask,
    deleteMission,
    deleteTask,
    listMissions,
    listTasks,
    hasText,
    moveTask,
    renameTask,
    setTaskDone,
    updateMission,
    type Mission,
    type Task,
  } from '../lib/repo/missions';

  let contact = $state<Contact | null>(null);
  let mission = $state<Mission | null>(null);
  let tasks = $state<Task[]>([]);
  let missing = $state(false);
  let failure = $state('');

  let newTask = $state('');
  let confirming = $state(false);

  $effect(() => {
    const contactId = navigation.contactId;
    const missionId = navigation.missionId;
    if (contactId === null || missionId === null) return;
    void load(contactId, missionId);
  });

  async function load(contactId: number, missionId: number) {
    const connection = await db();
    contact = await getContact(connection, contactId);
    mission = (await listMissions(connection, contactId)).find((candidate) => candidate.id === missionId) ?? null;
    tasks = mission ? await listTasks(connection, mission.id) : [];
    missing = mission === null;
  }

  async function reload() {
    if (navigation.contactId !== null && navigation.missionId !== null) await load(navigation.contactId, navigation.missionId);
  }

  async function run(action: () => Promise<void>) {
    failure = '';
    try {
      await action();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<section class="p-6" data-testid="screen-mission">
  {#if missing}
    <p class="text-sm text-muted-foreground" data-testid="mission-missing">That mission is gone.</p>
    <Button variant="outline" class="mt-4" data-testid="back-to-contact" onclick={goBackFromMission}><ArrowLeft aria-hidden="true" />Back</Button>
  {:else if mission && contact}
    <Button variant="outline" class="mb-4" data-testid="back-to-contact" onclick={goBackFromMission}>
      <ArrowLeft aria-hidden="true" />Back to {fullName(contact)}
    </Button>

    {#if failure}<p class="error mb-2" data-testid="mission-failure">{failure}</p>{/if}

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <EditableCard label="mission details" testid="mission-details">
        {#snippet view()}
          <dl class="grid gap-4 pr-12">
            <div>
              <FieldLabel icon={AlignLeft}>Description</FieldLabel>
              <dd><h1 class="text-xl font-semibold" data-testid="mission-title">{mission?.description}</h1></dd>
            </div>
            <div>
              <FieldLabel icon={CalendarDays}>Due date</FieldLabel>
              <dd>
                <p class="text-sm {mission?.due_date ? 'text-foreground' : 'italic text-muted-foreground'}" data-testid="mission-due">
                  {#if mission?.due_date}Due {mission.due_date}{:else}No due date{/if}
                </p>
              </dd>
            </div>
          </dl>
        {/snippet}

        {#snippet edit(close)}
          {#if mission}
            {@const missionId = mission.id}
            <MissionForm
              {mission}
              oncancel={close}
              onsave={(description, due) => {
                return run(async () => {
                  await updateMission(await db(), missionId, description, due);
                  await reload();
                  close();
                });
              }}
            />
          {/if}
        {/snippet}
      </EditableCard>

      <EditableCard label="tasks" title="Tasks" icon={ListChecks} testid="mission-tasks">
        {#snippet view()}
          {@render list(false)}
        {/snippet}

        {#snippet edit()}
          <form
            class="mt-3 flex gap-2"
            data-testid="task-form"
            onsubmit={(event) => {
              event.preventDefault();
              if (!mission || !hasText(newTask)) return;
              const id = mission.id;
              void run(async () => {
                await addTask(await db(), id, newTask);
                newTask = '';
                await reload();
              });
            }}
          >
            <Input data-testid="task-description" placeholder="What needs doing" autocomplete="off" bind:value={newTask} />
            <Button type="submit" data-testid="add-task"><Plus aria-hidden="true" />Add task</Button>
          </form>

          {@render list(true)}
        {/snippet}
      </EditableCard>
    </div>

    <div class="mt-6">
      {#if confirming}
        <Card.Root class="px-4" data-testid="delete-mission-confirm">
          <p class="text-sm" data-testid="delete-mission-warning">
            Delete this mission? This also deletes {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}.
          </p>
          <div class="mt-2 flex gap-2">
            <Button
              variant="destructive"
              data-testid="confirm-delete-mission"
              onclick={() =>
                run(async () => {
                  if (!mission) return;
                  await deleteMission(await db(), mission.id);
                  goBackFromMission();
                })}
            >
              <Trash2 aria-hidden="true" />Delete mission
            </Button>
            <Button variant="outline" data-testid="cancel-delete-mission" onclick={() => (confirming = false)}><X aria-hidden="true" />Keep it</Button>
          </div>
        </Card.Root>
      {:else}
        <Button variant="destructive" data-testid="delete-mission" onclick={() => (confirming = true)}><Trash2 aria-hidden="true" />Delete mission</Button>
      {/if}
    </div>
  {/if}
</section>

{#snippet list(editing: boolean)}
  {#if tasks.length === 0}
    <p class="mt-3 text-sm text-muted-foreground" data-testid="tasks-empty">No tasks yet.</p>
  {:else}
    <ol class="mt-3 grid gap-2" data-testid="task-list">
      {#each tasks as task, index (task.id)}
        <li class="flex items-center gap-2" data-testid="task" data-task-text={task.description}>
          <input
            type="checkbox"
            data-testid="task-done"
            aria-label={`Done: ${task.description}`}
            checked={task.is_done === 1}
            onchange={(event) => {
              // currentTarget is gone once the handler returns, so read it first.
              const done = event.currentTarget.checked;
              void run(async () => {
                await setTaskDone(await db(), task.id, done);
                await reload();
              });
            }}
          />
          {#if editing}
            <Input class={['flex-1', task.is_done === 1 && 'line-through']} data-testid="task-rename" aria-label="Task description" value={task.description} onchange={(event) => run(async () => { const text = event.currentTarget.value; if (!hasText(text)) return; await renameTask(await db(), task.id, text); await reload(); })} />
            <IconButton
              variant="outline"
              label="Move up"
              data-testid="move-task-up"
              disabled={index === 0}
              onclick={() => run(async () => { await moveTask(await db(), task.id, 'up'); await reload(); })}
            >
              <ArrowUp aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="outline"
              label="Move down"
              data-testid="move-task-down"
              disabled={index === tasks.length - 1}
              onclick={() => run(async () => { await moveTask(await db(), task.id, 'down'); await reload(); })}
            >
              <ArrowDown aria-hidden="true" />
            </IconButton>
            <IconButton
              class="text-destructive hover:text-destructive"
              label="Delete task"
              data-testid="delete-task"
              onclick={() => run(async () => { await deleteTask(await db(), task.id); await reload(); })}
            >
              <Trash2 aria-hidden="true" />
            </IconButton>
          {:else}
            <span class="text-sm" class:line-through={task.is_done === 1} class:text-muted-foreground={task.is_done === 1} data-testid="task-text">
              {task.description}
            </span>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}
