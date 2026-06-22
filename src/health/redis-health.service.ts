import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRedisClient, getRedisUrl } from 'src/config/redis.config';

@Injectable()
export class RedisHealthService implements OnModuleInit, OnModuleDestroy {
    private readonly client: ReturnType<typeof createRedisClient>;

    constructor(private readonly configService: ConfigService) {
        this.client = createRedisClient(getRedisUrl(this.configService));
    }

    async onModuleInit() {
        await this.ensureConnected();
    }

    async onModuleDestroy() {
        if (this.client.status !== 'end') {
            await this.client.quit();
        }
    }

    async ping() {
        await this.ensureConnected();
        return this.client.ping();
    }

    private async ensureConnected() {
        if (this.client.status === 'ready' || this.client.status === 'connect' || this.client.status === 'connecting') {
            return;
        }

        await this.client.connect();
    }
}
