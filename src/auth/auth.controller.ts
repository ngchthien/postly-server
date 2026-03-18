import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const { email, password } = registerDto;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = await this.authService.register(email, password);
    return this.authService.login(user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }
}

