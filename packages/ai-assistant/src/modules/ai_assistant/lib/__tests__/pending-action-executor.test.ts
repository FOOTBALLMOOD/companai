import { z } from 'zod'
import type { AwilixContainer } from 'awilix'
import {
  executePendingActionConfirm,
  PENDING_ACTION_CONFIRMED_EVENT_ID,
} from '../pending-action-executor'
import type { AiActionConfirmedPayload } from '../../events'
import type { AiAgentDefinition } from '../ai-agent-definition'
import type { AiToolDefinition } from '../types'
import type { AiPendingAction } from '../../data/entities'

function makeAction(overrides: Partial<AiPendingAction> = {}): AiPendingAction {
  return {
    id: 'pa_1',
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    agentId: 'catalog.merchandising_assistant',
    toolName: 'catalog.update_product',
    status: 'pending',
    fieldDiff: [],
    records: null,
    failedRecords: null,
    sideEffectsSummary: null,
    recordVersion: 'v-1',
    attachmentIds: [],
    normalizedInput: { productId: 'p-1', patch: { title: 'New' } },
    queueMode: 'inline',
    executionResult: null,
    targetEntityType: 'product',
    targetRecordId: 'p-1',
    conversationId: null,
    idempotencyKey: 'idem_1',
    createdByUserId: 'user-1',
    createdAt: new Date('2026-04-18T10:00:00.000Z'),
    expiresAt: new Date('2026-04-18T11:00:00.000Z'),
    resolvedAt: null,
    resolvedByUserId: null,
    ...overrides,
  } as unknown as AiPendingAction
}

function makeAgent(): AiAgentDefinition {
  return {
    id: 'catalog.merchandising_assistant',
    moduleId: 'catalog',
    label: 'Catalog Agent',
    description: '...',
    systemPrompt: '...',
    allowedTools: ['catalog.update_product'],
    readOnly: false,
    mutationPolicy: 'confirm-required',
  }
}

function makeTool(overrides: Partial<AiToolDefinition> = {}): AiToolDefinition {
  return {
    name: 'catalog.update_product',
    description: 'Update product',
    inputSchema: z.object({ productId: z.string(), patch: z.object({}).passthrough() }),
    handler: async () => ({ recordId: 'p-1', commandName: 'catalog.product.update' }),
    isMutation: true,
    ...overrides,
  } as AiToolDefinition
}

function makeRepoStub(initialRow: AiPendingAction) {
  let row = { ...initialRow } as AiPendingAction & Record<string, unknown>
  const setStatus = jest.fn(
    async (_id: string, nextStatus: string, _scope: unknown, extra?: Record<string, unknown>) => {
      row = {
        ...row,
        status: nextStatus as never,
      }
      if (extra && 'executionResult' in extra) {
        row.executionResult = (extra.executionResult ?? null) as never
      }
      if (extra && 'failedRecords' in extra) {
        row.failedRecords = (extra.failedRecords ?? null) as never
      }
      if (extra && 'resolvedByUserId' in extra) {
        row.resolvedByUserId = extra.resolvedByUserId as never
      }
      if (nextStatus !== 'executing') {
        row.resolvedAt = ((extra?.now as Date | undefined) ?? new Date()) as never
      }
      return row as AiPendingAction
    },
  )
  return {
    setStatus,
    get current() {
      return row
    },
  }
}

function makeCtx() {
  return {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    userId: 'user-1',
    userFeatures: ['ai_assistant.view'],
    isSuperAdmin: false,
    container: {
      resolve: (name: string) => {
        if (name === 'em') return {}
        if (name === 'eventBus') return { emitEvent: async () => {} }
        throw new Error(`unknown dep ${name}`)
      },
    } as unknown as AwilixContainer,
  }
}

