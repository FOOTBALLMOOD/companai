/**
 * T-08: trust demotion now has a caller.
 *
 * `TrustService.demoteIfEvidenceDemands` drops a principal one tier when their
 * acts keep being reversed. It had **zero production callers**, so authority
 * could be raised on evidence and never lowered, and a principal whose acts keep
 * being reversed stayed at their tier forever.
 *
 * The trigger is the reversal itself, and `CommandBus.undo` is the only place a
 * reversal happens. These tests pin the three decisions the requirement made,
 * and each one exists because the alternative breaks something:
 *
 *   - the ORIGINAL actor is demoted, not the person pressing undo, because the
 *     evidence query counts `action_logs.actor_user_id`;
 *   - the capability group is the undone command's module segment;
 *   - a throwing trust service never fails an undo.
 */
import { asValue, createContainer, InjectionMode } from 'awilix'
import { CommandBus, registerCommand, unregisterCommand } from '@open-mercato/shared/lib/commands'

function buildBus(options: {
  demote: jest.Mock
  log?: Record<string, unknown>
  resolveTrust?: boolean
}) {
  registerCommand({
    id: 'customers.people.update',
    execute: jest.fn(),
    undo: jest.fn(async () => {}),
  })

  const container = createContainer({ injectionMode: InjectionMode.CLASSIC })
  const registrations: Record<string, unknown> = {
    actionLogService: asValue({
      findByUndoToken: jest.fn(async () => ({
        id: 'log-1',
        commandId: 'customers.people.update',
        actionLabel: 'Update person',
        actorUserId: 'user-1',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        resourceKind: 'customers.person',
        resourceId: 'person-1',
        commandPayload: { id: 'person-1' },
        snapshotBefore: { lastName: 'Before' },
        snapshotAfter: { lastName: 'After' },
        changesJson: { lastName: { from: 'Before', to: 'After' } },
        ...(options.log ?? {}),
      })),
      claimForUndo: jest.fn(async () => true),
      releaseUndoClaim: jest.fn(async () => true),
      markUndone: jest.fn(async () => null),
    }),
    dataEngine: asValue({ flushOrmEntityChanges: jest.fn(async () => undefined) }),
  }
  if (options.resolveTrust !== false) {
    registrations.trustService = asValue({ demoteIfEvidenceDemands: options.demote })
  }

  container.register(registrations)

  const bus = new CommandBus()
  const ctx = {
    container,
    auth: { sub: 'user-2', tenantId: 'tenant-1', orgId: 'org-1' },
    organizationScope: null,
    selectedOrganizationId: 'org-1',
    organizationIds: null,
  }
  return { bus, ctx }
}

describe('undo lowers trust when the evidence demands it', () => {
  afterEach(() => {
    unregisterCommand('customers.people.update')
  })

  it('asks the trust service to re-evaluate the actor after a reversal', async () => {
    const demote = jest.fn(async () => null)
    const { bus, ctx } = buildBus({ demote })

    await bus.undo('undo-token', ctx)

    expect(demote).toHaveBeenCalledTimes(1)
  })

  it('demotes the original actor, not whoever pressed undo', async () => {
    const demote = jest.fn(async () => null)
    const { bus, ctx } = buildBus({ demote })

    await bus.undo('undo-token', ctx)

    // The log row belongs to user-1; the caller is user-2. The evidence query
    // counts `action_logs.actor_user_id`, so demoting user-2 would change a
    // different principal's evidence.
    expect(demote).toHaveBeenCalledWith('user-1', 'customers', { tenantId: 'tenant-1' })
  })

  it('derives the capability group from the undone command, not from the caller', async () => {
    const demote = jest.fn(async () => null)
    const { bus, ctx } = buildBus({ demote })

    await bus.undo('undo-token', ctx)

    expect(demote.mock.calls[0][1]).toBe('customers')
  })

  it('runs after the trace is written, so the count includes the reversal', async () => {
    const order: string[] = []
    registerCommand({
      id: 'customers.people.update',
      execute: jest.fn(),
      undo: jest.fn(async () => {}),
    })

    const container = createContainer({ injectionMode: InjectionMode.CLASSIC })
    container.register({
      actionLogService: asValue({
        findByUndoToken: jest.fn(async () => ({
          id: 'log-1',
          commandId: 'customers.people.update',
          actorUserId: 'user-1',
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          commandPayload: { id: 'person-1' },
          snapshotBefore: {},
          snapshotAfter: {},
          changesJson: {},
        })),
        claimForUndo: jest.fn(async () => true),
        releaseUndoClaim: jest.fn(async () => true),
        markUndone: jest.fn(async () => {
          order.push('markUndone')
        }),
      }),
      dataEngine: asValue({ flushOrmEntityChanges: jest.fn(async () => undefined) }),
      trustService: asValue({
        demoteIfEvidenceDemands: jest.fn(async () => {
          order.push('demote')
        }),
      }),
    })

    const bus = new CommandBus()
    await bus.undo('undo-token', {
      container,
      auth: { sub: 'user-2', tenantId: 'tenant-1', orgId: 'org-1' },
      organizationScope: null,
      selectedOrganizationId: 'org-1',
      organizationIds: null,
    })

    expect(order).toEqual(['markUndone', 'demote'])
  })

  it('swallows a failing demotion rather than failing the undo', async () => {
    const demote = jest.fn(async () => {
      throw new Error('evidence unavailable')
    })
    const { bus, ctx } = buildBus({ demote })

    // A reversed act with no record is worse than a tier that moves late.
    await expect(bus.undo('undo-token', ctx)).resolves.toBeUndefined()
    expect(demote).toHaveBeenCalledTimes(1)
  })

  it('does nothing when there is no principal to demote', async () => {
    const demote = jest.fn(async () => null)
    const { bus, ctx } = buildBus({ demote, log: { actorUserId: null } })

    await bus.undo('undo-token', ctx)

    expect(demote).not.toHaveBeenCalled()
  })

  it('does nothing when the deployment has no trust service', async () => {
    const demote = jest.fn(async () => null)
    const { bus, ctx } = buildBus({ demote, resolveTrust: false })

    await expect(bus.undo('undo-token', ctx)).resolves.toBeUndefined()
    expect(demote).not.toHaveBeenCalled()
  })
})
