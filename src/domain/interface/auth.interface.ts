import { User } from '@prisma/client';
import { Response } from 'express';
import { SignInDto, SignUpDto } from 'src/applications/dtos/auth.dto';

export interface IAuth {
    signUp(signUpDto: SignUpDto, response: Response): Promise<{ data: Omit<User, 'password' | 'id'> }>;
    signIn(signInDto: SignInDto, res: Response): Promise<Response>;
    verifyUser(signInDto: SignInDto): Promise<{ data: User }>;
    requestResetPassword(): Promise<{ msg: string }>;
    verifyRequestResetPassword(): Promise<{ msg: string }>;
    updateResetPassword(): Promise<{ msg: string }>;
    changePassword(): Promise<{ msg: string }>;
}
