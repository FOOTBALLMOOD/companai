/**
 * T-06, R3: the journal's reversals and the chain must agree.
 *
 * The hash walk cannot answer this. A missing event is not a broken link: the
 * chain stays internally consistent and simply never mentions the undo, so
 * deleting the trace row from the journal leaves a chain that still verifies.
 * This check compares the two records against each other, in both directions,
 * because either one alone can be satisfied by editing the other.
 */

import { LedgerService } from '../ledgerService'

function createService(options: { undone?: string[]; reversed?: Array<string | null> }) {
  const em = {
    getConnection: () => ({
      execute: async (sql: string) => {
        if (sql.includes('action_logs')) return (options.undone ?? []).map((id) => ({ id }))
        return (options.reversed ?? []).map((source_id) => ({ source_id }))
      },
    }),
  }

  return new LedgerService(em as unknown as ConstructorParameters<typeof LedgerService>[0])
}

const TENANT_ID = '88b6bc8a-a655-4edd-b1b5-d186606efdb2'

describe('undo coverage', () => {
  it('passes when every undone row has its event and every event has its row', async () => {
    const service = createService({ undone: ['log-1', 'log-2'], reversed: ['log-1', 'log-2'] })

    const result = await service.verifyUndoCoverage(TENANT_ID)

    expect(result.ok).toBe(true)
    expect(result.undoneWithoutEvent).toEqual([])
    expect(result.eventWithoutUndone).toEqual([])
  })

  it('reports a row that claims to be undone with no event naming it', async () => {
    const service = createService({ undone: ['log-1', 'log-2'], reversed: ['log-1'] })

    const result = await service.verifyUndoCoverage(TENANT_ID)

    expect(result.ok).toBe(false)
    expect(result.undoneWithoutEvent).toEqual(['log-2'])
    expect(result.eventWithoutUndone).toEqual([])
  })

  it('reports an event whose source row is not undone', async () => {
    const service = createService({ undone: ['log-1'], reversed: ['log-1', 'log-9'] })

    const result = await service.verifyUndoCoverage(TENANT_ID)

    expect(result.ok).toBe(false)
    expect(result.undoneWithoutEvent).toEqual([])
    expect(result.eventWithoutUndone).toEqual(['log-9'])
  })

  it('ignores an event whose payload has no source id', async () => {
    const service = createService({ undone: ['log-1'], reversed: ['log-1', null] })

    const result = await service.verifyUndoCoverage(TENANT_ID)

    expect(result.ok).toBe(true)
  })

  it('passes on a tenant with no reversals at all', async () => {
    const service = createService({})

    const result = await service.verifyUndoCoverage(TENANT_ID)

    expect(result.ok).toBe(true)
    expect(result.undoneWithoutEvent).toEqual([])
    expect(result.eventWithoutUndone).toEqual([])
  })
})
