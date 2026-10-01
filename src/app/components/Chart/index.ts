// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// react-apexcharts' default entry brings every apexcharts chart type and
// feature (~940 kB). The core entry starts bare; register what the GUI draws:
// bar and pie charts, their legends, and keyboard navigation of the series.
import 'apexcharts/bar';
import 'apexcharts/pie';
import 'apexcharts/features/legend';
import 'apexcharts/features/keyboard';

export { default } from 'react-apexcharts/core';
