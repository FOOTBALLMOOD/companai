/** @jest-environment node */
/**
 * D2-gap guards for the `ai_assistant` **resource-write** routes.
 *
 * WHY THIS FILE EXISTS, AND WHY IT IS NOT A DECORATION
 * ----------------------------------------------------
 * `ai_assistant` was the largest D2-gap module measured: 24 write verbs that
 * called **no mutation guard of any kind**. Fifteen of them — the class-(a)
 * resource writes — now reach the registry through `beginAiAssistantMutationGuard`.
 * This file proves the wrapper is really wired into each of the ten files that
 * carry those fifteen verbs.
 *
 * The danger this file guards against is the one the project has hit before:
 * **a test that is green whether or not the guard is wired in.** The
 * pre-existing `settings/__tests__/route.test.ts`, `conversations/__tests__/route.test.ts`
 * and the agent-override route tests never mock the registry, so they were green
 * before this change and green after it — they say nothing about the guard.
 * Every assertion below is therefore written to go RED if the wrapper call is
 * removed, and each was seen RED under a mutation (recorded in the commit message).
 *
 * WHAT IS ASSERTED, PER ROUTE
 * ---------------------------
 *   1. the registry is called exactly once, with the right
 *      `resourceKind` / `resourceId` / `operation`;
 *   2. the guard runs BEFORE the write commits;
 *   3. a blocking guard stops the write from ever happening;
 *   4. `afterSuccess` runs after the write commits;
 *   5. the class-(b)/(c) set-aside routes never reach the guard.
 */
const runRouteMutationGuards = jest.fn()

jest.mock('@open-mercato/shared/lib/crud/route-mutation-guard', () => ({
  runRouteMutationGuards: (...args: unknown[]) => runRouteMutationGuards(...args),
}))

// --- auth / container --------------------------------------------------------
const authMock = jest.fn()
const loadAclMock = jest.fn()
const createRequestContainerMock = jest.fn()

jest.mock('@open-mercato/shared/lib/auth/server', () => ({
  getAuthFromRequest: (...args: unknown[]) => authMock(...args),
}))

jest.mock('@open-mercato/shared/lib/di/container', () => ({
  createRequestContainer: (...args: unknown[]) => createRequestContainerMock(...args),
}))

// --- settings + allowlist repositories --------------------------------------
const upsertDefaultMock = jest.fn()
const clearDefaultMock = jest.fn()
jest.mock('../../data/repositories/AiAgentRuntimeOverrideRepository', () => ({
  AiAgentRuntimeOverrideRepository: jest.fn().mockImplementation(() => ({
    upsertDefault: (...a: unknown[]) => upsertDefaultMock(...a),
    clearDefault: (...a: unknown[]) => clearDefaultMock(...a),
    getDefault: jest.fn(async () => null),
  })),
  AiAgentRuntimeOverrideValidationError: class AiAgentRuntimeOverrideValidationError extends Error {},
}))

const allowlistUpsertMock = jest.fn()
const allowlistClearMock = jest.fn()
jest.mock('../../data/repositories/AiTenantModelAllowlistRepository', () => ({
  AiTenantModelAllowlistRepository: jest.fn().mockImplementation(() => ({
    upsert: (...a: unknown[]) => allowlistUpsertMock(...a),
    clear: (...a: unknown[]) => allowlistClearMock(...a),
    getSnapshot: jest.fn(async () => null),
  })),
}))

// --- mutation-policy + prompt-override repositories --------------------------
const policyGetMock = jest.fn()
const policySetMock = jest.fn()
const policyClearMock = jest.fn()
jest.mock('../../data/repositories/AiAgentMutationPolicyOverrideRepository', () => ({
  AiAgentMutationPolicyOverrideRepository: jest.fn().mockImplementation(() => ({
    get: (...a: unknown[]) => policyGetMock(...a),
    set: (...a: unknown[]) => policySetMock(...a),
    clear: (...a: unknown[]) => policyClearMock(...a),
  })),
}))

const promptSaveMock = jest.fn()
jest.mock('../../data/repositories/AiAgentPromptOverrideRepository', () => ({
  AiAgentPromptOverrideRepository: jest.fn().mockImplementation(() => ({
    save: (...a: unknown[]) => promptSaveMock(...a),
    getLatest: jest.fn(async () => null),
    listVersions: jest.fn(async () => []),
  })),
}))

