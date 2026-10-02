// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useCallback, useEffect, useState } from 'react';

/** Whether the live preview shows; the host may control it and hears every toggle. */
export function usePreviewToggle(externalShowPreview?: boolean, onPreviewChange?: (show: boolean) => void) {
  // Preview visibility state (default hidden)
  const [previewVisible, setPreviewVisible] = useState(false);

  // Toggle preview visibility
  const togglePreview = useCallback(() => {
    setPreviewVisible((prev) => {
      const newValue = !prev;
      onPreviewChange?.(newValue);
      return newValue;
    });
  }, [onPreviewChange]);

  // Sync external showPreview prop
  useEffect(() => {
    if (externalShowPreview !== undefined) {
      setPreviewVisible(externalShowPreview);
    }
  }, [externalShowPreview]);

  return { previewVisible, togglePreview };
}
