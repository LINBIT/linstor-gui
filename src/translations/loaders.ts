// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type { i18n as I18n } from 'i18next';

type Bundle = Record<string, Record<string, unknown>>;

// English ships in the entry chunk because it is the fallback language. Every
// other language is its own chunk, fetched the first time someone picks it.
const loaders: Record<string, () => Promise<{ default: Bundle }>> = {
  de: () => import('./german'),
  zh: () => import('./chinese'),
  ja: () => import('./japanese'),
  tr: () => import('./turkish'),
  es: () => import('./spanish'),
  fr: () => import('./french'),
  ru: () => import('./russian'),
};

// Registers the language's namespaces before the switch, so the UI never
// renders a half-translated frame of English fallbacks. import() caches the
// module, so switching back and forth fetches each language only once.
export async function changeLanguage(i18n: I18n, lng: string): Promise<void> {
  const load = loaders[lng];
  if (load) {
    const { default: bundle } = await load();
    for (const [ns, resources] of Object.entries(bundle)) {
      i18n.addResourceBundle(lng, ns, resources, true, true);
    }
  }
  await i18n.changeLanguage(lng);
}