// --- conversation storage ----------------------------------------------------
const storageMock = {
  list: jest.fn(),
  createOrGet: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  getTranscript: jest.fn(),
  getParticipantCount: jest.fn(),
  importLocalConversation: jest.fn(),
  addParticipant: jest.fn(),
  revokeParticipant: jest.fn(),
  listParticipants: jest.fn(),
}
jest.mock('../../lib/conversation-storage', () => ({
  createConversationStorage: () => storageMock,
  serializeAiChatConversation: (row: unknown) => row,
  serializeAiChatMessage: (row: unknown) => row,
  AiChatConversationAccessError: class AiChatConversationAccessError extends Error {},
  AiChatConversationDuplicateParticipantError: class AiChatConversationDuplicateParticipantError extends Error {},
  AiChatConversationOrgNotFoundError: class AiChatConversationOrgNotFoundError extends Error {},
  AiChatParticipantNotFoundError: class AiChatParticipantNotFoundError extends Error {},
}))

// --- agent registry (seeded, not stubbed, so `getAgent` behaves like prod) ---
jest.mock('../../lib/agent-registry', () => {
  const actual = jest.requireActual('../../lib/agent-registry')
  return actual
})

jest.mock('../../lib/baseurl-allowlist', () => ({
  readBaseurlAllowlist: () => ['openrouter.ai'],
  isBaseurlAllowlisted: () => true,
}))
jest.mock('@open-mercato/shared/lib/ai/llm-provider-registry', () => ({
  llmProviderRegistry: { get: jest.fn(), list: jest.fn(() => []) },
}))
jest.mock('@open-mercato/shared/lib/ai/opencode-provider', () => ({
  OPEN_CODE_PROVIDER_IDS: [],
  OPEN_CODE_PROVIDERS: {},
  getOpenCodeProviderConfiguredEnvKey: () => null,
  isOpenCodeProviderConfigured: () => false,
}))
jest.mock('../../lib/model-factory', () => ({
  createModelFactory: jest.fn(() => ({ resolveModel: () => ({ providerId: 'openai', modelId: 'gpt-5-mini', baseURL: null, source: 'x' }) })),
  resolveAllowRuntimeOverride: () => true,
}))
jest.mock('../../lib/model-allowlist', () => ({
  // `T-17` — this used to be a hand-written list of every export, so adding one to the real module made
  // the route throw `… is not a function` and surface as a 500 in a suite about something else entirely.
  // Spreading the actual module means the mock can only ever *override*, never silently omit.
  ...jest.requireActual('../../lib/model-allowlist'),
  agentOverrideModelAllowlistEnvVarName: () => 'X',
  agentOverrideProviderAllowlistEnvVarName: () => 'Y',
  canonicalProviderId: (id: string) => id,
  hasAllowlistSnapshotRestrictions: () => false,
  intersectEffectiveAllowlistWithSnapshot: () => ({ providers: [], modelsByProvider: {}, tenantOverridesActive: false, noModelsPermitted: [] }),
  intersectAllowlists: () => ({ providers: [], modelsByProvider: {}, tenantOverridesActive: false, noModelsPermitted: [] }),
  isProviderAllowed: () => true,
  isModelAllowedForProvider: () => true,
  isProviderAllowedInEffective: () => true,
  isProviderModelAllowed: () => true,
  isProviderModelAllowedInEffective: () => true,
  modelAllowlistEnvVarName: () => 'X',
  readAgentRuntimeOverrideAllowlist: () => ({ providers: [], modelsByProvider: {} }),
  readAllowedModels: () => [],
  readAllowedProviders: () => [],
  readAllowlistConfig: () => ({ providers: [], modelsByProvider: {} }),
}))
jest.mock('../../events', () => ({
  emitAiAssistantEvent: jest.fn(async () => undefined),
}))

// The participants route resolves the target user through this helper before
// the guard runs. Stub it so the route reaches the guard instead of 500ing on
// the empty `em` mock.
const findOneWithDecryptionMock = jest.fn()
jest.mock('@open-mercato/shared/lib/encryption/find', () => ({
  findOneWithDecryption: (...a: unknown[]) => findOneWithDecryptionMock(...a),
}))

