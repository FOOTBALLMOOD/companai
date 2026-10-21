/**
 * **S-02 — the Hermes tool door is authorized by the resolver.**
 *
 * What these tests hold is the *wiring*, not the resolver's rules (those are
 * tested where they live, `shared/src/lib/authority/__tests__`). The defect S-02
 * named was specifically that a tool call was authorized by a **parallel**
 * decider — `hasAllFeatures`, a synchronous string match over granted features —
 * while the authority resolver, the one decider every other act goes through,
 * was never consulted for a tool.
 *
 * So each test below breaks if `executeTool` stops consulting the resolver, or
 * consults it in a way that does not carry the responsible-user intersection, or
 * fails *open* where the source study's warning says it must fail closed.
 *
 * The resolver itself is faked. That is the point: the unit under test is the
 * door's *use* of the resolver, and a fake that records what it was asked lets
 * the intersection be asserted directly rather than inferred from a gate.
 */
import { executeTool } from '../tool-executor'
import { toolRegistry } from '../tool-registry'
import type { McpToolContext } from '../types'
import { z } from 'zod'

const FEATURE = 'crm.contacts.manage'
const HUMAN = 'human-user-id'
const KEY = 'apikey:key-id'

type DecideCall = {
  subject: string
  feature: string
  scope: { tenantId: string | null; organizationId: string | null }
  options?: { onBehalfOfUserId?: string | null; recordId?: string | null }
}

function decision(gate: string, allowed = true) {
  return {
    gate,
    allowed,
    reasons: [{ rule: `${gate}-rule`, ceiling: gate, detail: `held at ${gate}` }],
    bindingRule: `${gate}-rule`,
    obligations: [],
    alternatives: [],
  }
}

function makeContext(
  aclAllows: boolean,
  resolver:
    | {
        mode: 'off' | 'shadow' | 'enforce'
        decide: (call: DecideCall) => unknown | null
        /** T-16 — registered, but the mode lookup itself fails. */
        modeForThrows?: boolean
      }
    | null,
  overrides: Partial<McpToolContext> = {},
): { context: McpToolContext; calls: DecideCall[] } {
  const calls: DecideCall[] = []
  const container = {
    resolve: (name: string) => {
      if (name === 'rbacService') {
        return { hasAllFeatures: () => aclAllows }
      }
      if (name === 'authorityEnforcement') {
        if (!resolver) throw new Error('not registered')
        return {
          modeFor: async () => {
            if (resolver.modeForThrows) throw new Error('resolver unreachable')
            return resolver.mode
          },
          decideFor: async (subject: string, feature: string, scope: DecideCall['scope'], options?: DecideCall['options']) => {
            const call: DecideCall = { subject, feature, scope, options }
            calls.push(call)
            return resolver.decide(call)
          },
        }
      }
      throw new Error(`unexpected resolve: ${name}`)
    },
  }
  const context: McpToolContext = {
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    userId: KEY,
    container: container as unknown as McpToolContext['container'],
    userFeatures: aclAllows ? [FEATURE] : [],
    isSuperAdmin: false,
    ...overrides,
  }
  return { context, calls }
}

beforeEach(() => {
  toolRegistry.clear()
  toolRegistry.registerTool({
    name: 'crm_contacts_manage',
    description: 'A tool requiring one capability',
    inputSchema: z.object({}).passthrough(),
    requiredFeatures: [FEATURE],
    handler: async () => ({ ok: true }),
  })
})

