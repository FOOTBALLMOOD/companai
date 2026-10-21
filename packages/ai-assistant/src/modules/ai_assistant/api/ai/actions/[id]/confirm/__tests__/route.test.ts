import { z } from 'zod'

const authMock = jest.fn()
const loadAclMock = jest.fn()
const createRequestContainerMock = jest.fn()
const repoGetByIdMock = jest.fn()
const repoSetStatusMock = jest.fn()
const policyOverrideGetMock = jest.fn()
const loadAgentRegistryMock = jest.fn()
const loadAllModuleToolsMock = jest.fn()
const getAgentMock = jest.fn()
const resolveAgentDefinitionMock = jest.fn()
const getToolMock = jest.fn()
const attachmentFindMock = jest.fn()
const findBindingMock = jest.fn()

jest.mock('@open-mercato/shared/lib/auth/server', () => ({
  getAuthFromRequest: (...args: unknown[]) => authMock(...args),
  // CC-56 — the real `resolveAgentBinding` imports `requirePrincipal` from this
  // module; mirror it minimally so the confirm route exercises the same branch
  // the dispatch routes do. A machine's id comes from `keyId` when present.
  requirePrincipal: (auth: { sub?: string; keyId?: string | null } | null) => {
    if (!auth?.sub) return null
    const sub = auth.sub
    if (sub.startsWith('ai_worker:')) {
      return { kind: 'ai_worker', id: auth.keyId ?? sub.slice(10) }
    }
    if (sub.startsWith('api_key:')) {
      return { kind: 'service', id: auth.keyId ?? sub.slice(8) }
    }
    return { kind: 'human', id: sub }
  },
}))

jest.mock('@open-mercato/shared/lib/di/container', () => ({
  createRequestContainer: (...args: unknown[]) => createRequestContainerMock(...args),
}))

jest.mock('@open-mercato/shared/lib/encryption/find', () => ({
  findWithDecryption: (...args: unknown[]) => attachmentFindMock(...args),
  findOneWithDecryption: jest.fn(),
}))

jest.mock('@open-mercato/core/modules/attachments/data/entities', () => ({
  Attachment: class Attachment {},
  AttachmentPartition: class AttachmentPartition {},
}))

jest.mock('../../../../../../data/repositories/AiPendingActionRepository', () => ({
  AiPendingActionRepository: jest.fn().mockImplementation(() => ({
    getById: repoGetByIdMock,
    setStatus: repoSetStatusMock,
  })),
}))

jest.mock('../../../../../../data/repositories/AiAgentMutationPolicyOverrideRepository', () => ({
  AiAgentMutationPolicyOverrideRepository: jest.fn().mockImplementation(() => ({
    get: policyOverrideGetMock,
  })),
}))

// CC-56 — the real `resolveAgentBinding` reads the binding through this repo.
jest.mock('../../../../../../data/repositories/AiAgentBindingRepository', () => ({
  AiAgentBindingRepository: class {
    findBinding(...args: unknown[]) {
      return findBindingMock(...args)
    }
  },
}))

jest.mock('../../../../../../lib/agent-registry', () => ({
  getAgent: (...args: unknown[]) => getAgentMock(...args),
  loadAgentRegistry: (...args: unknown[]) => loadAgentRegistryMock(...args),
}))

// T-15 — the confirm route resolves the agent through the catalogue (code first,
// tenant row second), not the global registry. Mocked here because the real one
// reads the database.
jest.mock('../../../../../../lib/agent-type-catalog', () => ({
  resolveAgentDefinition: (...args: unknown[]) => resolveAgentDefinitionMock(...args),
}))

jest.mock('../../../../../../lib/tool-registry', () => ({
  toolRegistry: {
    getTool: (...args: unknown[]) => getToolMock(...args),
  },
}))

jest.mock('../../../../../../lib/tool-loader', () => ({
  loadAllModuleTools: (...args: unknown[]) => loadAllModuleToolsMock(...args),
}))

import { POST } from '../route'

function buildRequest(): Request {
  return new Request('http://localhost/api/ai_assistant/ai/actions/pa_123/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  })
}

function buildContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pa_123',
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    agentId: 'catalog.merchandising_assistant',
    toolName: 'catalog.update_product',
    status: 'pending',
    fieldDiff: [{ field: 'title', before: 'Old', after: 'New' }],
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
    createdAt: new Date(Date.now() - 60_000),
    expiresAt: new Date(Date.now() + 3_600_000),
    resolvedAt: null,
    resolvedByUserId: null,
    ...overrides,
  }
}

function makeAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'catalog.merchandising_assistant',
    moduleId: 'catalog',
    label: 'Catalog',
    description: '...',
    systemPrompt: '...',
    allowedTools: ['catalog.update_product'],
    readOnly: false,
    mutationPolicy: 'confirm-required',
    ...overrides,
  }
}