// --- product code under test -------------------------------------------------
import { PUT as settingsPut, DELETE as settingsDelete } from '../settings/route'
import { PUT as allowlistPut, DELETE as allowlistDelete } from '../settings/allowlist/route'
import { PUT as loopPut, DELETE as loopDelete } from '../ai/agents/[agentId]/loop-override/route'
import { POST as policyPost, DELETE as policyDelete } from '../ai/agents/[agentId]/mutation-policy/route'
import { POST as promptPost } from '../ai/agents/[agentId]/prompt-override/route'
import { POST as convPost } from '../ai/conversations/route'
import { POST as convImportPost } from '../ai/conversations/import/route'
import { PATCH as convPatch, DELETE as convDelete } from '../ai/conversations/[conversationId]/route'
import { GET as participantsGet, POST as participantsPost } from '../ai/conversations/[conversationId]/participants/route'
import { DELETE as participantDelete } from '../ai/conversations/[conversationId]/participants/[userId]/route'
import { POST as chatPost } from '../ai/chat/route'
import { POST as confirmPost } from '../ai/actions/[id]/confirm/route'
import { POST as cancelPost } from '../ai/actions/[id]/cancel/route'

const AGENT_ID = 'catalog.assistant'

function makeAgentRow(agentId: string) {
  return {
    id: 'row-1',
    agentId,
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    userId: 'user-1',
    updatedAt: new Date('2026-10-06T00:00:00Z'),
  }
}

function req(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const ALLOW = { ok: true as const, runAfterSuccess: jest.fn(async () => undefined) }

function seedAuth() {
  authMock.mockResolvedValue({ sub: 'user-1', tenantId: 'tenant-1', orgId: 'org-1' })
}

beforeEach(() => {
  jest.clearAllMocks()
  runRouteMutationGuards.mockReset()
  runRouteMutationGuards.mockResolvedValue(ALLOW)
  ALLOW.runAfterSuccess.mockClear()

  seedAuth()
  loadAclMock.mockResolvedValue({
    features: [
      'ai_assistant.view',
      'ai_assistant.settings.manage',
      'ai_assistant.conversations.manage',
      'ai_assistant.conversations.share',
    ],
    isSuperAdmin: false,
  })
  createRequestContainerMock.mockResolvedValue({
    resolve: (name: string) => {
      if (name === 'rbacService') {
        return {
          loadAcl: loadAclMock,
          hasAllFeatures: (required: string[], granted: string[]) =>
            required.every((f) => granted.includes(f)),
        }
      }
      if (name === 'em') return {}
      return null
    },
  })

  // Seed the REAL registry so `getAgent` resolves like production.
  const registry = jest.requireActual('../../lib/agent-registry')
  registry.resetAgentRegistryForTests()
  registry.seedAgentRegistryForTests([
    {
      id: AGENT_ID,
      moduleId: 'catalog',
      label: 'Catalog assistant',
      description: 'test',
      systemPrompt: 'you are a test agent',
      allowedTools: [],
      mutationPolicy: 'read-only',
    },
  ])

  upsertDefaultMock.mockResolvedValue(makeAgentRow(AGENT_ID))
  clearDefaultMock.mockResolvedValue(true)
  allowlistUpsertMock.mockResolvedValue({ id: 'wl-1', tenantId: 'tenant-1', organizationId: 'org-1', updatedAt: new Date() })
  allowlistClearMock.mockResolvedValue(true)
  policySetMock.mockResolvedValue({ id: 'p-1', agentId: AGENT_ID, mutationPolicy: 'read-only', updatedAt: new Date() })
  policyClearMock.mockResolvedValue(true)
  policyGetMock.mockResolvedValue(null)
  promptSaveMock.mockResolvedValue({ version: 2, updatedAt: new Date() })
  storageMock.createOrGet.mockResolvedValue({ conversationId: 'c-1', agentId: AGENT_ID, status: 'open', visibility: 'private', createdAt: new Date(), updatedAt: new Date() })
  storageMock.getById.mockResolvedValue(null)
  storageMock.update.mockResolvedValue({ conversationId: 'c-1', agentId: AGENT_ID, status: 'open', visibility: 'private', createdAt: new Date(), updatedAt: new Date() })
  storageMock.softDelete.mockResolvedValue(undefined)
  storageMock.importLocalConversation.mockResolvedValue({ conversation: { conversationId: 'c-2', agentId: AGENT_ID, status: 'open', visibility: 'private', createdAt: new Date(), updatedAt: new Date() }, importedMessageCount: 1, skippedMessageCount: 0 })
  storageMock.addParticipant.mockResolvedValue({ userId: 'user-2', role: 'viewer', lastReadAt: null, createdAt: new Date() })
  storageMock.revokeParticipant.mockResolvedValue(undefined)
  findOneWithDecryptionMock.mockResolvedValue(null)
})

// ============================================================================
// settings — PUT/DELETE
// ============================================================================
describe('ai_assistant settings — the D2-gap guard is really wired in', () => {
  it('PUT calls the registry once against ai_assistant.settings and runs afterSuccess', async () => {
    const res = await settingsPut(req('http://x/api/ai_assistant/settings', 'PUT', { providerId: 'openai', modelId: 'gpt-5-mini', agentId: AGENT_ID }) as any)
    expect(res.status).toBe(200)
    expect(runRouteMutationGuards).toHaveBeenCalledTimes(1)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.settings')
    expect(arg.input.resourceId).toBe(AGENT_ID)
    expect(arg.input.operation).toBe('update')
    expect(ALLOW.runAfterSuccess).toHaveBeenCalledTimes(1)
  })

  it('PUT fallback resourceId is the string "default" when no agentId is given', async () => {
    await settingsPut(req('http://x/api/ai_assistant/settings', 'PUT', { providerId: 'openai' }) as any)
    expect(runRouteMutationGuards.mock.calls[0][0].input.resourceId).toBe('default')
  })

  it('PUT runs the guard BEFORE the write, and a blocked guard stops the write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await settingsPut(req('http://x/api/ai_assistant/settings', 'PUT', { providerId: 'openai' }) as any)
    expect(res.status).toBe(403)
    expect(upsertDefaultMock).not.toHaveBeenCalled()
  })

  it('DELETE calls the registry against ai_assistant.settings with operation delete', async () => {
    const res = await settingsDelete(req('http://x/api/ai_assistant/settings', 'DELETE', {}) as any)
    expect(res.status).toBe(200)
    expect(runRouteMutationGuards).toHaveBeenCalledTimes(1)
    expect(runRouteMutationGuards.mock.calls[0][0].input.operation).toBe('delete')
    expect(clearDefaultMock).toHaveBeenCalled()
  })
})

