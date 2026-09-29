// SPDX-License-Identifier: GPL-3.0
//
// Thin wrapper kept for backwards compatibility: scenarios and the entry
// server only know about `createHandler`. Behind the scenes we now route
// every request through the spec-driven router, with scenarios providing
// per-operationId overrides for the data they actually care about.

import { createSpecHandler, FALLTHROUGH } from './specRouter.js';

export const createHandler = (scenario) => createSpecHandler(scenario);

export { FALLTHROUGH };
