import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user){
      console.log('lỗi email');
      throw new UnauthorizedException('email-or-password-incorrect')

    } 
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(password,user.password);
    if (!isMatch) {
      console.log('lỗi mk');
      
      throw new UnauthorizedException('email-or-password-incorrect');


    }
    if (user.status !== 'active') throw new UnauthorizedException('account-inactive');

    const payload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    };
  }
}