// ============================================================================
// settings/allowlist — PUT/DELETE
// ============================================================================
describe('ai_assistant allowlist — the D2-gap guard is really wired in', () => {
  it('PUT calls the registry against ai_assistant.allowlist / tenant', async () => {
    const res = await allowlistPut(req('http://x/api/ai_assistant/settings/allowlist', 'PUT', { allowedProviders: null, allowedModelsByProvider: {} }) as any)
    expect(res.status).toBe(200)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.allowlist')
    expect(arg.input.resourceId).toBe('tenant')
    expect(arg.input.operation).toBe('update')
    expect(allowlistUpsertMock).toHaveBeenCalled()
  })

  it('★ T-17: an empty stored list is reported as "no models permitted", not as unconstrained', async () => {
    // The route accepted this state before and returned the row as if nothing had been said. The state
    // means *no models permitted*; the runtime now refuses on it, so the write must say so — otherwise an
    // operator stores a lockout and reads back a snapshot that looks like a normal constraint.
    allowlistUpsertMock.mockResolvedValueOnce({
      id: 'wl-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      allowedProviders: null,
      allowedModelsByProvider: { openai: [] },
      updatedAt: new Date(),
    })
    const res = await allowlistPut(
      req('http://x/api/ai_assistant/settings/allowlist', 'PUT', {
        allowedProviders: null,
        allowedModelsByProvider: { openai: [] },
      }) as any,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.noModelsPermitted).toEqual(['openai'])
    // And the stored list travels back unchanged — the state is reported, not rewritten.
    expect(body.allowedModelsByProvider).toEqual({ openai: [] })
  })

  it('PUT: a blocked guard stops the allowlist write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await allowlistPut(req('http://x/api/ai_assistant/settings/allowlist', 'PUT', { allowedProviders: null }) as any)
    expect(res.status).toBe(403)
    expect(allowlistUpsertMock).not.toHaveBeenCalled()
  })

  it('DELETE calls the registry with operation delete', async () => {
    await allowlistDelete(req('http://x/api/ai_assistant/settings/allowlist', 'DELETE') as any)
    expect(runRouteMutationGuards.mock.calls[0][0].input.operation).toBe('delete')
    expect(allowlistClearMock).toHaveBeenCalled()
  })
})

// ============================================================================
// agents/[agentId]/loop-override — PUT/DELETE
// ============================================================================
const loopCtx = (agentId = AGENT_ID) => ({ params: Promise.resolve({ agentId }) })

