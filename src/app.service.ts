import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RedisHealthService } from './health/redis-health.service';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly redisHealthService: RedisHealthService,
    ) {}

    async getHello() {
        throw new InternalServerErrorException('Something went wrong');
    }

    async getHealth() {
        const checks = {
            application: 'ok',
            database: 'down',
            redis: 'down',
        };

        const errors: string[] = [];

        try {
            await this.prismaService.$queryRawUnsafe('SELECT 1');
            checks.database = 'ok';
        } catch (error) {
            errors.push(`Database check failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        try {
            const pong = await this.redisHealthService.ping();
            if (pong !== 'PONG') {
                throw new Error(`Unexpected Redis ping response: ${pong}`);
            }

            checks.redis = 'ok';
        } catch (error) {
            errors.push(`Redis check failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (errors.length > 0) {
            throw new ServiceUnavailableException({
                message: 'Unhealthy',
                status: 503,
                checks,
                errors,
            });
        }

        return {
            message: 'Healthy',
            status: 200,
            checks,
        };
    }
}
