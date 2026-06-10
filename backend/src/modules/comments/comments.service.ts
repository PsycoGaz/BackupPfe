import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(TrainingRequest)
    private readonly requestRepository: Repository<TrainingRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByRequest(requestId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { requestId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(requestId: string, authorId: string, content: string): Promise<Comment> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['createdByUser'],
    });
    if (!request) {
      throw new NotFoundException('Demande non trouv\u00e9e');
    }

    const author = await this.userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('Utilisateur non trouv\u00e9');
    }

    const comment = this.commentRepository.create({
      requestId,
      authorId,
      content,
    });

    const saved = await this.commentRepository.save(comment);

    // Notify the request owner if the commenter is not the owner
    if (authorId !== request.createdBy) {
      await this.notificationsService.create(
        request.createdBy,
        NotificationType.REQUEST_SUBMITTED,
        `${author.firstName} ${author.lastName} a comment\u00e9 votre demande de formation`,
        requestId,
      );
    }

    // Notify the author of the request's manager if commenter is the requester
    if (authorId === request.createdBy && request.createdByUser?.managerId) {
      await this.notificationsService.create(
        request.createdByUser.managerId,
        NotificationType.REQUEST_SUBMITTED,
        `${author.firstName} ${author.lastName} a r\u00e9pondu sur sa demande de formation`,
        requestId,
      );
    }

    saved.author = author;
    return saved;
  }
}
