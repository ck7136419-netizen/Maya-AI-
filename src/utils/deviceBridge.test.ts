import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanPhoneNumber,
  isValidWebUrl,
  normalizeAppName,
  searchContactsList,
  executeCallContact,
  executeOpenApp,
  executeSendSMS,
  executePlayYouTubeMusic,
  DEFAULT_CONTACTS,
} from './deviceBridge.ts';

test('cleanPhoneNumber formats and validates numbers', () => {
  assert.equal(cleanPhoneNumber('+91 98765 43210'), '+919876543210');
  assert.equal(cleanPhoneNumber('9876543210'), '9876543210');
  assert.equal(cleanPhoneNumber('100'), '100'); // Emergency number min length
  assert.equal(cleanPhoneNumber('12'), null); // too short
  assert.equal(cleanPhoneNumber('abc'), null);
});

test('isValidWebUrl checks HTTP and HTTPS protocols', () => {
  assert.equal(isValidWebUrl('https://google.com'), true);
  assert.equal(isValidWebUrl('http://example.org/path?q=1'), true);
  assert.equal(isValidWebUrl('javascript:alert(1)'), false);
  assert.equal(isValidWebUrl('file:///etc/passwd'), false);
  assert.equal(isValidWebUrl('not a url'), false);
});

test('normalizeAppName trims and removes punctuation', () => {
  assert.equal(normalizeAppName('  YouTube! '), 'youtube');
  assert.equal(normalizeAppName('Whats-App'), 'whatsapp');
  assert.equal(normalizeAppName('Google Maps'), 'googlemaps');
});

test('searchContactsList finds unique match', () => {
  const mom = searchContactsList('Mom', DEFAULT_CONTACTS);
  assert.equal(mom.length, 1);
  assert.equal(mom[0].name, 'Mom');
});

test('searchContactsList finds multiple matches for common name', () => {
  const rahuls = searchContactsList('Rahul', DEFAULT_CONTACTS);
  assert.equal(rahuls.length, 2);
  assert.ok(rahuls.some((r) => r.name === 'Rahul Sharma'));
  assert.ok(rahuls.some((r) => r.name === 'Rahul Verma'));
});

test('executeCallContact refuses to guess when multiple matches exist', async () => {
  const result = await executeCallContact('Rahul', DEFAULT_CONTACTS);
  assert.equal(result.success, false);
  assert.equal(result.error, 'Multiple contacts found');
  assert.equal(result.details?.count, 2);
});

test('executeCallContact reports not found for non-existent contact', async () => {
  const result = await executeCallContact('Zack12345NonExistent', DEFAULT_CONTACTS);
  assert.equal(result.success, false);
  assert.equal(result.error, 'Contact not found');
});

test('executeOpenApp blocks unallowlisted apps', async () => {
  const result = await executeOpenApp('malicious_executable_app');
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('Unsupported app'));
});

test('executeSendSMS handles valid and invalid phone numbers', async () => {
  const invalid = await executeSendSMS('invalid_phone');
  assert.equal(invalid.success, false);
  assert.equal(invalid.error, 'Invalid phone number');

  const valid = await executeSendSMS('9876543210', 'Hello from YASMIN');
  assert.equal(valid.action, 'sendSMS');
});

test('executePlayYouTubeMusic constructs search query correctly', async () => {
  const res = await executePlayYouTubeMusic('Arijit Singh romantic');
  assert.equal(res.action, 'playYouTubeMusic');
  assert.equal(res.details?.query, 'Arijit Singh romantic');
});

