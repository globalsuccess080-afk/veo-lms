import { vi } from 'vitest';

const memoryStore = new Map<string, string>();

export function clearRedisStore() {
  memoryStore.clear();
}

export const redisMock = {
  get: vi.fn(async (key: string) => {
    if (key?.startsWith('otp:')) return '123456';
    return memoryStore.get(key) ?? null;
  }),
  set: vi.fn(async (key: string, value: string) => {
    memoryStore.set(key, value);
  }),
  setex: vi.fn(async (key: string, _ttl: number, value: string) => {
    memoryStore.set(key, value);
  }),
  del: vi.fn(async (...keys: string[]) => {
    keys.forEach((key) => memoryStore.delete(key));
  }),
  keys: vi.fn(async (pattern: string) => {
    const prefix = pattern.replace(/\*$/, '');
    return [...memoryStore.keys()].filter((key) => key.startsWith(prefix));
  }),
  call: vi.fn(async (...args: unknown[]) => {
    const [command] = args as string[];
    if (command === 'INCR') return 1;
    if (command === 'EXPIRE') return 1;
    return null;
  }),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  on: vi.fn(),
  quit: vi.fn(),
  ttl: vi.fn().mockResolvedValue(-2),
};

vi.mock('../../src/config/redis', () => ({
  redis: redisMock,
}));

// Mock BullMQ
vi.mock('bullmq', () => {
  return {
    Queue: vi.fn(() => ({
      add: vi.fn(),
      getJob: vi.fn().mockResolvedValue(null),
    })),
    Worker: vi.fn(),
  };
});

// Mock Razorpay
vi.mock('razorpay', () => {
  return {
    default: vi.fn(() => ({
      orders: {
        create: vi.fn().mockResolvedValue({ id: 'order_mock_123', amount: 10000, currency: 'INR' }),
      },
      payments: {
        fetch: vi.fn().mockResolvedValue({ status: 'captured', amount: 10000 }),
      },
    })),
  };
});

// Mock Cloudflare R2 (AWS S3 Client)
vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    S3Client: vi.fn(() => ({
      send: vi.fn().mockResolvedValue({ Body: { transformToString: async () => '#EXTM3U\n' } }),
    })),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
    ListObjectsV2Command: vi.fn(),
    CopyObjectCommand: vi.fn(),
  };
});
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-signed-url.com'),
}));

// Mock Nodemailer
vi.mock('nodemailer', () => {
  return {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue(true),
    })),
  };
});

// Mock Socket.IO
vi.mock('socket.io', () => {
  return {
    Server: vi.fn(() => ({
      on: vi.fn(),
      emit: vi.fn(),
      to: vi.fn(() => ({
        emit: vi.fn(),
      })),
    })),
  };
});

// Mock FFmpeg
vi.mock('fluent-ffmpeg', () => {
  const ffmpegMock = vi.fn(() => {
    const chainable = {
      outputOptions: vi.fn().mockReturnThis(),
      output: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      run: vi.fn(),
    };
    return chainable;
  });
  return { default: ffmpegMock };
});
