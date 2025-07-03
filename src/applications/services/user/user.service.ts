import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignInDto, SignUpDto } from 'src/applications/dtos/auth.dto';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly prismaDB: PrismaService) {}

    // Get user by email
    async getUser(email: string): Promise<User> {
        const user = await this.prismaDB.user.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    // Get user by id
    async getUserById(id: string): Promise<Omit<User, 'password'>> {
        const user = await this.prismaDB.user.findUnique({
            where: {
                id: id,
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, ...result } = user;
        return result;
    }

    // create user
    async createUser(user: SignUpDto): Promise<Omit<User, 'password'>> {
        const existing = await this.prismaDB.user.findUnique({
            where: {
                email: user.email,
            },
        });
        if (existing) {
            throw new ConflictException('username already exists');
        }

        const newUser = await this.prismaDB.user.create({
            data: { ...user },
        });
        const { password, ...result } = newUser;
        return result;
    }

    // update user
    async updateUser(id: string, user: User): Promise<Omit<User, 'password'>> {
        const updatedUser = await this.prismaDB.user.update({
            where: {
                id: id,
            },
            data: user,
        });
        const { password, ...result } = updatedUser;
        return result;
    }

    // delete user
    async deleteUser(id: string): Promise<Omit<User, 'password'>> {
        const deletedUser = await this.prismaDB.user.delete({
            where: {
                id: id,
            },
        });
        const { password, ...result } = deletedUser;
        return result;
    }

    // get all users
    async getAllUsers(): Promise<Omit<User, 'password'>[]> {
        const users = await this.prismaDB.user.findMany();
        return users.map((user) => {
            const { password, ...result } = user;
            return result;
        });
    }
}
