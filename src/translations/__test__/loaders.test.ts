// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';

import en from '../english';
import de from '../german';
import { changeLanguage } from '../loaders';

const freshI18n = async () => {
  const i18n = createInstance();
  await i18n.init({ resources: { en }, lng: 'en', fallbackLng: 'en' });
  return i18n;
};

describe('changeLanguage', () => {
  it('registers every namespace of a lazily loaded language before switching', async () => {
    const i18n = await freshI18n();
    expect(i18n.hasResourceBundle('de', 'common')).toBe(false);

    await changeLanguage(i18n, 'de');

    expect(i18n.language).toBe('de');
    for (const ns of Object.keys(de)) {
      expect(i18n.hasResourceBundle('de', ns)).toBe(true);
    }
    expect(i18n.t('common:preview')).toBe(de.common.preview);
  });

  it('switches back to the bundled English without loading anything', async () => {
    const i18n = await freshI18n();
    await changeLanguage(i18n, 'de');

    await changeLanguage(i18n, 'en');

    expect(i18n.language).toBe('en');
    expect(i18n.t('common:preview')).toBe(en.common.preview);
  });
});