describe('S-02 — the tool door consults the authority resolver', () => {
  it('refuses an A0 tool call when the tenant enforces', async () => {
    const { context } = makeContext(true, { mode: 'enforce', decide: () => decision('A0', false) })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('UNAUTHORIZED')
    expect(result.error).toContain('A0')
  })

  it('holds an A2 tool call instead of running it when the tenant enforces', async () => {
    const { context } = makeContext(true, { mode: 'enforce', decide: () => decision('A2') })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('UNAUTHORIZED')
    expect(result.error).toContain('held for approval')
    expect(result.error).toContain('A2')
  })

  it('runs the tool when the resolver permits at A5 and the tenant enforces', async () => {
    const { context } = makeContext(true, { mode: 'enforce', decide: () => decision('A5') })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(true)
  })

  it('refuses nothing in shadow mode, even at A0', async () => {
    const { context } = makeContext(true, { mode: 'shadow', decide: () => decision('A0', false) })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(true)
  })

  it('refuses nothing when enforcement is off', async () => {
    const { context } = makeContext(true, { mode: 'off', decide: () => decision('A0', false) })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(true)
  })

  it('still refuses when RBAC denies even if the resolver would permit', async () => {
    // RBAC is the grant and the resolver only subtracts: an authority permit
    // must never turn an RBAC denial into an allowance.
    const { context } = makeContext(false, { mode: 'enforce', decide: () => decision('A5') })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('UNAUTHORIZED')
    expect(result.error).toContain('Insufficient permissions')
  })

  // T-16 — the two missing-dependency states, which this door used to answer as
  // one. The old test called the FIRST of these "unreachable", and that is how the
  // contradiction with the command gate stayed hidden for months.

  it('permits when the enforcement service is NOT REGISTERED', async () => {
    // The deployment chose not to gate. Refusing here broke a working deployment
    // for a constraint it never asked for, and contradicted the command gate,
    // which permits on this exact state.
    const { context } = makeContext(true, null)
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(true)
  })

  it('refuses when the enforcement service is REGISTERED BUT UNREACHABLE', async () => {
    // The source study's named warning still holds for this state: fail closed, or
    // do not ship the switch. The deployment meant to gate and cannot reach the
    // gate, so the act is refused rather than run ungoverned.
    const { context } = makeContext(true, { mode: 'enforce', decide: () => null, modeForThrows: true })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(false)
    expect(result.errorCode).toBe('UNAUTHORIZED')
  })

  it('permits an undescribed capability — a coverage gap is not a refusal', async () => {
    const { context } = makeContext(true, { mode: 'enforce', decide: () => null })
    const result = await executeTool('crm_contacts_manage', {}, context)
    expect(result.success).toBe(true)
  })

  it('does not consult the resolver for a tool with no required features', async () => {
    toolRegistry.registerTool({
      name: 'free_tool',
      description: 'No capability',
      inputSchema: z.object({}).passthrough(),
      handler: async () => ({ ok: true }),
    })
    const { context, calls } = makeContext(true, { mode: 'enforce', decide: () => decision('A0', false) })
    const result = await executeTool('free_tool', {}, context)
    expect(result.success).toBe(true)
    expect(calls).toHaveLength(0)
  })
})

describe('S-02 — the responsible-user intersection', () => {
  it('carries the person an API key acts for into the resolver', async () => {
    // The intersection itself: an agent's authority is its own ∩ the person's.
    // The door supplies that person as `onBehalfOfUserId`; without it the
    // resolver sees a machine with no invoker and the person is never consulted.
    const { context, calls } = makeContext(
      true,
      { mode: 'enforce', decide: () => decision('A5') },
      { onBehalfOfUserId: HUMAN },
    )
    await executeTool('crm_contacts_manage', {}, context)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.options?.onBehalfOfUserId).toBe(HUMAN)
  })

  it('does not derive the responsible user from the subject', async () => {
    // The honest boundary: measured across the door's construction sites,
    // `userId` is sometimes the subject (`apikey:<id>`) and sometimes a real
    // user id, so it can be read as neither without being wrong somewhere. When
    // the context has not resolved the person, the door passes **no invoker**
    // rather than guess — the resolver then judges the machine on its own,
    // which is narrower, never wider.
    const { context, calls } = makeContext(true, { mode: 'enforce', decide: () => decision('A5') })
    expect(context.userId).toBe(KEY)
    expect(context.onBehalfOfUserId).toBeUndefined()
    await executeTool('crm_contacts_manage', {}, context)
    expect(calls[0]?.options?.onBehalfOfUserId).toBeNull()
  })

  it('does not invent an invoker for a person acting as themselves', async () => {
    const { context, calls } = makeContext(
      true,
      { mode: 'enforce', decide: () => decision('A5') },
      { userId: HUMAN, onBehalfOfUserId: HUMAN },
    )
    await executeTool('crm_contacts_manage', {}, context)
    expect(calls[0]?.options?.onBehalfOfUserId).toBeNull()
  })

  it('carries the invoker even when the subject is a bare user id', async () => {
    // `http-server.ts` stores a real user id in `userId` for a key; the person is
    // still carried explicitly, so the intersection survives the inconsistency.
    const { context, calls } = makeContext(
      true,
      { mode: 'enforce', decide: () => decision('A5') },
      { userId: 'key-owner-user-id', onBehalfOfUserId: HUMAN },
    )
    await executeTool('crm_contacts_manage', {}, context)
    expect(calls[0]?.options?.onBehalfOfUserId).toBe(HUMAN)
  })

  it('passes the tenant and organization scope through', async () => {
    const { context, calls } = makeContext(true, { mode: 'enforce', decide: () => decision('A5') })
    await executeTool('crm_contacts_manage', {}, context)
    expect(calls[0]?.scope).toEqual({ tenantId: 'tenant-1', organizationId: 'org-1' })
    expect(calls[0]?.feature).toBe(FEATURE)
  })
})
