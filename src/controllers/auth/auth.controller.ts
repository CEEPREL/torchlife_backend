import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../../applications/services/auth/auth.service';
// import { IAuth } from '../../auth/auth.interface';
import { SignInDto, SignUpDto } from '../../applications/dtos/auth.dto';
import { User } from '@prisma/client';
import { Response } from 'express';
import { IAuth } from 'src/domain/interface/auth.interface';

@Controller('auth')
export class AuthController implements IAuth {
    constructor(private readonly authService: AuthService) {}
    verifyUser(signInDto: SignInDto): Promise<{ data: User }> {
        throw new Error('Method not implemented.');
    }
    @Post('signup')
    async signUp(
        @Body() signUpDto: SignUpDto,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ data: Omit<User, 'password' | 'id'> }> {
        const user = await this.authService.signUp(signUpDto, response);

        return user;
    }
    @Post('signin')
    async signIn(@Body() signInDto: SignInDto, @Res() res: Response): Promise<Response> {
        return this.authService.signIn(signInDto, res);
    }
    requestResetPassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
    verifyRequestResetPassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
    updateResetPassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
    changePassword(): Promise<{ msg: string }> {
        throw new Error('Method not implemented.');
    }
}
