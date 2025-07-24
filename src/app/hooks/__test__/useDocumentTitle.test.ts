// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDocumentTitle } from '../useDocumentTitle';

describe('useDocumentTitle', () => {
  let originalTitle: string;

  beforeEach(() => {
    // Store the original document title
    originalTitle = document.title;
  });

  afterEach(() => {
    // Restore the original document title
    document.title = originalTitle;
  });

  it('should set the document title on mount', () => {
    const testTitle = 'Test Page Title';

    renderHook(() => useDocumentTitle(testTitle));

    expect(document.title).toBe(testTitle);
  });

  it('should update document title when title prop changes', () => {
    const initialTitle = 'Initial Title';
    const updatedTitle = 'Updated Title';

    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), { initialProps: { title: initialTitle } });

    expect(document.title).toBe(initialTitle);

    rerender({ title: updatedTitle });

    expect(document.title).toBe(updatedTitle);
  });

  it('should restore original title on unmount', () => {
    const testTitle = 'Test Title';

    const { unmount } = renderHook(() => useDocumentTitle(testTitle));

    expect(document.title).toBe(testTitle);

    unmount();

    expect(document.title).toBe(originalTitle);
  });

  it('should handle empty string title', () => {
    const emptyTitle = '';

    renderHook(() => useDocumentTitle(emptyTitle));

    expect(document.title).toBe(emptyTitle);
  });

  it('should handle special characters in title', () => {
    const specialTitle = 'Test & Title - Special <chars>';

    renderHook(() => useDocumentTitle(specialTitle));

    expect(document.title).toBe(specialTitle);
  });

  it('should handle multiple hook instances correctly', () => {
    const originalTitle = document.title;

    // First hook instance
    const { unmount: unmountFirst } = renderHook(() => useDocumentTitle('First Hook Title'));
    expect(document.title).toBe('First Hook Title');

    // Second hook instance (should override first)
    const { unmount: unmountSecond } = renderHook(() => useDocumentTitle('Second Hook Title'));
    expect(document.title).toBe('Second Hook Title');

    // Unmount second hook first - it should restore the title that was present when it mounted
    // which was 'First Hook Title'
    unmountSecond();
    expect(document.title).toBe('First Hook Title');

    // Unmount first hook - it should restore the original title
    unmountFirst();
    expect(document.title).toBe(originalTitle);
  });

  it('should restore correct title when multiple hooks are nested', () => {
    const firstTitle = 'First Title';
    const secondTitle = 'Second Title';

    // Set first title
    const { unmount: unmountFirst } = renderHook(() => useDocumentTitle(firstTitle));
    expect(document.title).toBe(firstTitle);

    // Set second title while first is still active
    const { unmount: unmountSecond } = renderHook(() => useDocumentTitle(secondTitle));
    expect(document.title).toBe(secondTitle);

    // Unmount second - should restore to first title
    unmountSecond();
    expect(document.title).toBe(firstTitle);

    // Unmount first - should restore to original
    unmountFirst();
    expect(document.title).toBe(originalTitle);
  });

  it('should work with dynamic title updates', () => {
    let titleCounter = 1;
    const getTitle = () => `Dynamic Title ${titleCounter}`;

    const { rerender } = renderHook(() => useDocumentTitle(getTitle()));

    expect(document.title).toBe('Dynamic Title 1');

    titleCounter = 2;
    rerender();

    expect(document.title).toBe('Dynamic Title 2');

    titleCounter = 3;
    rerender();

    expect(document.title).toBe('Dynamic Title 3');
  });
});
