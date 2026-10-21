import type { Metadata } from 'next'
import './globals.css'
import '@/lib/i18n/register-dictionary-loader'
import { AppProviders } from '@/components/AppProviders'

import { detectLocale, loadDictionary } from '@open-mercato/shared/lib/i18n/server'
import { resolveForcedLocale } from '@open-mercato/shared/lib/i18n/locale'
import { resolveTextDirection } from '@open-mercato/shared/lib/i18n/direction'

// CC-153: the description follows the locale. A static `metadata` export is
// evaluated once, with no request context, so `meta[name="description"]` carried
// the English text into every locale — visible only once the example module's
// specs finally ran (TC-APP-001 expects the de string). `generateMetadata` runs
// per request after `detectLocale`, exactly like the `html lang` attribute the
// RootLayout below already resolves per request.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale()
  const dict = await loadDictionary(locale)
  return {
    title: 'Companai',
    // Not upstream's "modular ERP foundation" — that describes a different
    // product. Companai is an operating platform where people and AI workers act
    // under one org model, one task model and one authority system. The en
    // dictionary carries this line (the other locales still carry upstream's
    // wording — see register row CC-153); the fallback covers a dictionary that
    // has not loaded.
    description: dict['app.metadata.description']
      ?? 'One organisation, one task model, one authority system — for people and AI workers alike.',
    icons: {
      // The SVG is the master and what modern browsers use. The `.ico` is the
      // fallback for the places that still insist on one — older browsers, some
      // bookmark and feed readers.
      icon: [
        { url: '/companai.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await detectLocale()
  // Decided here rather than left to the browser: given `lang="ar"` and no
  // `dir`, a browser renders Arabic left-to-right without erroring -- the
  // letters right, the layout inside out, and nothing to notice.
  const direction = resolveTextDirection(locale)
  const dict = await loadDictionary(locale)
  const localeLocked = resolveForcedLocale(process.env) !== null
  const noticeBarsEnabled = process.env.OM_INTEGRATION_TEST !== 'true'
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <script
          key="om-theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('om-theme');
                  var theme = stored === 'dark' ? 'dark'
                    : stored === 'light' ? 'light'
                    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  if (theme === 'dark') document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning data-gramm="false">
        <AppProviders locale={locale} dict={dict} localeLocked={localeLocked} noticeBarsEnabled={noticeBarsEnabled}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
