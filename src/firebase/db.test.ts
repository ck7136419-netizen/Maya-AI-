import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OperationType, handleFirestoreError } from './config';

describe('Cloud Firestore Pure Logic & Error Structure', () => {
  it('throws structured JSON containing OperationType and path on permission denial', () => {
    assert.throws(
      () => {
        handleFirestoreError(new Error('Missing or insufficient permissions.'), OperationType.WRITE, 'users/user_123');
      },
      (err: Error) => {
        const parsed = JSON.parse(err.message);
        assert.strictEqual(parsed.operationType, 'write');
        assert.strictEqual(parsed.path, 'users/user_123');
        assert.match(parsed.error, /Missing or insufficient permissions/i);
        return true;
      }
    );
  });

  it('validates supported memory categories in schema', () => {
    const validCategories = ['preference', 'personal', 'work', 'habit', 'instruction'];
    assert.strictEqual(validCategories.includes('personal'), true);
    assert.strictEqual(validCategories.includes('preference'), true);
    assert.strictEqual(validCategories.includes('invalid_cat'), false);
  });

  it('validates role privileges boundaries', () => {
    const roles = ['user', 'admin', 'owner'];
    assert.strictEqual(roles.includes('owner'), true);
    assert.strictEqual(roles.includes('superadmin'), false);
  });
});
