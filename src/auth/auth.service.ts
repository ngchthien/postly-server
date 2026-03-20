import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    name: string,
    pass: string,
  ): Promise<UserDocument> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.usersService.create({
      email,
      name,
      password: hashedPassword,
    });
    return user;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    const refreshPayload = { sub: user._id, type: 'refresh' };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: '7d' }),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        roles: user.roles,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { email: user.email, sub: user._id };
      const newRefreshPayload = { sub: user._id, type: 'refresh' };

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newRefreshPayload, { expiresIn: '7d' }),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateProfile(
    userId: string,
    name?: string,
    bio?: string,
  ): Promise<any> {
    const user = await this.usersService.updateProfile(userId, name, bio);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { password, ...result } = user.toObject();
    return result;
  }
}
