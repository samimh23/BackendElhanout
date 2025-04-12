import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ProfileApiService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Get user data from token - useful for frontend to get user data on app startup
   */
  async getUserFromToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (!payload || !payload.userId) {
        return null;
      }
      
      const profileData = await this.usersService.getProfile(payload.userId);
      return profileData;
    } catch (error) {
      return null;
    }
  }
}