import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('verifyAccessToken', () => {
    it('should return null for invalid token', () => {
      const result = authService.verifyAccessToken('invalid-token');
      expect(result).to.be.null;
    });

    it('should return null for empty token', () => {
      const result = authService.verifyAccessToken('');
      expect(result).to.be.null;
    });

    it('should return null for malformed JWT', () => {
      const result = authService.verifyAccessToken('not.a.valid.jwt.token');
      expect(result).to.be.null;
    });
  });
});
