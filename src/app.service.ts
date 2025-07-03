import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello() {
        throw new NotFoundException();
    }

    getHealth(): { message: string; status: number } {
        return { message: 'Healthy', status: 200 };
    }
}
