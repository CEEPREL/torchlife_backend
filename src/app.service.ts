import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class AppService {
    async getHello() {
        throw new InternalServerErrorException('Something went wrong');
    }

    async getHealth() 
      {
        return { message: 'Healthy', status: 200 };
 }
}
