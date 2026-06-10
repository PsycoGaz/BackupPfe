import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsService } from './decisions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestDecision } from './request-decision.entity';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { User } from '../users/user.entity';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestStatus, UserRole } from '../../common/enums';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('DecisionsService', () => {
  let service: DecisionsService;
  let mockDecisionRepo: any;
  let mockRequestRepo: any;
  let mockUserRepo: any;
  let mockWorkflowService: any;

  beforeEach(async () => {
    mockDecisionRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };
    mockRequestRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockUserRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    mockWorkflowService = {
      getNewStatus: jest.fn(),
      getTaskByRequestId: jest.fn().mockResolvedValue(null),
      completeTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionsService,
        { provide: getRepositoryToken(RequestDecision), useValue: mockDecisionRepo },
        { provide: getRepositoryToken(TrainingRequest), useValue: mockRequestRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: WorkflowService, useValue: mockWorkflowService },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<DecisionsService>(DecisionsService);
  });

  describe('approveAsManager', () => {
    it('should reject if request is not in EN_ATTENTE_MANAGER', async () => {
      mockRequestRepo.findOne.mockResolvedValue({
        id: 'req-1',
        status: RequestStatus.EN_ATTENTE_RH,
        createdByUser: { managerId: 'mgr-1' },
      });

      await expect(
        service.approveAsManager('req-1', 'mgr-1', null),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if manager is not the right one', async () => {
      mockRequestRepo.findOne.mockResolvedValue({
        id: 'req-1',
        status: RequestStatus.EN_ATTENTE_MANAGER,
        createdByUser: { managerId: 'other-mgr' },
      });

      await expect(
        service.approveAsManager('req-1', 'mgr-1', null),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should approve and update status', async () => {
      mockRequestRepo.findOne.mockResolvedValue({
        id: 'req-1',
        status: RequestStatus.EN_ATTENTE_MANAGER,
        createdByUser: { managerId: 'mgr-1' },
      });
      mockWorkflowService.getNewStatus.mockReturnValue(RequestStatus.EN_ATTENTE_RH);
      mockRequestRepo.save.mockResolvedValue({
        id: 'req-1',
        status: RequestStatus.EN_ATTENTE_RH,
      });

      const result = await service.approveAsManager('req-1', 'mgr-1', 'Bon choix');

      expect(mockDecisionRepo.save).toHaveBeenCalled();
      expect(mockRequestRepo.save).toHaveBeenCalled();
    });
  });

  describe('approveAsRh', () => {
    it('should reject if request is not in EN_ATTENTE_RH', async () => {
      mockRequestRepo.findOne.mockResolvedValue({
        id: 'req-1',
        status: RequestStatus.EN_ATTENTE_MANAGER,
        createdByUser: {},
      });

      await expect(
        service.approveAsRh('req-1', 'rh-1', null),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
