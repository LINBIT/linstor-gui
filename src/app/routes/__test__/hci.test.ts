// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { matchPath } from 'react-router-dom';

import hci from '../hci';

const navigationSource = readFileSync(
  join(process.cwd(), 'src', 'app', 'layouts', 'components', 'Navigation.tsx'),
  'utf8',
);

describe('HCI routes', () => {
  // HCI mode mounts only these routes, so every page its sidebar links to must be here
  it('cover every page the HCI sidebar links to', () => {
    const links = [...navigationSource.matchAll(/to="(\/hci\/[^"]*)"/g)].map((m) => m[1]);
    expect(links).toContain('/hci/files');

    const missing = links.filter((link) => !hci.some((route) => matchPath(route.path, link)));
    expect(missing).toEqual([]);
  });

  it('include the Files list and its create page', () => {
    expect(hci.map((route) => route.path)).toEqual(expect.arrayContaining(['/hci/files', '/hci/files/create']));
  });
});
