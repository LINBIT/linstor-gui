import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CLUSTER_SETUP_DISMISSED_KEY, getDismissed, setDismissed } from '../dismiss';

describe('clusterSetup dismiss helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exports the storage key', () => {
    expect(CLUSTER_SETUP_DISMISSED_KEY).toBe('LINSTOR_GUI_CLUSTER_SETUP_DISMISSED');
  });

  it('returns false when nothing has been stored', () => {
    expect(getDismissed()).toBe(false);
  });

  it('returns true after setDismissed(true)', () => {
    setDismissed(true);
    expect(window.localStorage.getItem(CLUSTER_SETUP_DISMISSED_KEY)).toBe('true');
    expect(getDismissed()).toBe(true);
  });

  it('clears the flag when setDismissed(false) is called', () => {
    setDismissed(true);
    setDismissed(false);
    expect(window.localStorage.getItem(CLUSTER_SETUP_DISMISSED_KEY)).toBeNull();
    expect(getDismissed()).toBe(false);
  });

  it('treats unavailable storage as not dismissed, and ignores writes to it', () => {
    // Some privacy modes throw on any localStorage access.
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(getDismissed()).toBe(false);
    expect(() => setDismissed(true)).not.toThrow();

    get.mockRestore();
    set.mockRestore();
  });
});
