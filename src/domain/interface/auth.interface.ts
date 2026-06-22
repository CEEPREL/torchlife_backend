import { Request, Response } from 'express';
import { ForgetPasswordDto, ResetPasswordDto, SignInDto, SignUpDto } from 'src/services/auth/dto/auth.dto';
import { DbUser } from 'src/shared/types/db-user.types';

export interface IAuth {
    signUp(signUpDto: SignUpDto, response: Response): Promise<{ data: Omit<DbUser, 'password'> }>;

    signIn(signInDto: SignInDto, res: Response): Promise<Response>;

    verifyUser(signInDto: SignInDto): Promise<{ data: DbUser }>;

    forgetPassword(forgetPasswordDto: ForgetPasswordDto): Promise<{ msg: string }>;

    updatePassword(resetPasswordDto: ResetPasswordDto, req: Request): Promise<{ msg: string }>;

    requestPasswordChange(data: { identifier: string }): Promise<{ msg: string }>;

    refreshToken(response: Response): Promise<{ accessToken: string }>;

    logout(req: Request, res: Response): Promise<{ message: string }>;
}
