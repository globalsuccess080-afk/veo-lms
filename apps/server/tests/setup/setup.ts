import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { connectMemoryDB, clearDatabase, disconnectDB } from './db';
import './mocks';
import { clearRedisStore } from './mocks';

process.env.MONGOMS_MD5_CHECK = '0'; // Skip MD5 check due to mismatched checksums on the mirror

beforeAll(async () => {
  await connectMemoryDB();
}, 120000); // 2 minute timeout for MongoDB download

beforeEach(async () => {
  vi.clearAllMocks();
  clearRedisStore();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnectDB();
}, 60000);