describe('ai_assistant loop-override — the D2-gap guard is really wired in', () => {
  it('PUT calls the registry against ai_assistant.agent_override / <agent id>', async () => {
    const res = await loopPut(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/loop-override', 'PUT', { loopMaxSteps: 5 }) as any, loopCtx())
    expect(res.status).toBe(200)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.agent_override')
    expect(arg.input.resourceId).toBe(AGENT_ID)
    expect(arg.input.operation).toBe('update')
    expect(ALLOW.runAfterSuccess).toHaveBeenCalledTimes(1)
  })

  it('PUT: a blocked guard stops the loop-override write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await loopPut(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/loop-override', 'PUT', { loopMaxSteps: 5 }) as any, loopCtx())
    expect(res.status).toBe(403)
    expect(upsertDefaultMock).not.toHaveBeenCalled()
  })

  it('DELETE calls the guard only when a row actually exists (no-op clear is not guarded)', async () => {
    // No existing row → early return, guard must NOT run.
    upsertDefaultMock.mockResolvedValue(makeAgentRow(AGENT_ID))
    // loop-override DELETE reads `getDefault`; the mocked repo returns null by default.
    const { AiAgentRuntimeOverrideRepository } = await import('../../data/repositories/AiAgentRuntimeOverrideRepository')
    ;(AiAgentRuntimeOverrideRepository as unknown as jest.Mock).mockImplementation(() => ({
      getDefault: jest.fn(async () => null),
      upsertDefault: (...a: unknown[]) => upsertDefaultMock(...a),
      clearDefault: (...a: unknown[]) => clearDefaultMock(...a),
    }))
    const res = await loopDelete(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/loop-override', 'DELETE') as any, loopCtx())
    expect(res.status).toBe(200)
    expect(runRouteMutationGuards).not.toHaveBeenCalled()
  })

  it('DELETE guards the write when a row exists', async () => {
    const { AiAgentRuntimeOverrideRepository } = await import('../../data/repositories/AiAgentRuntimeOverrideRepository')
    ;(AiAgentRuntimeOverrideRepository as unknown as jest.Mock).mockImplementation(() => ({
      getDefault: jest.fn(async () => makeAgentRow(AGENT_ID)),
      upsertDefault: (...a: unknown[]) => upsertDefaultMock(...a),
      clearDefault: (...a: unknown[]) => clearDefaultMock(...a),
    }))
    await loopDelete(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/loop-override', 'DELETE') as any, loopCtx())
    expect(runRouteMutationGuards).toHaveBeenCalledTimes(1)
    expect(runRouteMutationGuards.mock.calls[0][0].input.operation).toBe('delete')
  })
})

// ============================================================================
// agents/[agentId]/mutation-policy — POST/DELETE
// ============================================================================
describe('ai_assistant mutation-policy — the D2-gap guard is really wired in', () => {
  it('POST calls the registry against ai_assistant.agent_override / <agent id>', async () => {
    const res = await policyPost(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/mutation-policy', 'POST', { mutationPolicy: 'read-only' }) as any, loopCtx())
    expect(res.status).toBe(200)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.agent_override')
    expect(arg.input.resourceId).toBe(AGENT_ID)
    expect(arg.input.operation).toBe('update')
    expect(policySetMock).toHaveBeenCalled()
    expect(ALLOW.runAfterSuccess).toHaveBeenCalledTimes(1)
  })

  it('POST: a blocked guard stops the mutation-policy write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await policyPost(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/mutation-policy', 'POST', { mutationPolicy: 'read-only' }) as any, loopCtx())
    expect(res.status).toBe(403)
    expect(policySetMock).not.toHaveBeenCalled()
  })

  it('DELETE calls the registry with operation delete', async () => {
    await policyDelete(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/mutation-policy', 'DELETE') as any, loopCtx())
    expect(runRouteMutationGuards.mock.calls[0][0].input.operation).toBe('delete')
    expect(policyClearMock).toHaveBeenCalled()
  })
})

// ============================================================================
// agents/[agentId]/prompt-override — POST
// ============================================================================
describe('ai_assistant prompt-override — the D2-gap guard is really wired in', () => {
  it('POST calls the registry against ai_assistant.agent_override / <agent id>', async () => {
    const res = await promptPost(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/prompt-override', 'POST', { sections: { intro: 'hi' } }) as any, loopCtx())
    expect(res.status).toBe(200)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.agent_override')
    expect(arg.input.resourceId).toBe(AGENT_ID)
    expect(arg.input.operation).toBe('update')
    expect(promptSaveMock).toHaveBeenCalled()
  })

  it('POST: a blocked guard stops the prompt-override write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await promptPost(req('http://x/api/ai_assistant/ai/agents/' + AGENT_ID + '/prompt-override', 'POST', { sections: { intro: 'hi' } }) as any, loopCtx())
    expect(res.status).toBe(403)
    expect(promptSaveMock).not.toHaveBeenCalled()
  })
})

