import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
    id: string;
    role: string;
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
        const request = ctx.switchToHttp().getRequest();
        if (!request.user) {
            throw new Error('User not found in request');
        }
        return request.user;
    },
);