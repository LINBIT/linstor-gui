// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import type React from 'react';
import { useRef, useState } from 'react';

/** Width of the editor pane next to the preview, dragged by the handle between them. */
export function useSplitPane() {
  // Split pane state for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [_isDragging, setIsDragging] = useState(false);
  const activeContainerRef = useRef<HTMLElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(50);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    activeContainerRef.current = e.currentTarget.parentElement as HTMLElement;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle drag move
  const handleMouseMove = (e: MouseEvent) => {
    if (!activeContainerRef.current) return;

    const containerRect = activeContainerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;

    let newWidth = startWidthRef.current + deltaPercent;
    newWidth = Math.max(20, Math.min(80, newWidth));

    setLeftPanelWidth(newWidth);
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
    activeContainerRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return { leftPanelWidth, handleMouseDown };
}
