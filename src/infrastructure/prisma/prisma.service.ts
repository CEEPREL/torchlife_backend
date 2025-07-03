import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

const createPrismaExtended = (prisma: PrismaService) => {
    return prisma.$extends({
        result: {},

        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    let searchParams = args as typeof args & { where: any };
                    if (!searchParams.where && operation !== 'create' && operation !== 'createMany') {
                        searchParams = { ...searchParams, where: {} };
                    }
                    if (!searchParams?.where?.deleted_at && operation !== 'create' && operation !== 'createMany') {
                        searchParams.where.deleted_at = null;
                    }

                    return await query({ ...searchParams });
                    // const start = Date.now();
                    // const result = await query({ ...searchParams });
                    // const duration = Date.now() - start;
                    // console.log(
                    // 	`Query: ${query} with Args: ${JSON.stringify(args)} Via ${model}.${operation} took ${duration}ms`,
                    // );
                    // console.log(`${model}.${operation} took ${duration}ms`);

                    // return result;
                },
            },
        },
    });
};

@Injectable()
export class PrismaService extends PrismaClient {
    // export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private _prisma: ReturnType<typeof createPrismaExtended>;

    constructor() {
        // constructor(private readonly configService: ConfigService) {
        super({
            datasources: { db: { url: process.env.DATABASE_URL } },
            transactionOptions: { maxWait: 10000, timeout: 60000 },
        });
        process.on('SIGINT', () => this.onModuleDestroy());
        process.on('SIGTERM', () => this.onModuleDestroy());
        process.on('SIGQUIT', () => this.onModuleDestroy());
        process.on('beforeExit', () => this.onModuleDestroy());
        process.on('exit', () => this.onModuleDestroy());
    }

    async onModuleInit() {
        await this.$connect();
        console.log('DB connected successfully');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('DB disconnected successfully');
    }

    get dbX() {
        if (!this._prisma) {
            this._prisma = createPrismaExtended(this);
        }
        return this._prisma;
    }
}

let PC: PrismaService | undefined;
if (!PC) {
    console.log('Init PC');
    PC = new PrismaService();
} else {
    console.log('PC already exists');
}

const DB = PC as unknown as PrismaService;
const DBx = DB.dbX as unknown as Omit<PrismaService, 'dbX'>;

type TDBx = Omit<PrismaService, 'dbX'>;
export { DBx, TDBx };
