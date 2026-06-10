import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestDecision } from './request-decision.entity';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { User } from '../users/user.entity';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import {
  DecisionRole,
  DecisionType,
  RequestStatus,
  UserRole,
} from '../../common/enums';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(RequestDecision)
    private readonly decisionRepository: Repository<RequestDecision>,
    @InjectRepository(TrainingRequest)
    private readonly requestRepository: Repository<TrainingRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly workflowService: WorkflowService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // --- Manager decisions ---

  async getManagerTasks(managerId: string): Promise<TrainingRequest[]> {
    return this.requestRepository.find({
      where: { status: RequestStatus.EN_ATTENTE_MANAGER },
      relations: ['createdByUser', 'formation'],
      order: { createdAt: 'ASC' },
    }).then((requests) =>
      requests.filter((r) => {
        // Only show requests from team members
        return r.createdByUser?.managerId === managerId;
      }),
    );
  }

  async approveAsManager(
    requestId: string,
    managerId: string,
    comment: string | null,
  ): Promise<TrainingRequest> {
    return this.makeDecision(
      requestId,
      managerId,
      DecisionRole.MANAGER,
      DecisionType.APPROVED,
      comment,
    );
  }

  async rejectAsManager(
    requestId: string,
    managerId: string,
    comment: string | null,
  ): Promise<TrainingRequest> {
    return this.makeDecision(
      requestId,
      managerId,
      DecisionRole.MANAGER,
      DecisionType.REJECTED,
      comment,
    );
  }

  // --- RH decisions ---

  async getRhTasks(): Promise<TrainingRequest[]> {
    return this.requestRepository.find({
      where: { status: RequestStatus.EN_ATTENTE_RH },
      relations: ['createdByUser', 'formation', 'participants', 'participants.user'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveAsRh(
    requestId: string,
    rhUserId: string,
    comment: string | null,
  ): Promise<TrainingRequest> {
    return this.makeDecision(
      requestId,
      rhUserId,
      DecisionRole.RH,
      DecisionType.APPROVED,
      comment,
    );
  }

  async rejectAsRh(
    requestId: string,
    rhUserId: string,
    comment: string | null,
  ): Promise<TrainingRequest> {
    return this.makeDecision(
      requestId,
      rhUserId,
      DecisionRole.RH,
      DecisionType.REJECTED,
      comment,
    );
  }

  // --- Private ---

  private async makeDecision(
    requestId: string,
    userId: string,
    decisionRole: DecisionRole,
    decision: DecisionType,
    comment: string | null,
  ): Promise<TrainingRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['createdByUser'],
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    // Validate correct status
    if (
      decisionRole === DecisionRole.MANAGER &&
      request.status !== RequestStatus.EN_ATTENTE_MANAGER
    ) {
      throw new BadRequestException(
        'Cette demande n\'est pas en attente de validation manager',
      );
    }

    if (
      decisionRole === DecisionRole.RH &&
      request.status !== RequestStatus.EN_ATTENTE_RH
    ) {
      throw new BadRequestException(
        'Cette demande n\'est pas en attente de validation RH',
      );
    }

    // Validate manager is the right one
    if (decisionRole === DecisionRole.MANAGER) {
      if (request.createdByUser?.managerId !== userId) {
        throw new ForbiddenException(
          'Vous n\'êtes pas le manager de cet employé',
        );
      }
    }

    // Save decision
    const decisionEntity = this.decisionRepository.create({
      trainingRequestId: requestId,
      decidedBy: userId,
      decisionRole,
      decision,
      comment: comment || null,
    } as Partial<RequestDecision>);
    await this.decisionRepository.save(decisionEntity);

    // Update status
    const approved = decision === DecisionType.APPROVED;
    request.status = this.workflowService.getNewStatus(
      request.status,
      approved,
      decisionRole,
    );
    await this.requestRepository.save(request);

    // Complete Camunda task
    try {
      const taskKey =
        decisionRole === DecisionRole.MANAGER
          ? 'Task_ManagerValidation'
          : 'Task_RHValidation';
      const task = await this.workflowService.getTaskByRequestId(
        requestId,
        taskKey,
      );
      if (task) {
        await this.workflowService.completeTask(task.id, approved, comment);
      }
    } catch (error) {
      // Continue without Camunda
      console.warn('Camunda task completion failed:', error.message);
    }

    // Send notification to the request creator
    const formationName =
      request.formation?.name || request.customFormationName || 'Formation';
    if (approved && decisionRole === DecisionRole.MANAGER) {
      await this.notificationsService.create(
        request.createdBy,
        NotificationType.REQUEST_APPROVED_MANAGER,
        `Votre demande "${formationName}" a \u00e9t\u00e9 valid\u00e9e par votre manager.`,
        requestId,
      );
      // Notify RH that a request needs their validation
      const rhUsers = await this.userRepository.find({ where: { role: UserRole.RH } });
      for (const rh of rhUsers) {
        await this.notificationsService.create(
          rh.id,
          NotificationType.REQUEST_NEEDS_VALIDATION,
          `Nouvelle demande \u00e0 valider : "${formationName}"`,
          requestId,
        );
      }
    } else if (approved && decisionRole === DecisionRole.RH) {
      await this.notificationsService.create(
        request.createdBy,
        NotificationType.REQUEST_APPROVED_RH,
        `Votre demande "${formationName}" a \u00e9t\u00e9 approuv\u00e9e par le service RH.`,
        requestId,
      );
    } else if (!approved && decisionRole === DecisionRole.MANAGER) {
      await this.notificationsService.create(
        request.createdBy,
        NotificationType.REQUEST_REJECTED_MANAGER,
        `Votre demande "${formationName}" a \u00e9t\u00e9 refus\u00e9e par votre manager.`,
        requestId,
      );
    } else if (!approved && decisionRole === DecisionRole.RH) {
      await this.notificationsService.create(
        request.createdBy,
        NotificationType.REQUEST_REJECTED_RH,
        `Votre demande "${formationName}" a \u00e9t\u00e9 refus\u00e9e par le service RH.`,
        requestId,
      );
    }

    return request;
  }
}
