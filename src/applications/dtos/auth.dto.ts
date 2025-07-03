import { PickType } from '@nestjs/mapped-types';
import { UserDto } from './user.dto';

export class SignUpDto extends UserDto {}
export class SignInDto extends PickType(UserDto, ['email', 'password']) {}