// ============================================================================
// conversations — POST
// ============================================================================
describe('ai_assistant conversations — the D2-gap guard is really wired in', () => {
  it('POST calls the registry against ai_assistant.conversation with operation create', async () => {
    const res = await convPost(req('http://x/api/ai_assistant/ai/conversations', 'POST', { agentId: AGENT_ID, conversationId: 'c-1' }) as any)
    expect(res.status).toBe(201)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.conversation')
    expect(arg.input.resourceId).toBe('c-1')
    expect(arg.input.operation).toBe('create')
    expect(ALLOW.runAfterSuccess).toHaveBeenCalledTimes(1)
  })

  it('POST uses the "new" marker as resourceId when the caller supplies no conversationId', async () => {
    await convPost(req('http://x/api/ai_assistant/ai/conversations', 'POST', { agentId: AGENT_ID }) as any)
    expect(runRouteMutationGuards.mock.calls[0][0].input.resourceId).toBe('new')
  })

  it('POST: a blocked guard stops the conversation write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await convPost(req('http://x/api/ai_assistant/ai/conversations', 'POST', { agentId: AGENT_ID }) as any)
    expect(res.status).toBe(403)
    expect(storageMock.createOrGet).not.toHaveBeenCalled()
  })
})

// ============================================================================
// conversations/import — POST
// ============================================================================
describe('ai_assistant conversation import — the D2-gap guard is really wired in', () => {
  it('POST calls the registry against ai_assistant.conversation / <conversation id>', async () => {
    const res = await convImportPost(req('http://x/api/ai_assistant/ai/conversations/import', 'POST', { conversation: { conversationId: 'c-2', agentId: AGENT_ID }, messages: [{ role: 'user', content: 'hi' }] }) as any)
    expect(res.status).toBe(200)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.conversation')
    expect(arg.input.resourceId).toBe('c-2')
    expect(arg.input.operation).toBe('create')
    expect(storageMock.importLocalConversation).toHaveBeenCalled()
  })

  it('POST: a blocked guard stops the import write', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await convImportPost(req('http://x/api/ai_assistant/ai/conversations/import', 'POST', { conversation: { conversationId: 'c-2', agentId: AGENT_ID }, messages: [] }) as any)
    expect(res.status).toBe(403)
    expect(storageMock.importLocalConversation).not.toHaveBeenCalled()
  })
})

// ============================================================================
// conversations/[conversationId] — PATCH/DELETE
// ============================================================================
const convCtx = (conversationId = 'c-1') => ({ params: Promise.resolve({ conversationId }) })

describe('ai_assistant conversation item — the D2-gap guard is really wired in', () => {
  it('PATCH calls the registry against ai_assistant.conversation with operation update', async () => {
    const res = await convPatch(req('http://x/api/ai_assistant/ai/conversations/c-1', 'PATCH', { title: 'New title' }) as any, convCtx())
    expect(res.status).toBe(200)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.conversation')
    expect(arg.input.resourceId).toBe('c-1')
    expect(arg.input.operation).toBe('update')
    expect(storageMock.update).toHaveBeenCalled()
  })

  it('PATCH: a blocked guard stops the update', async () => {
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await convPatch(req('http://x/api/ai_assistant/ai/conversations/c-1', 'PATCH', { title: 'New title' }) as any, convCtx())
    expect(res.status).toBe(403)
    expect(storageMock.update).not.toHaveBeenCalled()
  })

  it('DELETE calls the registry with operation delete', async () => {
    await convDelete(req('http://x/api/ai_assistant/ai/conversations/c-1', 'DELETE') as any, convCtx())
    expect(runRouteMutationGuards.mock.calls[0][0].input.operation).toBe('delete')
    expect(storageMock.softDelete).toHaveBeenCalled()
  })
})

