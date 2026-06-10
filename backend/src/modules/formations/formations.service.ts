import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './formation.entity';
import { CreateFormationDto, UpdateFormationDto } from './dto';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private readonly formationRepository: Repository<Formation>,
  ) {}

  async findAll(): Promise<Formation[]> {
    return this.formationRepository.find({
      where: { isActive: true },
      order: { domain: 'ASC', name: 'ASC' },
    });
  }

  async getDomains(): Promise<string[]> {
    const results = await this.formationRepository
      .createQueryBuilder('formation')
      .select('DISTINCT formation.domain', 'domain')
      .where('formation.is_active = true')
      .orderBy('formation.domain', 'ASC')
      .getRawMany();
    return results.map((r) => r.domain);
  }

  async createDomain(name: string): Promise<{ domain: string }> {
    // Just return the domain name - it will be used when creating formations
    return { domain: name.trim() };
  }

  async renameDomain(oldName: string, newName: string): Promise<{ affected: number }> {
    const result = await this.formationRepository
      .createQueryBuilder()
      .update(Formation)
      .set({ domain: newName.trim() })
      .where('domain = :oldName AND is_active = true', { oldName })
      .execute();
    return { affected: result.affected || 0 };
  }

  async deleteDomain(name: string): Promise<{ message: string }> {
    const count = await this.formationRepository.count({
      where: { domain: name, isActive: true },
    });
    if (count > 0) {
      throw new NotFoundException(
        `Impossible de supprimer: ${count} formation(s) utilisent ce domaine. Déplacez-les d'abord.`,
      );
    }
    return { message: 'Domaine supprimé' };
  }

  async findById(id: string): Promise<Formation> {
    const formation = await this.formationRepository.findOne({
      where: { id },
    });

    if (!formation) {
      throw new NotFoundException('Formation non trouvée');
    }

    return formation;
  }

  async create(dto: CreateFormationDto): Promise<Formation> {
    const formation = this.formationRepository.create(dto);
    return this.formationRepository.save(formation);
  }

  async update(id: string, dto: UpdateFormationDto): Promise<Formation> {
    const formation = await this.findById(id);
    Object.assign(formation, dto);
    return this.formationRepository.save(formation);
  }

  async remove(id: string): Promise<void> {
    const formation = await this.findById(id);
    formation.isActive = false;
    await this.formationRepository.save(formation);
  }
}
