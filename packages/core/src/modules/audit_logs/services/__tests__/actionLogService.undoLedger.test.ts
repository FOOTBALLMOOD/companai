/**
 * T-06: the reversal record is chained, and the chain says it is a reversal.
 *
 * Before this, `markUndone` created the trace row with `createLogEntity` on a
 * forked EntityManager and flushed, and `appendToLedger` was never called. The
 * one record saying "this was undone" lived only in the editable journal, so
 * deleting it left the chain intact and still verifying.
 *
 * These tests hold the two halves of the fix in place, and they are written
 * against the real service rather than a mocked one: the defect was *inside*
 * `markUndone`, so a test that mocks `markUndone` cannot see it.
 */

import { ActionLogService } from '../actionLogService'

type Row = Record<string, unknown>

function createService() {
  const persisted: Row[] = []
  let flushed = 0
  let forked = 0

  const em = {
    create: (_entity: unknown, data: Row) => ({ id: 'trace-1', ...data }),
    persist: (entity: Row) => {
      persisted.push(entity)
      return { flush: async () => undefined }
    },
    findOne: async () => ({
      id: 'source-1',
      tenantId: TENANT_ID,
      organizationId: ORG_ID,
      actorUserId: USER_ID,
      commandId: 'customers.people.update',
      executionState: 'undoing',
      undoToken: 'undo-token',
      deletedAt: null,
    }),
    flush: async () => {
      flushed += 1
    },
    // If the implementation forks again, this counter says so rather than
    // throwing, because the assertion is about which manager did the writing.
    fork: () => {
      forked += 1
      return em
    },
  }

  const append = jest.fn(async () => ({ id: 'ledger-1' }))

  const service = new ActionLogService(
    em as unknown as ConstructorParameters<typeof ActionLogService>[0],
    undefined,
    { append } as unknown as ConstructorParameters<typeof ActionLogService>[2],
  )

  return {
    service,
    append,
    persisted,
    flushed: () => flushed,
    forked: () => forked,
  }
}

// Real uuids, because the schema validates them and quietly nulls anything else.
const TENANT_ID = '88b6bc8a-a655-4edd-b1b5-d186606efdb2'
const ORG_ID = '065bd751-ada0-4469-a571-879950a1be51'
const USER_ID = '11111111-1111-4111-8111-111111111111'

const traceEntry = {
  tenantId: TENANT_ID,
  organizationId: ORG_ID,
  actorUserId: USER_ID,
  commandId: 'customers.people.update',
  actionLabel: 'Update person',
  resourceKind: 'customers.person',
  resourceId: 'person-1',
  snapshotBefore: { lastName: 'After' },
  snapshotAfter: { lastName: 'Before' },
  changes: { lastName: { from: 'After', to: 'Before' } },
  context: {
    historyAction: 'undo',
    sourceLogId: 'source-1',
    sourceCommandId: 'customers.people.update',
  },
}

describe('the reversal record extends the chain (R1)', () => {
  it('appends exactly one ledger event when an act is marked undone', async () => {
    const { service, append } = createService()

    await service.markUndone('source-1', traceEntry)

    expect(append).toHaveBeenCalledTimes(1)
  })

  it('writes the trace row on the same EntityManager, never a fork (R4)', async () => {
    const { service, flushed, forked, persisted } = createService()

    await service.markUndone('source-1', traceEntry)

    expect(forked()).toBe(0)
    expect(flushed()).toBeGreaterThan(0)
    expect(persisted).toHaveLength(1)
  })

  it('chains nothing when there is no trace to write', async () => {
    const { service, append } = createService()

    await service.markUndone('source-1')

    expect(append).not.toHaveBeenCalled()
  })
})

describe('the event says it is a reversal (R2)', () => {
  it('carries historyAction and the row it reverses', async () => {
    const { service, append } = createService()

    await service.markUndone('source-1', traceEntry)

    const event = append.mock.calls[0][0] as { payload: Record<string, unknown> }
    expect(event.payload.historyAction).toBe('undo')
    expect(event.payload.sourceLogId).toBe('source-1')
  })

  it('keeps the event type as the command id, so existing consumers still match', async () => {
    const { service, append } = createService()

    await service.markUndone('source-1', traceEntry)

    const event = append.mock.calls[0][0] as { eventType: string }
    expect(event.eventType).toBe('customers.people.update')
  })

  it('leaves an ordinary write without the reversal marker', async () => {
    const { service, append } = createService()

    await service.log({
      tenantId: TENANT_ID,
      organizationId: ORG_ID,
      actorUserId: USER_ID,
      commandId: 'customers.people.update',
      actionLabel: 'Update person',
      resourceKind: 'customers.person',
      resourceId: 'person-1',
    })

    const event = append.mock.calls[0][0] as { payload: Record<string, unknown> }
    expect(event.payload).not.toHaveProperty('historyAction')
    expect(event.payload).not.toHaveProperty('sourceLogId')
  })
})

describe('the two directions agree (R5)', () => {
  it('chains both a forward write and its reversal', async () => {
    const { service, append } = createService()

    await service.log({
      tenantId: TENANT_ID,
      organizationId: ORG_ID,
      actorUserId: USER_ID,
      commandId: 'customers.people.update',
      actionLabel: 'Update person',
      resourceKind: 'customers.person',
      resourceId: 'person-1',
    })
    await service.markUndone('source-1', traceEntry)

    // Redo needs no separate case: it re-executes through the command bus and
    // reaches `log()`, which is the first half of this assertion. What this
    // pins is that undo now agrees with it.
    expect(append).toHaveBeenCalledTimes(2)
    const payloads = append.mock.calls.map((call) => (call[0] as { payload: Record<string, unknown> }).payload)
    expect(payloads[0]).not.toHaveProperty('historyAction')
    expect(payloads[1]).toHaveProperty('historyAction', 'undo')
  })
})
