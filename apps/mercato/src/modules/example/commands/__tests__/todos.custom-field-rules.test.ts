// CC-153 — the command enforces the rules ce.ts declares, not just the CRUD
// form's blur check. Found by the first green integration run with the example
// module on: `POST /api/example/todos` with `cf_priority: 8` returned 201 while
// the same declaration made the form show "Priority must be <= 5" on blur.
jest.mock('@open-mercato/core/generated/entities.ids.generated', () => ({
  E: { example: { todo: 'example:todo' } },
}), { virtual: true })
jest.mock('@/.mercato/generated/entities.ids.generated', () => ({
  E: { example: { todo: 'example:todo' } },
}), { virtual: true })
jest.mock('@open-mercato/shared/lib/i18n/server', () => ({
  resolveTranslations: async () => ({
    translate: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))

import '../todos'
import { commandRegistry } from '@open-mercato/shared/lib/commands/registry'
import type { CommandHandler, CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import type { DataEngine } from '@open-mercato/shared/lib/data/engine'
import type { EntityManager } from '@mikro-orm/postgresql'
import type { Todo } from '../../data/entities'

const TODO_ID = '11111111-1111-4111-8111-111111111111'
const TENANT_ID = '33333333-3333-4333-8333-333333333333'
const ORG_ID = '22222222-2222-4222-8222-222222222222'

function getCommand(id: string): CommandHandler<Record<string, unknown>, Todo> {
  const handler = commandRegistry.get(id)
  if (!handler) throw new Error(`Command ${id} not registered`)
  return handler as CommandHandler<Record<string, unknown>, Todo>
}

function createCtx() {
  const todo = {
    id: TODO_ID,
    title: 'Todo',
    isDone: false,
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    deletedAt: null,
    createdAt: new Date('2026-10-21T09:00:00.000Z'),
    updatedAt: new Date('2026-10-21T09:00:00.000Z'),
  } as Todo

  const createOrmEntity = jest.fn(async () => todo)
  const setCustomFields = jest.fn(async (_opts: Parameters<DataEngine['setCustomFields']>[0]) => undefined)
  const markOrmEntityChange = jest.fn((_entry: Parameters<DataEngine['markOrmEntityChange']>[0]) => undefined)
  const dataEngine = {
    createOrmEntity,
    setCustomFields,
    markOrmEntityChange,
  } as unknown as Pick<DataEngine, 'createOrmEntity' | 'setCustomFields' | 'markOrmEntityChange'>

  const nativeUpdate = jest.fn(async () => 1)
  const findOne = jest.fn(async () => todo)
  const em = {
    fork: jest.fn(() => ({ nativeUpdate, findOne })),
  } as unknown as EntityManager

  const container = {
    resolve: (token: string) => {
      if (token === 'em') return em
      if (token === 'dataEngine') return dataEngine
      throw new Error(`Unexpected dependency: ${token}`)
    },
  }

  const ctx: CommandRuntimeContext = {
    container: container as never,
    auth: { tenantId: TENANT_ID, orgId: ORG_ID, sub: '44444444-4444-4444-8444-444444444444' } as never,
    organizationScope: null,
    selectedOrganizationId: ORG_ID,
    organizationIds: [ORG_ID],
    request: undefined as never,
  }

  return { ctx, createOrmEntity, nativeUpdate, setCustomFields }
}

const EXPECTED_REJECTION = {
  status: 400,
  body: {
    error: 'Validation failed',
    fields: { cf_priority: 'Priority must be <= 5' },
  },
}

describe('example todos custom-field rules (CC-153)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects a create whose priority breaks the declared lte rule', async () => {
    const { ctx, createOrmEntity } = createCtx()
    const handler = getCommand('example.todos.create')

    await expect(
      handler.execute(
        { title: 'QA invalid priority', cf_priority: 8, cf_severity: 'high' },
        ctx,
      ),
    ).rejects.toMatchObject(EXPECTED_REJECTION)

    // The refusal happens before anything is written.
    expect(createOrmEntity).not.toHaveBeenCalled()
  })

  it('accepts a create inside the declared range', async () => {
    const { ctx, createOrmEntity } = createCtx()
    const handler = getCommand('example.todos.create')

    await handler.execute(
      { title: 'QA valid priority', cf_priority: 5, cf_severity: 'medium' },
      ctx,
    )

    expect(createOrmEntity).toHaveBeenCalledTimes(1)
  })

  it('accepts a create with no custom fields at all (the sync bridge shape)', async () => {
    // example_customers_sync creates todos through this command without the
    // optional fields; server-side `required` stays a form-level rule.
    const { ctx, createOrmEntity } = createCtx()
    const handler = getCommand('example.todos.create')

    await handler.execute({ title: 'Bridge-created todo', is_done: false }, ctx)

    expect(createOrmEntity).toHaveBeenCalledTimes(1)
  })

  it('rejects an update whose priority breaks the declared lte rule', async () => {
    const { ctx, nativeUpdate } = createCtx()
    const handler = getCommand('example.todos.update')

    await expect(
      handler.execute({ id: TODO_ID, cf_priority: 8 }, ctx),
    ).rejects.toMatchObject(EXPECTED_REJECTION)

    expect(nativeUpdate).not.toHaveBeenCalled()
  })

  it('accepts an update inside the declared range', async () => {
    const { ctx, nativeUpdate, setCustomFields } = createCtx()
    const handler = getCommand('example.todos.update')

    await handler.execute({ id: TODO_ID, title: 'Updated title', cf_priority: 4 }, ctx)

    expect(nativeUpdate).toHaveBeenCalledTimes(1)
    expect(setCustomFields).toHaveBeenCalledWith(
      expect.objectContaining({ values: { priority: 4 } }),
    )
  })
})
