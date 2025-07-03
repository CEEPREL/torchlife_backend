import { Module } from '@nestjs/common';
import { UserService } from '../../applications/services/user/user.service';
import { UserController } from '../../controllers/user/user.controller';

@Module({
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
