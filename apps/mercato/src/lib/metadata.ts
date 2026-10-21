import type { Metadata } from 'next'
import { resolveTranslations } from '@open-mercato/shared/lib/i18n/server'

export async function resolveLocalizedAppMetadata(): Promise<Metadata> {
  const { t } = await resolveTranslations()
  // The dictionary is the source of truth; the fallback fires only when the key
  // is missing (a locale whose dictionary failed to load). CC-153: it used to
  // carry upstream's "modular ERP foundation" positioning, so resurrecting this
  // helper would have shipped a description the product deliberately dropped.
  return {
    title: t('app.metadata.title', 'Companai'),
    description: t(
      'app.metadata.description',
      'One organisation, one task model, one authority system — for people and AI workers alike.',
    ),
  }
}

export async function resolveLocalizedTitleMetadata(input: {
  title?: string | null
  titleKey?: string | null
  fallback?: string
}): Promise<Metadata> {
  const { t } = await resolveTranslations()
  const fallbackTitle = input.title || input.fallback || 'Companai'
  return {
    title: input.titleKey ? t(input.titleKey, fallbackTitle) : fallbackTitle,
  }
}
