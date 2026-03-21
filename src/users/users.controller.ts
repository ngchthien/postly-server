import { Controller, Get, Param, NotFoundException, UseGuards, Put, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':uid')
  async getProfile(@Param('uid') uid: string) {
    const user = await this.usersService.findById(uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio || '',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('fcm-token')
  async updateFcmToken(@Request() req: any, @Body('fcmToken') fcmToken: string) {
    const user = await this.usersService.updateFcmToken(req.user.userId, fcmToken);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { success: true };
  }
}