describe('executePendingActionConfirm', () => {
  it('transitions pending → confirmed → executing → confirmed on handler success and emits typed ai.action.confirmed', async () => {
    const repo = makeRepoStub(makeAction())
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: makeTool(),
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
    })
    expect(result.ok).toBe(true)
    expect(repo.setStatus).toHaveBeenCalledTimes(3)
    expect(repo.setStatus.mock.calls.map((call) => call[1])).toEqual([
      'confirmed',
      'executing',
      'confirmed',
    ])
    expect(result.executionResult).toEqual({
      recordId: 'p-1',
      commandName: 'catalog.product.update',
    })
    expect(emitEvent).toHaveBeenCalledTimes(1)
    const [emittedId, emittedPayload] = emitEvent.mock.calls[0] as [
      'ai.action.confirmed',
      AiActionConfirmedPayload,
    ]
    expect(emittedId).toBe(PENDING_ACTION_CONFIRMED_EVENT_ID)
    expect(emittedPayload).toMatchObject({
      pendingActionId: 'pa_1',
      agentId: 'catalog.merchandising_assistant',
      toolName: 'catalog.update_product',
      status: 'confirmed',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      userId: 'user-1',
      resolvedByUserId: 'user-1',
      executionResult: {
        recordId: 'p-1',
        commandName: 'catalog.product.update',
      },
    })
    expect(typeof emittedPayload.resolvedAt).toBe('string')
  })

  it('transitions pending → confirmed → executing → failed on handler throw and emits typed failure payload', async () => {
    const repo = makeRepoStub(makeAction())
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const throwingTool = makeTool({
      handler: async () => {
        throw new Error('db constraint')
      },
    })
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: throwingTool,
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
    })
    expect(result.ok).toBe(false)
    expect(repo.setStatus.mock.calls.map((call) => call[1])).toEqual([
      'confirmed',
      'executing',
      'failed',
    ])
    expect(result.executionResult.error).toMatchObject({ code: 'handler_error', message: 'db constraint' })
    expect(emitEvent).toHaveBeenCalledTimes(1)
    const [emittedId, emittedPayload] = emitEvent.mock.calls[0] as [
      'ai.action.confirmed',
      AiActionConfirmedPayload,
    ]
    expect(emittedId).toBe(PENDING_ACTION_CONFIRMED_EVENT_ID)
    expect(emittedPayload.status).toBe('failed')
    expect(emittedPayload.executionResult).toMatchObject({
      error: { code: 'handler_error', message: 'db constraint' },
    })
  })

  it('idempotent: calling twice on already-confirmed row returns prior result without re-executing', async () => {
    const priorResult = { recordId: 'p-1', commandName: 'catalog.product.update' }
    const repo = makeRepoStub(
      makeAction({
        status: 'confirmed' as never,
        executionResult: priorResult as never,
      }),
    )
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const handlerSpy = jest.fn(async () => ({ recordId: 'p-2' }))
    const result = await executePendingActionConfirm({
      action: makeAction({
        status: 'confirmed' as never,
        executionResult: priorResult as never,
      }),
      agent: makeAgent(),
      tool: makeTool({ handler: handlerSpy }),
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
    })
    expect(result.ok).toBe(true)
    expect(result.executionResult).toEqual(priorResult)
    expect(handlerSpy).not.toHaveBeenCalled()
    expect(repo.setStatus).not.toHaveBeenCalled()
    expect(emitEvent).not.toHaveBeenCalled()
  })

  it('carries partial-stale failedRecords[] onto the confirmed row', async () => {
    const repo = makeRepoStub(makeAction())
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const failed = [
      { recordId: 'r-2', error: { code: 'stale_version', message: 'x' } },
    ]
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: makeTool(),
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
      failedRecords: failed,
    })
    expect(result.ok).toBe(true)
    const firstCallExtra = repo.setStatus.mock.calls[0][3]
    expect(firstCallExtra).toMatchObject({ failedRecords: failed })
  })

  it('Step 5.18 — batch handler returns per-record failures: merged into row.failedRecords[]', async () => {
    const repo = makeRepoStub(makeAction({ toolName: 'catalog.bulk_update_products' }))
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const batchTool = makeTool({
      name: 'catalog.bulk_update_products',
      handler: async () => ({
        commandName: 'catalog.products.update',
        records: [
          { recordId: 'p-1', status: 'updated', before: { title: 'A' }, after: { title: 'A*' } },
          { recordId: 'p-2', status: 'updated', before: { title: 'B' }, after: { title: 'B*' } },
          {
            recordId: 'p-3',
            status: 'failed',
            before: { title: 'C' },
            after: null,
            error: { code: 'command_failed', message: 'db constraint' },
          },
        ],
        failedRecordIds: ['p-3'],
      }),
    })
    const result = await executePendingActionConfirm({
      action: makeAction({ toolName: 'catalog.bulk_update_products' }),
      agent: makeAgent(),
      tool: batchTool,
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
    })
    expect(result.ok).toBe(true)
    expect(repo.setStatus.mock.calls.map((call) => call[1])).toEqual([
      'confirmed',
      'executing',
      'confirmed',
    ])
    const finalExtra = repo.setStatus.mock.calls[2][3] as Record<string, unknown>
    expect(finalExtra.failedRecords).toEqual([
      { recordId: 'p-3', error: { code: 'command_failed', message: 'db constraint' } },
    ])
    expect(repo.current.failedRecords).toEqual([
      { recordId: 'p-3', error: { code: 'command_failed', message: 'db constraint' } },
    ])
    expect(emitEvent).toHaveBeenCalledTimes(1)
    const [, emittedPayload] = emitEvent.mock.calls[0] as [
      'ai.action.confirmed',
      AiActionConfirmedPayload,
    ]
    expect(emittedPayload.failedRecords).toEqual([
      { recordId: 'p-3', error: { code: 'command_failed', message: 'db constraint' } },
    ])
  })

  it('Step 5.18 — partial-stale + handler failure merged into one failedRecords[] list', async () => {
    const repo = makeRepoStub(makeAction({ toolName: 'catalog.bulk_update_products' }))
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const stale = [
      { recordId: 'p-2', error: { code: 'stale_version', message: 'x' } },
    ]
    const batchTool = makeTool({
      name: 'catalog.bulk_update_products',
      handler: async () => ({
        commandName: 'catalog.products.update',
        records: [
          { recordId: 'p-1', status: 'updated', before: { title: 'A' }, after: { title: 'A*' } },
          {
            recordId: 'p-3',
            status: 'failed',
            before: { title: 'C' },
            after: null,
            error: { code: 'command_failed', message: 'db constraint' },
          },
        ],
        failedRecordIds: ['p-3'],
      }),
    })
    const result = await executePendingActionConfirm({
      action: makeAction({ toolName: 'catalog.bulk_update_products' }),
      agent: makeAgent(),
      tool: batchTool,
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
      failedRecords: stale,
    })
    expect(result.ok).toBe(true)
    const finalExtra = repo.setStatus.mock.calls[2][3] as Record<string, unknown>
    const merged = finalExtra.failedRecords as Array<{ recordId: string }>
    expect(merged.map((entry) => entry.recordId).sort()).toEqual(['p-2', 'p-3'])
  })

  it('Step 5.18 — single-record success: row.failedRecords remains null', async () => {
    const repo = makeRepoStub(makeAction())
    const emitEvent = jest.fn().mockResolvedValue(undefined)
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: makeTool(),
      ctx: makeCtx(),
      repo: repo as unknown as never,
      emitEvent,
    })
    expect(result.ok).toBe(true)
    const finalExtra = repo.setStatus.mock.calls[2][3] as Record<string, unknown>
    expect(finalExtra.failedRecords).toBeNull()
  })
})

