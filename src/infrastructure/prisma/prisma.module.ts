import { Global, Injectable, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {
    constructor(private readonly prismaService: PrismaService) {}
}
