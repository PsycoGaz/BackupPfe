import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { isActive: true },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'managerId',
        'isActive',
        'createdAt',
      ],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'managerId',
        'isActive',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async findTeamMembers(managerId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { managerId, isActive: true },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'role',
        'createdAt',
      ],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
