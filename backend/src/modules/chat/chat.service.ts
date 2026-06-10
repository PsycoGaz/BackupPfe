import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { Formation } from '../formations/formation.entity';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { GeminiService } from './gemini.service';
import { ChatIntent } from '../../common/enums';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Formation)
    private readonly formationRepository: Repository<Formation>,
    @InjectRepository(TrainingRequest)
    private readonly requestRepository: Repository<TrainingRequest>,
    private readonly geminiService: GeminiService,
  ) {}

  private async getFormationsCatalog(): Promise<string> {
    const formations = await this.formationRepository.find({
      where: { isActive: true },
    });
    return formations
      .map((f) => `- ${f.name} (Domaine: ${f.domain})${f.description ? ' — ' + f.description : ''}`)
      .join('\n');
  }

  private async getUserRequests(userId: string): Promise<string> {
    const requests = await this.requestRepository.find({
      where: { createdBy: userId },
      relations: ['formation'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    if (requests.length === 0) return 'Aucune demande en cours.';
    return requests
      .map((r) => `- ${r.formation?.name || r.customFormationName || 'Formation'} | Statut: ${r.status} | Créée le: ${r.createdAt.toISOString().split('T')[0]}`)
      .join('\n');
  }

  async processMessage(userId: string, message: string) {
    const [catalog, userRequests] = await Promise.all([
      this.getFormationsCatalog(),
      this.getUserRequests(userId),
    ]);

    const geminiResponse = await this.geminiService.analyzeMessage(
      message,
      catalog,
      userRequests,
    );

    const intentMap: Record<string, ChatIntent> = {
      CREATE_TRAINING_REQUEST: ChatIntent.CREATE_TRAINING_REQUEST,
      RECOMMEND_FORMATIONS: ChatIntent.RECOMMEND_FORMATIONS,
      GENERATE_JUSTIFICATION: ChatIntent.GENERATE_JUSTIFICATION,
      GENERAL: ChatIntent.GENERAL,
    };

    const chatMessage = this.chatMessageRepository.create({
      userId,
      message,
      response: JSON.stringify(geminiResponse),
      intent: intentMap[geminiResponse.intent] || ChatIntent.GENERAL,
    });
    await this.chatMessageRepository.save(chatMessage);

    return geminiResponse;
  }

  async recommendFormations(userId: string, need: string) {
    const catalog = await this.getFormationsCatalog();
    const geminiResponse = await this.geminiService.recommendFormations(need, catalog);

    const chatMessage = this.chatMessageRepository.create({
      userId,
      message: `Recommandation: ${need}`,
      response: JSON.stringify(geminiResponse),
      intent: ChatIntent.RECOMMEND_FORMATIONS,
    });
    await this.chatMessageRepository.save(chatMessage);

    return geminiResponse;
  }

  async generateJustification(
    userId: string,
    formationName: string,
    domain: string,
    context?: string,
  ) {
    const geminiResponse = await this.geminiService.generateJustification(
      formationName,
      domain,
      context,
    );

    const chatMessage = this.chatMessageRepository.create({
      userId,
      message: `Justification pour: ${formationName}`,
      response: JSON.stringify(geminiResponse),
      intent: ChatIntent.GENERATE_JUSTIFICATION,
    });
    await this.chatMessageRepository.save(chatMessage);

    return geminiResponse;
  }

  async getHistory(userId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