// ============================================================================
// conversations/[conversationId]/participants — POST
// ============================================================================
describe('ai_assistant conversation participants — the D2-gap guard is really wired in', () => {
  const validTarget = '11111111-1111-4111-8111-111111111111'

  it('POST calls the registry against ai_assistant.conversation with operation custom', async () => {
    // The route resolves the target user before the guard; stub it to a
    // same-tenant staff user so the route reaches the guard.
    findOneWithDecryptionMock.mockResolvedValue({ id: validTarget })
    const res = await participantsPost(req('http://x/api/ai_assistant/ai/conversations/c-1/participants', 'POST', { userId: validTarget, role: 'viewer' }) as any, convCtx())
    expect(res.status).toBe(201)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.conversation')
    expect(arg.input.resourceId).toBe('c-1')
    expect(arg.input.operation).toBe('custom')
    expect(storageMock.addParticipant).toHaveBeenCalled()
  })

  // ── CC-107 — the machine axis over HTTP ─────────────────────────────────────
  // An agent was never addressable before: the body required a uuid, and an agent
  // id is TEXT (`business_ir.query_author` style), so no schema would have
  // accepted it. `getAgent` is the REAL registry here, seeded above.
  it('POST accepts an agentId and writes the agent axis with the caller as owner', async () => {
    findOneWithDecryptionMock.mockResolvedValue(null)
    // the success body reads userId/role/createdAt off the row — a partial mock
    // throws on `.toISOString()` and surfaces as a 500, which is a test defect
    // masquerading as a product one.
    storageMock.addParticipant.mockResolvedValue({
      id: 'p-agent',
      agentId: AGENT_ID,
      agentOwnerUserId: 'u-owner',
      userId: null,
      role: 'viewer',
      createdAt: new Date('2026-10-17T00:00:00Z'),
    })
    const res = await participantsPost(
      req('http://x/api/ai_assistant/ai/conversations/c-1/participants', 'POST', {
        agentId: AGENT_ID,
        role: 'viewer',
      }) as any,
      convCtx(),
    )
    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      participant: { agentId: AGENT_ID, userId: null, role: 'viewer' },
    })
    // the caller is the human answerable for the agent participant
    expect(storageMock.addParticipant).toHaveBeenCalledWith(
      'c-1',
      { agentId: AGENT_ID, agentOwnerUserId: expect.any(String) },
      'viewer',
      expect.objectContaining({ canManageConversations: expect.anything() }),
    )
    // and the human-axis User lookup is NOT consulted for an agent
    expect(findOneWithDecryptionMock).not.toHaveBeenCalled()
  })

  it('POST refuses an agent that does not exist', async () => {
    const res = await participantsPost(
      req('http://x/api/ai_assistant/ai/conversations/c-1/participants', 'POST', {
        agentId: 'no.such.agent',
        role: 'viewer',
      }) as any,
      convCtx(),
    )
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ code: 'agent_not_found' })
    expect(storageMock.addParticipant).not.toHaveBeenCalled()
  })

  it('POST refuses a body naming BOTH axes', async () => {
    findOneWithDecryptionMock.mockResolvedValue({ id: validTarget })
    const res = await participantsPost(
      req('http://x/api/ai_assistant/ai/conversations/c-1/participants', 'POST', {
        userId: validTarget,
        agentId: AGENT_ID,
        role: 'viewer',
      }) as any,
      convCtx(),
    )
    expect(res.status).toBe(400)
    expect(storageMock.addParticipant).not.toHaveBeenCalled()
  })

  it('POST refuses a body naming NEITHER axis — by the identity guard, not a side effect', async () => {
    const res = await participantsPost(
      req('http://x/api/ai_assistant/ai/conversations/c-1/participants', 'POST', {
        role: 'viewer',
      }) as any,
      convCtx(),
    )
    // Assert the CODE, not merely "some 400". This reaches the route's FIRST
    // guard — the schema's `exactly one axis` refine — which is why the code is
    // `validation_error` and not the repository's `invalid_participant`. That
    // second guard is defence in depth and is proven directly in
    // `AiChatConversationRepository.test.ts`; asserting the specific code is what
    // makes this test fail if the refine is removed, instead of passing on a
    // `user_not_found` coincidence.
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ code: 'validation_error' })
    expect(storageMock.addParticipant).not.toHaveBeenCalled()
  })

  // ── CC-107 — the read half: GET must SERIALISE both axes ────────────────────
  // Every test above is POST-only, so before this one nothing proved an agent
  // participant could be *seen*. The route used to emit `userId` alone, which
  // renders an agent member as a row with a null user — indistinguishable from
  // a malformed human row, and unusable by a client that wants to show who
  // holds access.
  it('GET serialises BOTH axes, so an agent member is visible as an agent', async () => {
    storageMock.getById.mockResolvedValue({
      conversationId: 'c-1',
      ownerUserId: 'user-1',
      agentId: AGENT_ID,
      status: 'open',
      visibility: 'shared',
      createdAt: new Date('2026-10-17T00:00:00Z'),
      updatedAt: new Date('2026-10-17T00:00:00Z'),
    })
    storageMock.listParticipants.mockResolvedValue([
      {
        userId: 'user-2',
        agentId: null,
        role: 'viewer',
        lastReadAt: null,
        createdAt: new Date('2026-10-17T00:00:00Z'),
      },
      {
        userId: null,
        agentId: AGENT_ID,
        role: 'viewer',
        lastReadAt: null,
        createdAt: new Date('2026-10-17T00:01:00Z'),
      },
    ])

    const res = await participantsGet(
      req('http://x/api/ai_assistant/ai/conversations/c-1/participants', 'GET') as any,
      convCtx(),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { participants: Array<Record<string, unknown>> }
    expect(body.participants).toHaveLength(2)
    // The human row names a person and no machine.
    expect(body.participants[0]).toMatchObject({ userId: 'user-2', agentId: null })
    // The agent row names a machine and no person — `agentId` is PRESENT and
    // non-null, which is the whole assertion: `userId: null` alone cannot say
    // whether this row is a bot or a broken person.
    expect(body.participants[1]).toMatchObject({ userId: null, agentId: AGENT_ID })
  })
})