/**
 * **S-02 on the confirm path.**
 *
 * A confirmed pending action runs a tool handler — so it is a tool door, and the
 * authority resolver must see it. Before S-02 this path executed with the RBAC
 * check alone (`runPendingActionRechecks` verifies status, expiry, features,
 * policy and drift but never consults the resolver), making it the last handler
 * path the single decider did not see.
 *
 * These tests exist because the other tests in this file use a tool with **no**
 * `requiredFeatures`, so they never reach the authority check — the fixture had
 * to grow a feature-bearing tool for the new code to be exercised at all.
 */
describe('executePendingActionConfirm — S-02 authority gate', () => {
  const FEATURE = 'catalog.products.manage'

  function gatedTool(handler?: () => Promise<unknown>) {
    return makeTool({
      requiredFeatures: [FEATURE],
      ...(handler ? { handler } : {}),
    } as Partial<AiToolDefinition>)
  }

  function authorityCtx(
    mode: 'off' | 'shadow' | 'enforce',
    decide: () => unknown,
    onBehalfOfUserId?: string | null,
  ) {
    const calls: Array<{ subject: string; feature: string; options?: { onBehalfOfUserId?: string | null } }> = []
    const ctx = {
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      userId: 'apikey:key-id',
      userFeatures: [FEATURE],
      isSuperAdmin: false,
      ...(onBehalfOfUserId !== undefined ? { onBehalfOfUserId } : {}),
      container: {
        resolve: (name: string) => {
          if (name === 'em') return {}
          if (name === 'eventBus') return { emitEvent: async () => {} }
          if (name === 'authorityEnforcement') {
            return {
              modeFor: async () => mode,
              decideFor: async (
                subject: string,
                feature: string,
                _scope: unknown,
                options?: { onBehalfOfUserId?: string | null },
              ) => {
                calls.push({ subject, feature, options })
                return decide()
              },
            }
          }
          throw new Error(`unknown dep ${name}`)
        },
      },
    } as unknown as ReturnType<typeof makeCtx>
    return { ctx, calls }
  }

  const A0 = {
    gate: 'A0',
    allowed: false,
    reasons: [{ rule: 'grant', ceiling: 'A0', detail: 'the actor does not hold it' }],
    bindingRule: 'grant',
    obligations: [],
    alternatives: [],
  }
  const A5 = {
    gate: 'A5',
    allowed: true,
    reasons: [],
    bindingRule: 'grant',
    obligations: [],
    alternatives: [],
  }

  it('refuses to run the handler when the resolver returns A0 in enforce mode', async () => {
    const handler = jest.fn(async () => ({ recordId: 'p-1' }))
    const repo = makeRepoStub(makeAction())
    const { ctx } = authorityCtx('enforce', () => A0)
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: gatedTool(handler),
      ctx,
      repo: repo as unknown as never,
      emitEvent: jest.fn().mockResolvedValue(undefined),
    })
    expect(handler).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
    expect(repo.current.status).toBe('failed')
    expect((result.executionResult.error as { code: string } | undefined)?.code).toBe('authority_refused')
  })

  it('runs the handler when the resolver permits at A5 in enforce mode', async () => {
    const handler = jest.fn(async () => ({ recordId: 'p-1', commandName: 'catalog.product.update' }))
    const { ctx } = authorityCtx('enforce', () => A5)
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: gatedTool(handler),
      ctx,
      repo: makeRepoStub(makeAction()) as unknown as never,
      emitEvent: jest.fn().mockResolvedValue(undefined),
    })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
  })

  it('runs the handler in shadow mode even at A0', async () => {
    const handler = jest.fn(async () => ({ recordId: 'p-1', commandName: 'catalog.product.update' }))
    const { ctx } = authorityCtx('shadow', () => A0)
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: gatedTool(handler),
      ctx,
      repo: makeRepoStub(makeAction()) as unknown as never,
      emitEvent: jest.fn().mockResolvedValue(undefined),
    })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
  })

  it('carries the responsible user into the resolver', async () => {
    const { ctx, calls } = authorityCtx('enforce', () => A5, 'human-owner-id')
    await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: gatedTool(),
      ctx,
      repo: makeRepoStub(makeAction()) as unknown as never,
      emitEvent: jest.fn().mockResolvedValue(undefined),
    })
    expect(calls[0]?.options?.onBehalfOfUserId).toBe('human-owner-id')
    expect(calls[0]?.feature).toBe(FEATURE)
  })


})

