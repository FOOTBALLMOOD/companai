/**
 * @jest-environment node
 */

import * as React from 'react'
import type { ReactElement, ReactNode } from 'react'

jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'geist-sans' }),
  Geist_Mono: () => ({ variable: 'geist-mono' }),
}))

jest.mock('../globals.css', () => ({}))

jest.mock('@/bootstrap', () => ({
  bootstrap: jest.fn(),
}))

// CC-153: the metadata description comes from the dictionary of the locale the
// request resolved. It used to be a static `metadata` export — evaluated once,
// with no request context — so the English text went to every locale. The first
// thing that looked was TC-APP-001's German run: it asserts the de string and
// got English back. These tests hold the per-request behaviour in place; the
// holder lets each test choose the locale and the dictionary it resolves.
const mockI18n = {
  locale: 'en',
  dictionary: { common: 'value' } as Record<string, unknown>,
}

jest.mock('@open-mercato/shared/lib/i18n/server', () => ({
  registerAppDictionaryLoader: jest.fn(),
  detectLocale: jest.fn(async () => mockI18n.locale),
  loadDictionary: jest.fn(async () => mockI18n.dictionary),
}))

jest.mock('@/components/AppProviders', () => ({
  AppProviders: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) =>
    React.createElement('app-providers', { ...props }, children),
}))

function findElementByType(node: ReactNode, targetType: unknown): ReactElement | null {
  if (!node || typeof node !== 'object') {
    return null
  }

  const element = node as ReactElement<{ children?: ReactNode }>
  if (element.type === targetType) {
    return element
  }

  const children = element.props?.children
  if (Array.isArray(children)) {
    for (const child of children) {
      const match = findElementByType(child, targetType)
      if (match) {
        return match
      }
    }
    return null
  }

  return findElementByType(children, targetType)
}

describe('RootLayout', () => {
  const originalDemoMode = process.env.DEMO_MODE
  const originalIntegrationFlag = process.env.OM_INTEGRATION_TEST

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE
    } else {
      process.env.DEMO_MODE = originalDemoMode
    }

    if (originalIntegrationFlag === undefined) {
      delete process.env.OM_INTEGRATION_TEST
    } else {
      process.env.OM_INTEGRATION_TEST = originalIntegrationFlag
    }

    jest.resetModules()
  })

  it('disables notice bars when OM_INTEGRATION_TEST is true', async () => {
    process.env.DEMO_MODE = 'true'
    process.env.OM_INTEGRATION_TEST = 'true'

    const { default: RootLayout } = await import('../layout')
    const { AppProviders } = await import('@/components/AppProviders')
    const tree = await RootLayout({ children: 'child' })
    const appProviders = findElementByType(tree, AppProviders)

    expect(appProviders).not.toBeNull()
    expect(appProviders?.props.noticeBarsEnabled).toBe(false)
  })

  it('keeps notice bars enabled outside integration mode', async () => {
    process.env.DEMO_MODE = 'false'
    delete process.env.OM_INTEGRATION_TEST

    const { default: RootLayout } = await import('../layout')
    const { AppProviders } = await import('@/components/AppProviders')
    const tree = await RootLayout({ children: 'child' })
    const appProviders = findElementByType(tree, AppProviders)

    expect(appProviders).not.toBeNull()
    expect(appProviders?.props.noticeBarsEnabled).toBe(true)
  })
})

describe('app metadata (CC-153)', () => {
  const COMPANAI_DESCRIPTION =
    'One organisation, one task model, one authority system — for people and AI workers alike.'
  // The exact string TC-APP-001 asserts against the de dictionary, written here
  // so a dictionary edit that breaks the spec turns this suite red first. The
  // string is the owner-approved German translation of the Companai line.
  const GERMAN_DESCRIPTION = 'Eine Organisation, ein Aufgabenmodell, ein Berechtigungssystem, für Menschen und KI-Mitarbeiter gleichermaßen.'

  afterEach(() => {
    mockI18n.locale = 'en'
    mockI18n.dictionary = { common: 'value' }
  })

  it('exports no static metadata — a static export freezes the description at build time', async () => {
    const layout = (await import('../layout')) as Record<string, unknown>

    expect(layout.metadata).toBeUndefined()
    expect(typeof layout.generateMetadata).toBe('function')
  })

  it('describes the app in the locale the request resolved', async () => {
    mockI18n.locale = 'de'
    mockI18n.dictionary = { 'app.metadata.description': GERMAN_DESCRIPTION }

    const { generateMetadata } = await import('../layout')
    const metadata = await generateMetadata()

    expect(metadata.description).toBe(GERMAN_DESCRIPTION)
    expect(metadata.title).toBe('Companai')
    expect(metadata.icons).toEqual({
      icon: [
        { url: '/companai.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
    })
  })

  it('falls back to the Companai line when the dictionary carries no description', async () => {
    mockI18n.locale = 'de'
    mockI18n.dictionary = {}

    const { generateMetadata } = await import('../layout')
    const metadata = await generateMetadata()

    expect(metadata.description).toBe(COMPANAI_DESCRIPTION)
  })
})
