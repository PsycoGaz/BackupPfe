import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingRequest } from '../training-requests/training-request.entity';
import { Formation } from '../formations/formation.entity';
import { RequestStatus } from '../../common/enums';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(TrainingRequest)
    private readonly requestRepository: Repository<TrainingRequest>,
    @InjectRepository(Formation)
    private readonly formationRepository: Repository<Formation>,
  ) {}

  async getDashboardStats() {
    // 1. Most requested formations (top 10)
    const topFormations = await this.requestRepository
      .createQueryBuilder('r')
      .select('r.formation_id', 'formationId')
      .addSelect('f.name', 'formationName')
      .addSelect('f.domain', 'domain')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('formations', 'f', 'f.id = r.formation_id')
      .where('r.formation_id IS NOT NULL')
      .groupBy('r.formation_id')
      .addGroupBy('f.name')
      .addGroupBy('f.domain')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // 2. Budget by domain (estimated cost * approved request count)
    const budgetByDomain = await this.requestRepository
      .createQueryBuilder('r')
      .select('COALESCE(r.domain, f.domain)', 'domain')
      .addSelect('SUM(COALESCE(f.estimated_cost, 0))', 'totalBudget')
      .addSelect('COUNT(*)', 'requestCount')
      .leftJoin('formations', 'f', 'f.id = r.formation_id')
      .where('r.status = :status', { status: RequestStatus.APPROUVEE })
      .groupBy('COALESCE(r.domain, f.domain)')
      .orderBy('"totalBudget"', 'DESC')
      .getRawMany();

    // 3. Approval rate
    const totalDecided = await this.requestRepository.count({
      where: [
        { status: RequestStatus.APPROUVEE },
        { status: RequestStatus.REFUSEE_MANAGER },
        { status: RequestStatus.REFUSEE_RH },
      ],
    });
    const totalApproved = await this.requestRepository.count({
      where: { status: RequestStatus.APPROUVEE },
    });
    const approvalRate = totalDecided > 0 ? Math.round((totalApproved / totalDecided) * 100) : 0;

    // 4. Average processing time (from creation to final decision)
    const avgTimeResult = await this.requestRepository
      .createQueryBuilder('r')
      .select('AVG(EXTRACT(EPOCH FROM (r.updated_at - r.created_at)) / 86400)', 'avgDays')
      .where('r.status IN (:...statuses)', {
        statuses: [RequestStatus.APPROUVEE, RequestStatus.REFUSEE_MANAGER, RequestStatus.REFUSEE_RH],
      })
      .getRawOne();
    const avgProcessingDays = avgTimeResult?.avgDays
      ? parseFloat(parseFloat(avgTimeResult.avgDays).toFixed(1))
      : 0;

    // 5. Status distribution
    const statusDistribution = await this.requestRepository
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany();

    // 6. Total budget envelope (sum of all estimated costs of active formations)
    const totalEnvelopeResult = await this.formationRepository
      .createQueryBuilder('f')
      .select('SUM(f.estimated_cost)', 'total')
      .where('f.is_active = true AND f.estimated_cost IS NOT NULL')
      .getRawOne();
    const totalEnvelope = parseFloat(totalEnvelopeResult?.total || '0');

    // 7. Engaged budget (approved requests with cost)
    const engagedBudgetResult = await this.requestRepository
      .createQueryBuilder('r')
      .select('SUM(COALESCE(f.estimated_cost, 0))', 'total')
      .leftJoin('formations', 'f', 'f.id = r.formation_id')
      .where('r.status = :status', { status: RequestStatus.APPROUVEE })
      .getRawOne();
    const engagedBudget = parseFloat(engagedBudgetResult?.total || '0');

    // 8. Monthly request count (last 6 months)
    const monthlyRequests = await this.requestRepository
      .createQueryBuilder('r')
      .select("TO_CHAR(r.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where("r.created_at >= NOW() - INTERVAL '6 months'")
      .groupBy("TO_CHAR(r.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      topFormations,
      budgetByDomain,
      approvalRate,
      avgProcessingDays,
      statusDistribution,
      totalEnvelope,
      engagedBudget,
      monthlyRequests,
    };
  }

  async exportCsv(status?: string, domain?: string): Promise<string> {
    const qb = this.requestRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.createdByUser', 'u')
      .leftJoinAndSelect('r.formation', 'f')
      .orderBy('r.created_at', 'DESC');

    if (status) {
      qb.andWhere('r.status = :status', { status });
    }
    if (domain) {
      qb.andWhere('(r.domain = :domain OR f.domain = :domain)', { domain });
    }

    const requests = await qb.getMany();

    const headers = [
      'ID',
      'Date',
      'Demandeur',
      'Type',
      'Formation',
      'Domaine',
      'Statut',
      'Date d\u00e9but',
      'Date fin',
      'Co\u00fbt estim\u00e9',
      'Justification',
    ];

    const rows = requests.map((r) => [
      r.id,
      new Date(r.createdAt).toLocaleDateString('fr-FR'),
      r.createdByUser
        ? `${r.createdByUser.firstName} ${r.createdByUser.lastName}`
        : '',
      r.requestType,
      r.formation?.name || r.customFormationName || '',
      r.formation?.domain || r.domain || '',
      r.status,
      r.desiredStartDate,
      r.desiredEndDate || '',
      r.formation?.estimatedCost != null ? r.formation.estimatedCost.toString() : '',
      (r.justification || '').replace(/"/g, '""'),
    ]);

    const csvLines = [
      headers.join(';'),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(';'),
      ),
    ];

    return csvLines.join('\n');
  }
}
