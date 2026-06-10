import { Test, TestingModule } from '@nestjs/testing';
import { TrainingRequestsService } from './training-requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrainingRequest } from './training-request.entity';
import { TrainingRequestParticipant } from './training-request-participant.entity';
import { User } from '../users/user.entity';
import { WorkflowService } from '../workflow/workflow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestType, RequestStatus, UserRole } from '../../common/enums';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('TrainingRequestsService', () => {
  let service: TrainingRequestsService;
  let mockRequestRepo: any;
  let mockParticipantRepo: any;
  let mockUserRepo: any;
  let mockWorkflowService: any;

  beforeEach(async () => {
    mockRequestRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockParticipantRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockUserRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    mockWorkflowService = {
      startProcess: jest.fn().mockResolvedValue('process-123'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingRequestsService,
        { provide: getRepositoryToken(TrainingRequest), useValue: mockRequestRepo },
        { provide: getRepositoryToken(TrainingRequestParticipant), useValue: mockParticipantRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: WorkflowService, useValue: mockWorkflowService },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<TrainingRequestsService>(TrainingRequestsService);
  });

  describe('createIndividual', () => {
    it('should create a request for employee with EN_ATTENTE_MANAGER status', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user-1', role: UserRole.EMPLOYEE });
      mockRequestRepo.create.mockReturnValue({
        requestType: RequestType.NOUVELLE,
        customFormationName: 'React',
        desiredStartDate: '2026-07-01',
        status: RequestStatus.EN_ATTENTE_MANAGER,
      });
      mockRequestRepo.save.mockResolvedValue({
        id: 'req-1',
        requestType: RequestType.NOUVELLE,
        status: RequestStatus.EN_ATTENTE_MANAGER,
      });

      const result = await service.createIndividual(
        {
          requestType: RequestType.NOUVELLE,
          customFormationName: 'React',
          desiredStartDate: '2026-07-01',
        },
        'user-1',
        UserRole.EMPLOYEE,
      );

      expect(result.status).toBe(RequestStatus.EN_ATTENTE_MANAGER);
    });

    it('should create a request for manager with EN_ATTENTE_RH status', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'mgr-1', role: UserRole.MANAGER });
      mockRequestRepo.create.mockReturnValue({
        requestType: RequestType.CATALOGUE,
        status: RequestStatus.EN_ATTENTE_RH,
      });
      mockRequestRepo.save.mockResolvedValue({
        id: 'req-2',
        status: RequestStatus.EN_ATTENTE_RH,
      });

      const result = await service.createIndividual(
        {
          requestType: RequestType.CATALOGUE,
          formationId: 'form-1',
          desiredStartDate: '2026-08-01',
        },
        'mgr-1',
        UserRole.MANAGER,
      );

      expect(result.status).toBe(RequestStatus.EN_ATTENTE_RH);
    });
  });

  describe('createTeamRequest', () => {
    it('should reject if user is not a manager', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user-1', role: UserRole.EMPLOYEE });

      await expect(
        service.createTeamRequest(
          {
            requestType: RequestType.CATALOGUE,
            formationId: 'form-1',
            desiredStartDate: '2026-07-01',
            participantIds: ['user-2'],
          },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if participant is not a team member', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'mgr-1', role: UserRole.MANAGER });
      mockUserRepo.find.mockResolvedValue([{ id: 'user-2' }]); // team only has user-2

      await expect(
        service.createTeamRequest(
          {
            requestType: RequestType.CATALOGUE,
            formationId: 'form-1',
            desiredStartDate: '2026-07-01',
            participantIds: ['user-3'], // not in team
          },
          'mgr-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelRequest', () => {
    it('should not allow cancelling approved requests', async () => {
      mockRequestRepo.findOne.mockResolvedValue({
        id: 'req-1',
        createdBy: 'user-1',
        status: RequestStatus.APPROUVEE,
        decisions: [],
        participants: [],
      });

      await expect(
        service.cancelRequest('req-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not allow other users to cancel', async () => {
      mockRequestRepo.findOne.mockResolvedValue({
        id: 'req-1',
        createdBy: 'user-1',
        status: RequestStatus.EN_ATTENTE_MANAGER,
        decisions: [],
        participants: [],
      });

      await expect(
        service.cancelRequest('req-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
