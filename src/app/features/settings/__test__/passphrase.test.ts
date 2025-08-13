// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock requests module
vi.mock('@app/features/requests', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}));

// Import mocked modules and functions
import { get, post, put, patch } from '@app/features/requests';
import { getPassphraseStatus, createPassphrase, editPassphrase, enterPassPhrase } from '../passphrase';

// Mock data
const mockPassphraseStatus = {
  data: {
    is_set: true,
    is_entered: false,
  },
};

const mockSuccessResponse = {
  data: {
    success: true,
    message: 'Operation completed successfully',
  },
};

const mockErrorResponse = {
  error: 'Invalid passphrase',
  code: 400,
};

describe('Passphrase API Functions', () => {
  let mockGet: any;
  let mockPost: any;
  let mockPut: any;
  let mockPatch: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockGet = vi.mocked(get);
    mockPost = vi.mocked(post);
    mockPut = vi.mocked(put);
    mockPatch = vi.mocked(patch);

    // Setup default mock implementations
    mockGet.mockResolvedValue(mockPassphraseStatus);
    mockPost.mockResolvedValue(mockSuccessResponse);
    mockPut.mockResolvedValue(mockSuccessResponse);
    mockPatch.mockResolvedValue(mockSuccessResponse);
  });

  describe('getPassphraseStatus', () => {
    it('should call GET endpoint with correct path', async () => {
      await getPassphraseStatus();
      expect(mockGet).toHaveBeenCalledWith('/v1/encryption/passphrase');
    });

    it('should return passphrase status data', async () => {
      const result = await getPassphraseStatus();
      expect(result).toEqual(mockPassphraseStatus);
    });

    it('should handle API errors gracefully', async () => {
      mockGet.mockRejectedValue(mockErrorResponse);

      try {
        await getPassphraseStatus();
      } catch (error) {
        expect(error).toEqual(mockErrorResponse);
      }

      expect(mockGet).toHaveBeenCalledWith('/v1/encryption/passphrase');
    });

    it('should handle different passphrase states', async () => {
      const states = [
        { is_set: false, is_entered: false }, // No passphrase set
        { is_set: true, is_entered: false }, // Set but not entered
        { is_set: true, is_entered: true }, // Set and entered
      ];

      for (const state of states) {
        mockGet.mockResolvedValue({ data: state });
        const result = await getPassphraseStatus();
        expect(result.data).toEqual(state);
      }
    });
  });

  describe('createPassphrase', () => {
    it('should call POST endpoint with correct path and body', async () => {
      const passphrase = 'new-secure-passphrase';
      await createPassphrase(passphrase);

      expect(mockPost).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: passphrase,
        },
      });
    });

    it('should handle successful passphrase creation', async () => {
      const passphrase = 'secure-passphrase-123';
      const result = await createPassphrase(passphrase);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockPost).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: passphrase,
        },
      });
    });

    it('should handle creation errors', async () => {
      const passphrase = 'weak-pass';
      mockPost.mockRejectedValue({ error: 'Passphrase too weak' });

      try {
        await createPassphrase(passphrase);
      } catch (error) {
        expect(error).toEqual({ error: 'Passphrase too weak' });
      }
    });

    it('should handle empty passphrase', async () => {
      const passphrase = '';
      await createPassphrase(passphrase);

      expect(mockPost).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: '',
        },
      });
    });

    it('should handle special characters in passphrase', async () => {
      const passphrase = 'P@$$w0rd!@#$%^&*()';
      await createPassphrase(passphrase);

      expect(mockPost).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: passphrase,
        },
      });
    });
  });

  describe('editPassphrase', () => {
    it('should call PUT endpoint with correct path and body', async () => {
      const newPassphrase = 'updated-passphrase';
      const oldPassphrase = 'old-passphrase';

      await editPassphrase(newPassphrase, oldPassphrase);

      expect(mockPut).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: newPassphrase,
          old_passphrase: oldPassphrase,
        },
      });
    });

    it('should handle successful passphrase update', async () => {
      const newPassphrase = 'new-secure-passphrase';
      const oldPassphrase = 'old-passphrase';

      const result = await editPassphrase(newPassphrase, oldPassphrase);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockPut).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: newPassphrase,
          old_passphrase: oldPassphrase,
        },
      });
    });

    it('should handle incorrect old passphrase', async () => {
      const newPassphrase = 'new-passphrase';
      const oldPassphrase = 'wrong-old-passphrase';

      mockPut.mockRejectedValue({ error: 'Invalid old passphrase' });

      try {
        await editPassphrase(newPassphrase, oldPassphrase);
      } catch (error) {
        expect(error).toEqual({ error: 'Invalid old passphrase' });
      }
    });

    it('should handle same old and new passphrase', async () => {
      const passphrase = 'same-passphrase';

      await editPassphrase(passphrase, passphrase);

      expect(mockPut).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: passphrase,
          old_passphrase: passphrase,
        },
      });
    });

    it('should handle empty passphrases', async () => {
      await editPassphrase('', '');

      expect(mockPut).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: '',
          old_passphrase: '',
        },
      });
    });
  });

  describe('enterPassPhrase', () => {
    it('should call PATCH endpoint with correct path and body', async () => {
      const passphrase = 'unlock-passphrase';
      await enterPassPhrase(passphrase);

      expect(mockPatch).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: passphrase,
      });
    });

    it('should handle successful passphrase entry', async () => {
      const passphrase = 'correct-passphrase';
      const result = await enterPassPhrase(passphrase);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockPatch).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: passphrase,
      });
    });

    it('should handle incorrect passphrase entry', async () => {
      const passphrase = 'incorrect-passphrase';
      mockPatch.mockRejectedValue({ error: 'Authentication failed' });

      try {
        await enterPassPhrase(passphrase);
      } catch (error) {
        expect(error).toEqual({ error: 'Authentication failed' });
      }
    });

    it('should handle empty passphrase entry', async () => {
      const passphrase = '';
      await enterPassPhrase(passphrase);

      expect(mockPatch).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: '',
      });
    });

    it('should send passphrase directly as body', async () => {
      const passphrase = 'direct-passphrase-body';
      await enterPassPhrase(passphrase);

      // Verify that the passphrase is sent as the direct body, not wrapped in an object
      expect(mockPatch).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: passphrase,
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network unavailable');
      mockGet.mockRejectedValue(networkError);

      try {
        await getPassphraseStatus();
      } catch (error) {
        expect(error).toEqual(networkError);
      }
    });

    it('should handle HTTP status errors', async () => {
      const httpError = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: 'Server error' },
      };

      mockPost.mockRejectedValue(httpError);

      try {
        await createPassphrase('test');
      } catch (error) {
        expect(error).toEqual(httpError);
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockPut.mockRejectedValue(timeoutError);

      try {
        await editPassphrase('new', 'old');
      } catch (error) {
        expect(error).toEqual(timeoutError);
      }
    });
  });

  describe('Endpoint Paths', () => {
    it('should use correct API endpoint for all operations', () => {
      const expectedEndpoint = '/v1/encryption/passphrase';

      getPassphraseStatus();
      createPassphrase('test');
      editPassphrase('new', 'old');
      enterPassPhrase('test');

      expect(mockGet).toHaveBeenCalledWith(expectedEndpoint);
      expect(mockPost).toHaveBeenCalledWith(expectedEndpoint, expect.any(Object));
      expect(mockPut).toHaveBeenCalledWith(expectedEndpoint, expect.any(Object));
      expect(mockPatch).toHaveBeenCalledWith(expectedEndpoint, expect.any(Object));
    });
  });

  describe('Data Serialization', () => {
    it('should properly serialize passphrase data in POST requests', async () => {
      const passphrase = 'test-passphrase-with-unicode-🔐';
      await createPassphrase(passphrase);

      expect(mockPost).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: passphrase,
        },
      });
    });

    it('should properly serialize both passphrases in PUT requests', async () => {
      const newPassphrase = 'new-🔑';
      const oldPassphrase = 'old-🗝️';

      await editPassphrase(newPassphrase, oldPassphrase);

      expect(mockPut).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: {
          new_passphrase: newPassphrase,
          old_passphrase: oldPassphrase,
        },
      });
    });

    it('should handle binary or base64 encoded passphrases', async () => {
      const binaryPassphrase = btoa('binary-data-passphrase');
      await enterPassPhrase(binaryPassphrase);

      expect(mockPatch).toHaveBeenCalledWith('/v1/encryption/passphrase', {
        body: binaryPassphrase,
      });
    });
  });
});