function makeTool(overrides: Record<string, unknown> = {}) {
  return {
    name: 'catalog.update_product',
    description: 'Update product',
    inputSchema: z.object({
      productId: z.string(),
      patch: z.object({ title: z.string() }).partial(),
    }),
    handler: jest.fn().mockResolvedValue({ recordId: 'p-1', commandName: 'catalog.product.update' }),
    isMutation: true,
    loadBeforeRecord: jest.fn().mockResolvedValue({
      recordId: 'p-1',
      entityType: 'catalog.product',
      recordVersion: 'v-1',
      before: { title: 'Old' },
    }),
    ...overrides,
  }
}

describe('POST /api/ai/actions/:id/confirm route (Step 5.8)', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    findBindingMock.mockReset()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    authMock.mockResolvedValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      orgId: 'org-1',
    })
    loadAclMock.mockResolvedValue({
      features: ['ai_assistant.view', 'catalog.view', 'catalog.manage'],
      isSuperAdmin: false,
    })
    createRequestContainerMock.mockResolvedValue({
      resolve: (name: string) => {
        if (name === 'rbacService') {
          return {
            loadAcl: loadAclMock,
            hasAllFeatures: (required: string[], granted: string[]) =>
              required.every((feature) => granted.includes(feature)),
          }
        }
        if (name === 'em') return {}
        if (name === 'eventBus') return { emitEvent: jest.fn().mockResolvedValue(undefined) }
        return null
      },
    })
    policyOverrideGetMock.mockResolvedValue(null)
    loadAgentRegistryMock.mockResolvedValue(undefined)
    loadAllModuleToolsMock.mockResolvedValue(undefined)
    getAgentMock.mockReturnValue(makeAgent())
    resolveAgentDefinitionMock.mockResolvedValue(makeAgent())
    getToolMock.mockReturnValue(makeTool())
    attachmentFindMock.mockResolvedValue([])

    repoSetStatusMock.mockImplementation(async (id: string, status: string, _scope: unknown, extra?: any) => {
      return { ...makeRow({ id, status }), ...(extra?.executionResult ? { executionResult: extra.executionResult } : {}) }
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValueOnce(null)
    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(401)
  })

  it('happy path: returns 200 with pendingAction.status === confirmed', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.pendingAction.status).toBe('confirmed')
    expect(body.mutationResult).toEqual({ recordId: 'p-1', commandName: 'catalog.product.update' })
  })

  it('409 invalid_status: already cancelled', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow({ status: 'cancelled' }))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe('invalid_status')
  })

  it('409 expired: expiresAt in the past', async () => {
    repoGetByIdMock.mockResolvedValueOnce(
      makeRow({ expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
    )

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe('expired')
  })

  it('412 stale_version: record version drift on single-record action', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow({ recordVersion: 'v-1' }))
    getToolMock.mockReturnValueOnce(
      makeTool({
        loadBeforeRecord: jest.fn().mockResolvedValue({
          recordId: 'p-1',
          entityType: 'catalog.product',
          recordVersion: 'v-2',
          before: { title: 'x' },
        }),
      }),
    )

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(412)
    const body = await response.json()
    expect(body.code).toBe('stale_version')
  })

  it('403 read_only_agent when policy override downgrades to read-only', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    policyOverrideGetMock.mockResolvedValueOnce({ mutationPolicy: 'read-only' })

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('read_only_agent')
  })

  it('403 tool_not_whitelisted when agent no longer whitelists the tool', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    resolveAgentDefinitionMock.mockResolvedValueOnce(makeAgent({ allowedTools: [] }))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('tool_not_whitelisted')
  })

  it('403 agent_features_denied when caller lacks agent features', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    resolveAgentDefinitionMock.mockResolvedValueOnce(makeAgent({ requiredFeatures: ['catalog.restricted.manage'] }))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('agent_features_denied')
  })

  it('403 attachment_cross_tenant when an attachment belongs to a different tenant', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow({ attachmentIds: ['a-1'] }))
    attachmentFindMock.mockResolvedValueOnce([
      { id: 'a-1', tenantId: 'tenant-OTHER', organizationId: 'org-OTHER' },
    ])

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('attachment_cross_tenant')
  })

  it('404 agent_unknown when the agent cannot be resolved', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    resolveAgentDefinitionMock.mockResolvedValueOnce(null)

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.code).toBe('agent_unknown')
  })

  it('404 pending_action_not_found when the row does not exist for the caller', async () => {
    repoGetByIdMock.mockResolvedValueOnce(null)

    const response = await POST(buildRequest() as any, buildContext('pa_missing'))
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.code).toBe('pending_action_not_found')
  })

  it('403 forbidden when caller lacks ai_assistant.view', async () => {
    loadAclMock.mockResolvedValueOnce({ features: ['catalog.view'], isSuperAdmin: false })

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('forbidden')
  })

  it('idempotent: second confirm on already-confirmed row returns 200 + prior executionResult without invoking handler', async () => {
    const priorResult = { recordId: 'p-1', commandName: 'catalog.product.update' }
    const priorRow = makeRow({
      status: 'confirmed',
      executionResult: priorResult,
      resolvedAt: new Date('2026-04-18T10:30:00.000Z'),
      resolvedByUserId: 'user-1',
    })
    repoGetByIdMock.mockResolvedValueOnce(priorRow)
    const handlerSpy = jest.fn()
    getToolMock.mockReturnValueOnce(makeTool({ handler: handlerSpy }))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.mutationResult).toEqual(priorResult)
    expect(handlerSpy).not.toHaveBeenCalled()
    expect(repoSetStatusMock).not.toHaveBeenCalled()
  })

  it('500 confirm_internal_error when the repo throws unexpectedly', async () => {
    repoGetByIdMock.mockRejectedValueOnce(new Error('db down'))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.code).toBe('confirm_internal_error')
  })

  // --- CC-56: the confirm path re-checks the binding (fail-closed for ai_worker) ---

  it('CC-56 — REFUSES an ai_worker whose binding was revoked (403 agent_not_bound)', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    authMock.mockResolvedValue({ sub: 'ai_worker:key-1', tenantId: 'tenant-1', orgId: 'org-1' })
    findBindingMock.mockResolvedValueOnce(null)
    const handlerSpy = jest.fn()
    getToolMock.mockReturnValueOnce(makeTool({ handler: handlerSpy }))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('agent_not_bound')
    // The tool must NOT have executed, and no state transition happened.
    expect(handlerSpy).not.toHaveBeenCalled()
    expect(repoSetStatusMock).not.toHaveBeenCalled()
  })

  it('CC-56 — ALLOWS an ai_worker WITH a live binding (200)', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    authMock.mockResolvedValue({ sub: 'ai_worker:key-1', tenantId: 'tenant-1', orgId: 'org-1' })
    findBindingMock.mockResolvedValueOnce({ toolAllowlist: null, requiredFeatures: [] })

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(findBindingMock).toHaveBeenCalledTimes(1)
  })

  it('CC-56 — a HUMAN confirm is a passthrough (binding never consulted, even with no row)', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    // authMock default is a human (sub: 'user-1'). Even if a binding lookup were
    // made and found NOTHING, a human must NOT be refused — this is the
    // discriminator a route wrongly applying the binding to humans would fail.
    findBindingMock.mockResolvedValueOnce(null)

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(200)
    expect(findBindingMock).not.toHaveBeenCalled()
  })

  // --- T-15 — the narrowing the dispatch path applied is applied here too ---

  it('T-15 — refuses a tool outside the binding allowlist (403)', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    authMock.mockResolvedValue({ sub: 'ai_worker:key-1', tenantId: 'tenant-1', orgId: 'org-1' })
    // The binding allows a DIFFERENT tool, so the dispatch that proposed this act
    // could never have run it. Confirming it would widen what was approved.
    findBindingMock.mockResolvedValue({ toolAllowlist: ['other.tool'], requiredFeatures: [] })

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('tool_not_allowed_by_binding')
  })

  it('T-15 — refuses when the caller lacks a feature the binding requires (403)', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    authMock.mockResolvedValue({ sub: 'ai_worker:key-1', tenantId: 'tenant-1', orgId: 'org-1' })
    findBindingMock.mockResolvedValue({ toolAllowlist: null, requiredFeatures: ['catalog.publish'] })

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.code).toBe('binding_features_missing')
  })

  it('T-15 — a tenant-authored type is resolved through the catalogue, not the registry', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    // The type exists ONLY as a tenant row. The global registry has never heard of
    // it, so a route reading `getAgent` would see nothing and fail closed on the
    // wrong agent, or compute a narrowing from the wrong definition.
    getAgentMock.mockReturnValue(undefined)
    resolveAgentDefinitionMock.mockResolvedValue(makeAgent({ id: 'tenant.custom_assistant' }))

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(200)
    expect(resolveAgentDefinitionMock).toHaveBeenCalledTimes(1)
  })

  it('T-15 — an agent that cannot be resolved for the tenant keeps its 404', async () => {
    repoGetByIdMock.mockResolvedValueOnce(makeRow())
    getAgentMock.mockReturnValue(undefined)
    resolveAgentDefinitionMock.mockResolvedValue(null)

    const response = await POST(buildRequest() as any, buildContext('pa_123'))
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.code).toBe('agent_unknown')
  })
})
