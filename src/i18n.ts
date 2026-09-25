// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/english';

// Only English is bundled; translations/loaders.ts fetches the others.
i18n.use(initReactI18next).init({
  resources: { en },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
