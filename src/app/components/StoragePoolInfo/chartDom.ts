// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

// Reads and marks the SVG apexcharts renders: where each node's bars sit (the
// hover regions) and which segments, series and axis labels are highlighted.

import {
  HOVERED_NODE_SEGMENT_CLASS,
  HOVERED_SEGMENT_CLASS,
  HOVERED_SERIES_SEGMENT_CLASS,
  HOVERED_XAXIS_LABEL_CLASS,
  NODE_OVERLAY_HORIZONTAL_INSET,
  NODE_OVERLAY_MAX_WIDTH,
  NODE_OVERLAY_MIN_WIDTH,
  NODE_OVERLAY_TOP_PADDING,
} from './constants';
import type { HoveredNode } from './types';

export const buildHoveredNodes = (containerElement: HTMLDivElement | null, nodeNames: string[]): HoveredNode[] => {
  if (!containerElement || nodeNames.length === 0) {
    return [];
  }

  const chartRoot = containerElement.querySelector('.apexcharts-canvas');
  if (!chartRoot || !containerElement) {
    return [];
  }

  const containerRect = containerElement.getBoundingClientRect();
  const plotRect = chartRoot.querySelector('.apexcharts-grid')?.getBoundingClientRect();
  const canvasRect = chartRoot.getBoundingClientRect();
  const xAxisLabels = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text');

  if (!plotRect || !canvasRect) {
    return [];
  }

  const plotLeft = plotRect.left - containerRect.left;
  const plotRight = plotRect.right - containerRect.left;
  const plotTop = plotRect.top - containerRect.top;
  const plotWidth = plotRect.width;

  const xAxisTextElements = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text');
  const xAxisTextsBottom =
    xAxisTextElements.length > 0
      ? Math.max(...Array.from(xAxisTextElements).map((el) => el.getBoundingClientRect().bottom - containerRect.top))
      : canvasRect.bottom - containerRect.top;
  const canvasBottom = xAxisTextsBottom + 20;
  const fallbackStep = plotWidth / nodeNames.length;
  const seriesElements = chartRoot.querySelectorAll('.apexcharts-bar-series .apexcharts-series');
  const overlayMinWidth = Math.min(
    NODE_OVERLAY_MAX_WIDTH,
    Math.max(NODE_OVERLAY_MIN_WIDTH, plotWidth / Math.max(nodeNames.length, 1) - 40),
  );

  const centers = nodeNames.map((_, index) => {
    const segmentRects = Array.from(seriesElements)
      .map((seriesElement) => seriesElement.querySelectorAll('path')[index]?.getBoundingClientRect())
      .filter((rect): rect is DOMRect => Boolean(rect) && rect.width > 0);

    if (segmentRects.length > 0) {
      const left = Math.min(...segmentRects.map((rect) => rect.left - containerRect.left));
      const right = Math.max(...segmentRects.map((rect) => rect.right - containerRect.left));
      return (left + right) / 2;
    }

    const labelRect = xAxisLabels[index]?.getBoundingClientRect();
    if (labelRect) {
      return labelRect.left - containerRect.left + labelRect.width / 2;
    }

    return plotLeft + fallbackStep * index + fallbackStep / 2;
  });

  return nodeNames.map((nodeName, index) => {
    const currentCenter = centers[index];
    const previousCenter = centers[index - 1] ?? plotLeft;
    const nextCenter = centers[index + 1] ?? plotRight;
    const rawLeft = index === 0 ? plotLeft : (previousCenter + currentCenter) / 2;
    const rawRight = index === nodeNames.length - 1 ? plotRight : (currentCenter + nextCenter) / 2;
    const preferredWidth = Math.min(
      Math.max(rawRight - rawLeft - NODE_OVERLAY_HORIZONTAL_INSET * 2, overlayMinWidth),
      NODE_OVERLAY_MAX_WIDTH,
    );
    const maxLeft = Math.max(plotRight - preferredWidth, plotLeft);
    const left = Math.min(Math.max(currentCenter - preferredWidth / 2, plotLeft), maxLeft);
    const width = preferredWidth;
    const height = canvasBottom - plotTop;

    return {
      index,
      name: nodeName,
      left,
      top: Math.max(plotTop - NODE_OVERLAY_TOP_PADDING, 0),
      width,
      height,
    };
  });
};

const findSeriesElementByIndex = (root: ParentNode | null | undefined, seriesIndex: number): Element | null => {
  if (!root) {
    return null;
  }

  return (
    Array.from(root.querySelectorAll('.apexcharts-bar-series .apexcharts-series')).find((seriesElement) => {
      return (
        seriesElement.getAttribute('data:realIndex') === String(seriesIndex) ||
        seriesElement.getAttribute('data-realIndex') === String(seriesIndex)
      );
    }) || null
  );
};

export const setHoveredNodeSegmentsState = (
  containerElement: HTMLDivElement | null,
  dataPointIndex: number,
  hovered: boolean,
) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  chartRoot.querySelectorAll('.apexcharts-bar-series .apexcharts-series').forEach((seriesElement) => {
    const segment = seriesElement.querySelectorAll('path')[dataPointIndex];
    if (!segment) {
      return;
    }

    segment.classList.toggle(HOVERED_NODE_SEGMENT_CLASS, hovered);
  });
};

export const setHoveredXAxisLabelState = (
  containerElement: HTMLDivElement | null,
  dataPointIndex: number,
  hovered: boolean,
) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  const label = chartRoot.querySelectorAll('.apexcharts-xaxis-texts-g text')[dataPointIndex];
  if (!label) {
    return;
  }

  label.classList.toggle(HOVERED_XAXIS_LABEL_CLASS, hovered);
};

export const setHoveredSeriesState = (
  containerElement: HTMLDivElement | null,
  seriesIndex: number,
  hovered: boolean,
  nodeIndex?: number | null,
) => {
  const chartRoot = containerElement?.querySelector('.apexcharts-canvas');
  if (!chartRoot) {
    return;
  }

  const seriesElement = findSeriesElementByIndex(chartRoot, seriesIndex);
  if (!seriesElement) {
    return;
  }

  seriesElement.querySelectorAll('path').forEach((segment, index) => {
    const shouldHighlight = hovered && (nodeIndex === undefined || nodeIndex === null || index === nodeIndex);
    segment.classList.toggle(HOVERED_SERIES_SEGMENT_CLASS, shouldHighlight);
  });
};

export const setHoveredSegmentState = (
  // The ApexCharts instance an event hands over; only its root element is used.
  chartContext: unknown,
  seriesIndex: number,
  dataPointIndex: number,
  hovered: boolean,
) => {
  const chartRoot = (chartContext as { el?: Element | null } | undefined)?.el;
  if (!chartRoot) {
    return;
  }

  const seriesElement = findSeriesElementByIndex(chartRoot, seriesIndex);
  const segment = seriesElement?.querySelectorAll('path')[dataPointIndex];

  if (!segment) {
    return;
  }

  segment.classList.toggle(HOVERED_SEGMENT_CLASS, hovered);
};
