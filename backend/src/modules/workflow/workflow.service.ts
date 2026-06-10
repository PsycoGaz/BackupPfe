import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { User } from '../users/user.entity';
import { UserRole, RequestStatus } from '../../common/enums';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly httpClient: AxiosInstance;
  private readonly camundaBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.camundaBaseUrl = this.configService.get<string>(
      'CAMUNDA_BASE_URL',
      'http://localhost:8080/engine-rest',
    );
    this.httpClient = axios.create({
      baseURL: this.camundaBaseUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async startProcess(
    request: TrainingRequest,
    creator: User,
  ): Promise<string> {
    const processKey =
      creator.role === UserRole.MANAGER
        ? 'manager-training-request'
        : 'employee-training-request';

    const variables: Record<string, { value: any; type: string }> = {
      requestId: { value: request.id, type: 'String' },
      createdBy: { value: creator.id, type: 'String' },
      managerId: { value: creator.managerId || '', type: 'String' },
    };

    try {
      const response = await this.httpClient.post(
        `/process-definition/key/${processKey}/start`,
        { variables },
      );

      this.logger.log(
        `Process started: ${response.data.id} for request ${request.id}`,
      );
      return response.data.id;
    } catch (error) {
      this.logger.error(`Failed to start process: ${error.message}`);
      throw error;
    }
  }

  async getTasksForUser(
    userId: string,
    role: UserRole,
  ): Promise<any[]> {
    try {
      const params: any = {};

      if (role === UserRole.MANAGER) {
        params.assignee = userId;
        params.taskDefinitionKey = 'Task_ManagerValidation';
      } else if (role === UserRole.RH) {
        params.candidateGroup = 'RH';
        params.taskDefinitionKey = 'Task_RHValidation';
      }

      const response = await this.httpClient.get('/task', { params });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get tasks: ${error.message}`);
      return [];
    }
  }

  async completeTask(
    taskId: string,
    approved: boolean,
    comment: string | null,
  ): Promise<void> {
    try {
      const variables: Record<string, { value: any; type: string }> = {
        approved: { value: approved, type: 'Boolean' },
        decisionComment: { value: comment || '', type: 'String' },
      };

      await this.httpClient.post(`/task/${taskId}/complete`, { variables });
      this.logger.log(`Task ${taskId} completed with approved=${approved}`);
    } catch (error) {
      this.logger.error(`Failed to complete task: ${error.message}`);
      throw error;
    }
  }

  async getTaskByRequestId(
    requestId: string,
    taskDefinitionKey: string,
  ): Promise<any | null> {
    try {
      await this.httpClient.get('/task', {
        params: {
          processVariables: `requestId_eq_${requestId}`,
          taskDefinitionKey,
        },
      });

      // Alternative: search by process variables
      const allTasks = await this.httpClient.post('/task', {
        processVariables: [
          { name: 'requestId', operator: 'eq', value: requestId },
        ],
        taskDefinitionKey,
      });

      return allTasks.data?.[0] || null;
    } catch (error) {
      this.logger.warn(`Failed to find task for request ${requestId}`);
      return null;
    }
  }

  getNewStatus(
    currentStatus: RequestStatus,
    approved: boolean,
    decisionRole: 'MANAGER' | 'RH',
  ): RequestStatus {
    if (decisionRole === 'MANAGER') {
      return approved
        ? RequestStatus.EN_ATTENTE_RH
        : RequestStatus.REFUSEE_MANAGER;
    }

    // RH decision
    return approved ? RequestStatus.APPROUVEE : RequestStatus.REFUSEE_RH;
  }
}
