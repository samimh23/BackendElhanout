import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

interface JwtPayload {
    userId: string;    // Match the actual token structure
    role: string;
    iat: number;
    exp: number;
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
    private readonly logger = new Logger(AuthenticationGuard.name);

    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const token = request.headers.authorization?.split(' ')[1];

            if (!token) {
                throw new UnauthorizedException('No token provided');
            }

            const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
            
            // Transform the payload to match what your application expects
            request.user = {
                id: payload.userId,  // Map userId to id
                role: payload.role,
                // Add any other necessary fields
            };

            this.logger.log(`Authenticated user with ID: ${payload.userId} and role: ${payload.role}`);
            return true;
            
        } catch (error) {
            this.logger.error(`Authentication failed: ${error.message}`);
            throw new UnauthorizedException('Invalid token');
        }
    }
}