// ============================================================================
// conversations/[conversationId]/participants/[userId] — DELETE
// ============================================================================
describe('ai_assistant revoke participant — the D2-gap guard is really wired in', () => {
  it('DELETE calls the registry against ai_assistant.conversation with operation custom', async () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    const res = await participantDelete(req('http://x/api/ai_assistant/ai/conversations/c-1/participants/' + userId, 'DELETE') as any, { params: Promise.resolve({ conversationId: 'c-1', userId }) })
    expect(res.status).toBe(204)
    const arg = runRouteMutationGuards.mock.calls[0][0]
    expect(arg.input.resourceKind).toBe('ai_assistant.conversation')
    expect(arg.input.resourceId).toBe('c-1')
    expect(arg.input.operation).toBe('custom')
    expect(storageMock.revokeParticipant).toHaveBeenCalled()
  })

  it('DELETE: a blocked guard stops the revoke', async () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    runRouteMutationGuards.mockResolvedValueOnce({ ok: false, errorBody: { error: 'no' }, errorStatus: 403 })
    const res = await participantDelete(req('http://x/api/ai_assistant/ai/conversations/c-1/participants/' + userId, 'DELETE') as any, { params: Promise.resolve({ conversationId: 'c-1', userId }) })
    expect(res.status).toBe(403)
    expect(storageMock.revokeParticipant).not.toHaveBeenCalled()
  })
})

// ============================================================================
// NEGATIVES — the class-(b)/(c) set-aside routes must NOT reach the guard
// ============================================================================
describe('set-aside routes never reach the D2-gap guard', () => {
  it('ai/chat POST is a session/flow route — the registry guard is not called', async () => {
    // A bad body makes the route 400 before any work; the point of the
    // assertion is only that no structural guard ran on this route.
    await chatPost(req('http://x/api/ai_assistant/ai/chat', 'POST', {}) as any).catch(() => undefined)
    expect(runRouteMutationGuards).not.toHaveBeenCalled()
  })

  it('ai/actions/[id]/confirm POST is the pending-action approval gate — the registry guard is not called', async () => {
    const ctx = { params: Promise.resolve({ id: 'action-1' }) }
    // Whether it 400s (unknown action) or 500s, the point is that the generic
    // structural guard is not the mechanism on this route — the approval gate is.
    await confirmPost(req('http://x/api/ai_assistant/ai/actions/action-1/confirm', 'POST', {}) as any, ctx).catch(() => undefined)
    expect(runRouteMutationGuards).not.toHaveBeenCalled()
  })

  it('ai/actions/[id]/cancel POST is the pending-action gate — the registry guard is not called', async () => {
    const ctx = { params: Promise.resolve({ id: 'action-1' }) }
    await cancelPost(req('http://x/api/ai_assistant/ai/actions/action-1/cancel', 'POST', {}) as any, ctx).catch(() => undefined)
    expect(runRouteMutationGuards).not.toHaveBeenCalled()
  })
})