// T-16 — this test used to be called "fails closed when the resolver is
// unreachable", but its container throws on RESOLVE, which is the NOT-REGISTERED
// state. The same conflation that hid the contradiction between the tool door and
// the command gate. Split into the two states they actually are.

describe('T-16 — a missing authority dependency on the confirm path', () => {
  const FEATURE = 'customers.people.manage'
  const gatedTool = (handler?: () => Promise<unknown>) =>
    makeTool({ requiredFeatures: [FEATURE], ...(handler ? { handler } : {}) } as Partial<AiToolDefinition>)
  it('permits when the authority module is NOT REGISTERED', async () => {
    // `makeCtx()`'s container throws for `authorityEnforcement`. The deployment
    // chose not to gate, so the act proceeds.
    const handler = jest.fn(async () => ({ recordId: 'p-1' }))
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: gatedTool(handler),
      ctx: makeCtx(),
      repo: makeRepoStub(makeAction()) as unknown as never,
      emitEvent: jest.fn().mockResolvedValue(undefined),
    })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
  })

  it('refuses when the authority module is REGISTERED BUT UNREACHABLE', async () => {
    // It resolves, and then the mode lookup fails: the deployment meant to gate
    // and cannot reach the gate.
    const handler = jest.fn(async () => ({ recordId: 'p-1' }))
    const ctx = {
      ...makeCtx(),
      container: {
        resolve: (name: string) => {
          if (name === 'em') return {}
          if (name === 'eventBus') return { emitEvent: async () => {} }
          if (name === 'authorityEnforcement') {
            return {
              modeFor: async () => {
                throw new Error('resolver unreachable')
              },
              decideFor: async () => null,
            }
          }
          throw new Error(`unknown dep ${name}`)
        },
      } as unknown as AwilixContainer,
    }
    const result = await executePendingActionConfirm({
      action: makeAction(),
      agent: makeAgent(),
      tool: gatedTool(handler),
      ctx,
      repo: makeRepoStub(makeAction()) as unknown as never,
      emitEvent: jest.fn().mockResolvedValue(undefined),
    })
    expect(handler).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
  })
})
