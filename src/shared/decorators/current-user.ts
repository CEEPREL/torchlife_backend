import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const getCurrentUserByExecContext = (context: ExecutionContext) => {
    return context.switchToHttp().getRequest().user;
};
export const currentUser = createParamDecorator((data: unknown, context: ExecutionContext) =>
    getCurrentUserByExecContext(context),
);
