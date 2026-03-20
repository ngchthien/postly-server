export class RegisterDto {
  email: string;
  name: string;
  password: string;

  // firstName?: string;
  // lastName?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class UpdateProfileDto {
  name?: string;
  bio?: string;
}

export class RefreshTokenDto {
  refresh_token: string;
}
