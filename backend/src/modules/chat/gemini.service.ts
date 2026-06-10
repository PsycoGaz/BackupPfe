import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiResponse {
  intent: string;
  data: any;
  message: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = 'gemini-2.0-flash';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async analyzeMessage(userMessage: string, catalog?: string, userRequests?: string): Promise<GeminiResponse> {
    const prompt = this.buildAnalysisPrompt(userMessage, catalog, userRequests);

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return this.parseResponse(response);
    } catch (error) {
      this.logger.error(`Gemini API error: ${error.message}`);
      return {
        intent: 'GENERAL',
        data: null,
        message:
          'Désolé, je n\'ai pas pu analyser votre demande. Pouvez-vous reformuler ?',
      };
    }
  }

  async recommendFormations(userNeed: string, catalog?: string): Promise<GeminiResponse> {
    const prompt = this.buildRecommendationPrompt(userNeed, catalog);

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return this.parseResponse(response);
    } catch (error) {
      this.logger.error(`Gemini recommendation error: ${error.message}`);
      return {
        intent: 'RECOMMEND_FORMATIONS',
        data: { recommendations: [] },
        message: 'Je n\'ai pas pu générer de recommandations pour le moment.',
      };
    }
  }

  async generateJustification(
    formationName: string,
    domain: string,
    context?: string,
  ): Promise<GeminiResponse> {
    const prompt = this.buildJustificationPrompt(
      formationName,
      domain,
      context,
    );

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return this.parseResponse(response);
    } catch (error) {
      this.logger.error(`Gemini justification error: ${error.message}`);
      return {
        intent: 'GENERATE_JUSTIFICATION',
        data: { justification: '' },
        message: 'Je n\'ai pas pu générer de justification pour le moment.',
      };
    }
  }

  private buildAnalysisPrompt(userMessage: string, catalog?: string, userRequests?: string): string {
    return `Tu es un assistant RH intelligent spécialisé dans la gestion des demandes de formation en entreprise.
Tu ne réponds QU'AUX questions liées aux formations, demandes de formation, compétences professionnelles et processus RH.
Si l'utilisateur pose une question hors de ce contexte, réponds poliment que tu ne peux l'aider que sur les sujets liés à la formation professionnelle.

=== CATALOGUE DE FORMATIONS DISPONIBLES ===
${catalog || 'Catalogue non disponible'}

=== DEMANDES RÉCENTES DE L'UTILISATEUR ===
${userRequests || 'Aucune demande'}

=== MESSAGE DE L'UTILISATEUR ===
"${userMessage}"

Règles :
1. Détecte l'intention parmi : CREATE_TRAINING_REQUEST, RECOMMEND_FORMATIONS, GENERATE_JUSTIFICATION, GENERAL
2. Si l'intention est CREATE_TRAINING_REQUEST, extrais les champs suivants :
   - requestType: "CATALOGUE" (si la formation existe dans le catalogue ci-dessus) ou "NOUVELLE" (sinon)
   - formationName: nom de la formation détectée
   - formationId: l'identifiant de la formation si elle existe dans le catalogue, sinon null
   - domain: domaine détecté
   - desiredStartDate: date détectée au format YYYY-MM-DD ou null
   - justification: justification si mentionnée, sinon null
3. Si l'intention est RECOMMEND_FORMATIONS, recommande EN PRIORITÉ des formations du catalogue ci-dessus. Tu peux aussi suggérer des formations supplémentaires.
4. Si l'intention est GENERATE_JUSTIFICATION, génère une justification professionnelle
5. Pour les questions GENERAL, réponds uniquement dans le contexte RH/formation

Retourne UNIQUEMENT un JSON valide au format :
{
  "intent": "...",
  "data": { ... },
  "message": "un message court et utile pour l'utilisateur"
}

Ne retourne rien d'autre que le JSON.`;
  }

  private buildRecommendationPrompt(userNeed: string, catalog?: string): string {
    return `Tu es un assistant RH. L'utilisateur exprime un besoin de formation.

=== CATALOGUE DE FORMATIONS DISPONIBLES ===
${catalog || 'Catalogue non disponible'}

Besoin de l'utilisateur : "${userNeed}"

Règles :
- Recommande EN PRIORITÉ des formations qui existent dans le catalogue ci-dessus
- Tu peux aussi suggérer 1-2 formations supplémentaires qui n'existent pas encore dans le catalogue
- Indique clairement si une formation est "dans le catalogue" ou "suggestion externe"

Retourne UNIQUEMENT un JSON valide :
{
  "intent": "RECOMMEND_FORMATIONS",
  "data": {
    "recommendations": [
      { "name": "...", "domain": "...", "reason": "...", "inCatalog": true/false }
    ]
  },
  "message": "Voici mes recommandations basées sur votre besoin."
}`;
  }

  private buildJustificationPrompt(
    formationName: string,
    domain: string,
    context?: string,
  ): string {
    return `Tu es un assistant RH. Génère une justification professionnelle courte (3-4 phrases) pour une demande de formation.

Formation : "${formationName}"
Domaine : "${domain}"
${context ? `Contexte additionnel : "${context}"` : ''}

La justification doit :
- Être professionnelle et adaptée à un contexte RH
- Mentionner les bénéfices pour l'entreprise
- Rester concise (max 4 phrases)

Retourne UNIQUEMENT un JSON valide :
{
  "intent": "GENERATE_JUSTIFICATION",
  "data": {
    "justification": "..."
  },
  "message": "Voici une justification pour votre demande."
}`;
  }

  private parseResponse(response: string): GeminiResponse {
    try {
      // Clean potential markdown code blocks
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleaned);
    } catch {
      return {
        intent: 'GENERAL',
        data: null,
        message: response,
      };
    }
  }
}
