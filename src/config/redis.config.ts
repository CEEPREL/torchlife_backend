import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const MISSING_REDIS_URL_MESSAGE =
    'REDIS_URL is required. Set it to a valid redis:// or rediss:// connection string.';

export const getRedisUrl = (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL')?.trim();

    if (!redisUrl) {
        throw new Error(MISSING_REDIS_URL_MESSAGE);
    }

    return redisUrl;
};

export const createRedisClient = (redisUrl: string) =>
    new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        connectTimeout: 5000,
    });

export const createBullConfig = (configService: ConfigService) => ({
    redis: getRedisUrl(configService),
});
