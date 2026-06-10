import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TrainingRequest } from './training-request.entity';
import { TrainingRequestParticipant } from './training-request-participant.entity';
import { User } from '../users/user.entity';
import {
  CreateTrainingRequestDto,
  CreateTeamTrainingRequestDto,
} from './dto';
import {
  RequestScope,
  RequestStatus,
  UserRole,
  ParticipantStatus,
} from '../../common/enums';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class TrainingRequestsService {
  constructor(
    @InjectRepository(TrainingRequest)
    private readonly requestRepository: Repository<TrainingRequest>,
    @InjectRepository(TrainingRequestParticipant)
    private readonly participantRepository: Repository<TrainingRequestParticipant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly workflowService: WorkflowService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAllForUser(userId: string, role: UserRole): Promise<TrainingRequest[]> {
    if (role === UserRole.RH || role === UserRole.ADMIN) {
      return this.requestRepository.find({
        relations: ['createdByUser', 'formation', 'participants', 'participants.user'],
        order: { createdAt: 'DESC' },
      });
    }

    if (role === UserRole.MANAGER) {
      const teamMembers = await this.userRepository.find({
        where: { managerId: userId },
        select: ['id'],
      });
      const teamIds = teamMembers.map((m) => m.id);
      teamIds.push(userId);

      return this.requestRepository.find({
        where: { createdBy: In(teamIds) },
        relations: ['createdByUser', 'formation', 'participants', 'participants.user'],
        order: { createdAt: 'DESC' },
      });
    }

    // Employee: own requests + requests where they are participant
    const ownRequests = await this.requestRepository.find({
      where: { createdBy: userId },
      relations: ['formation', 'participants'],
      order: { createdAt: 'DESC' },
    });

    const participations = await this.participantRepository.find({
      where: { userId },
      relations: ['trainingRequest', 'trainingRequest.formation'],
    });

    const participantRequests = participations
      .map((p) => p.trainingRequest)
      .filter((r) => r.createdBy !== userId);

    return [...ownRequests, ...participantRequests];
  }

  async findById(id: string): Promise<TrainingRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: [
        'createdByUser',
        'formation',
        'participants',
        'participants.user',
        'decisions',
        'decisions.decidedByUser',
      ],
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    return request;
  }

  async createIndividual(
    dto: CreateTrainingRequestDto,
    userId: string,
    userRole: UserRole,
  ): Promise<TrainingRequest> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const request = this.requestRepository.create({
      requestType: dto.requestType,
      requestScope: RequestScope.INDIVIDUAL,
      createdBy: userId,
      formationId: dto.formationId || null,
      customFormationName: dto.customFormationName || null,
      domain: dto.domain || null,
      desiredStartDate: dto.desiredStartDate,
      desiredEndDate: dto.desiredEndDate || null,
      justification: dto.justification || null,
    } as Partial<TrainingRequest>);

    // Determine initial status based on role
    if (userRole === UserRole.MANAGER) {
      request.status = RequestStatus.EN_ATTENTE_RH;
    } else {
      request.status = RequestStatus.EN_ATTENTE_MANAGER;
    }

    const savedRequest = await this.requestRepository.save(request);

    // Start Camunda workflow
    try {
      const processInstanceId = await this.workflowService.startProcess(
        savedRequest as TrainingRequest,
        user,
      );
      (savedRequest as TrainingRequest).camundaProcessInstanceId = processInstanceId;
      await this.requestRepository.save(savedRequest);
    } catch (error) {
      // Camunda might not be running; continue without it
      console.warn('Camunda not available:', error.message);
    }

    // Notify the manager that a new request needs validation
    const formationName =
      dto.customFormationName || 'une formation du catalogue';
    if (userRole !== UserRole.MANAGER && user.managerId) {
      await this.notificationsService.create(
        user.managerId,
        NotificationType.REQUEST_NEEDS_VALIDATION,
        `${user.firstName} ${user.lastName} a soumis une demande de formation : "${formationName}"`,
        savedRequest.id,
      );
    } else if (userRole === UserRole.MANAGER) {
      // Manager skips to RH - notify RH
      const rhUsers = await this.userRepository.find({ where: { role: UserRole.RH } });
      for (const rh of rhUsers) {
        await this.notificationsService.create(
          rh.id,
          NotificationType.REQUEST_NEEDS_VALIDATION,
          `${user.firstName} ${user.lastName} (Manager) a soumis une demande : "${formationName}"`,
          savedRequest.id,
        );
      }
    }

    return savedRequest as TrainingRequest;
  }

  async createTeamRequest(
    dto: CreateTeamTrainingRequestDto,
    managerId: string,
  ): Promise<TrainingRequest> {
    const manager = await this.userRepository.findOne({
      where: { id: managerId },
    });
    if (!manager || manager.role !== UserRole.MANAGER) {
      throw new ForbiddenException('Seul un manager peut créer une demande groupée');
    }

    // Verify all participants are team members
    const teamMembers = await this.userRepository.find({
      where: { managerId, isActive: true },
      select: ['id'],
    });
    const teamMemberIds = teamMembers.map((m) => m.id);

    for (const participantId of dto.participantIds) {
      if (!teamMemberIds.includes(participantId)) {
        throw new BadRequestException(
          `L'utilisateur ${participantId} n'est pas membre de votre équipe`,
        );
      }
    }

    const request = this.requestRepository.create({
      requestType: dto.requestType,
      requestScope: RequestScope.TEAM,
      createdBy: managerId,
      formationId: dto.formationId || null,
      customFormationName: dto.customFormationName || null,
      domain: dto.domain || null,
      desiredStartDate: dto.desiredStartDate,
      desiredEndDate: dto.desiredEndDate || null,
      justification: dto.justification || null,
      status: RequestStatus.EN_ATTENTE_RH, // Skip manager validation
    } as Partial<TrainingRequest>);

    const savedRequest = await this.requestRepository.save(request) as TrainingRequest;

    // Create participants
    const participants = dto.participantIds.map((userId) =>
      this.participantRepository.create({
        trainingRequestId: savedRequest.id,
        userId,
        participantStatus: ParticipantStatus.PENDING,
      }),
    );
    await this.participantRepository.save(participants);

    // Start Camunda workflow (manager flow)
    try {
      const processInstanceId = await this.workflowService.startProcess(
        savedRequest,
        manager,
      );
      savedRequest.camundaProcessInstanceId = processInstanceId;
      await this.requestRepository.save(savedRequest);
    } catch (error) {
      console.warn('Camunda not available:', error.message);
    }

    return this.findById(savedRequest.id);
  }

  async cancelRequest(id: string, userId: string): Promise<TrainingRequest> {
    const request = await this.findById(id);

    if (request.createdBy !== userId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres demandes');
    }

    if (request.status === RequestStatus.APPROUVEE) {
      throw new BadRequestException('Impossible d\'annuler une demande déjà approuvée');
    }

    if (request.status === RequestStatus.ANNULEE) {
      throw new BadRequestException('La demande est déjà annulée');
    }

    request.status = RequestStatus.ANNULEE;
    return this.requestRepository.save(request);
  }
}
