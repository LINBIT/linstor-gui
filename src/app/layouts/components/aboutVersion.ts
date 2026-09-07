// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

/** The UI version baked in at build time. `make build` without VERSION writes
 *  an empty VITE_VERSION, which must read as a dev build, not as nothing. */
export const uiVersion = (value: string | undefined): string => (value && value.trim()) || 'DEV';

/** The LINBIT SDS product version, when the build set one; null otherwise. */
export const linbitSdsVersion = (value: string | undefined): string | null => (value && value.trim()) || null;
