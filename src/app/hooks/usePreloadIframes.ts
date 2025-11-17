// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { useEffect } from 'react';

/**
 * Hook to preload iframe sources
 * This helps improve iframe loading performance by:
 * 1. Preconnecting to the domain
 * 2. Optionally prefetching the URL
 */
export const usePreloadIframes = (urls: string[], options?: { prefetch?: boolean }) => {
  useEffect(() => {
    if (!urls || urls.length === 0) return;

    const links: HTMLLinkElement[] = [];

    urls.forEach((url) => {
      try {
        const urlObj = new URL(url);
        const origin = urlObj.origin;

        // Add preconnect for the domain
        const preconnectLink = document.createElement('link');
        preconnectLink.rel = 'preconnect';
        preconnectLink.href = origin;
        preconnectLink.crossOrigin = 'anonymous';
        document.head.appendChild(preconnectLink);
        links.push(preconnectLink);

        // Optionally add prefetch for the specific URL
        if (options?.prefetch) {
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = url;
          prefetchLink.as = 'document';
          document.head.appendChild(prefetchLink);
          links.push(prefetchLink);
        }
      } catch (error) {
        console.warn('Failed to preload iframe URL:', url, error);
      }
    });

    // Cleanup function to remove the links when component unmounts
    return () => {
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [urls, options?.prefetch]);
};

/**
 * Preconnect to Grafana server on app initialization
 * Call this in your main App component or layout
 */
export const preconnectToGrafana = (grafanaUrl: string) => {
  if (!grafanaUrl) return;

  try {
    const urlObj = new URL(grafanaUrl);
    const origin = urlObj.origin;

    // Check if preconnect already exists
    const existingLink = document.querySelector(`link[rel="preconnect"][href="${origin}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Also add dns-prefetch as a fallback for older browsers
    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = origin;
    document.head.appendChild(dnsLink);
  } catch (error) {
    console.warn('Failed to preconnect to Grafana:', error);
  }
};
