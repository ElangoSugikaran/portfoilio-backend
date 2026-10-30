import type { FastifyInstance } from 'fastify';
import type { CreateEducationInput, UpdateEducationInput } from './schema.js';

/**
 * Service managing formal education entries (degrees, diplomas, training).
 */
export class EducationService {
  constructor(private fastify: FastifyInstance) {}

  async getAll(filter?: { all?: boolean; isVisible?: boolean; showOnHome?: boolean; home?: boolean }) {
    const visibleFilter = filter?.all
      ? {}
      : filter?.isVisible !== undefined
        ? { isVisible: filter.isVisible }
        : { isVisible: true };

    if (filter?.home) {
      const selectedHomeCount = await this.fastify.prisma.education.count({
        where: { ...visibleFilter, showOnHome: true },
      });

      return this.fastify.prisma.education.findMany({
        where: {
          ...visibleFilter,
          ...(selectedHomeCount > 0 ? { showOnHome: true } : {}),
        },
        orderBy: [
          { sortOrder: 'asc' },
          { startDate: 'desc' }
        ],
        take: 3,
      });
    }

    return await this.fastify.prisma.education.findMany({
      where: {
        ...visibleFilter,
        ...(filter?.showOnHome !== undefined ? { showOnHome: filter.showOnHome } : {})
      },
      orderBy: [
        { sortOrder: 'asc' },
        { startDate: 'desc' }
      ]
    });
  }

  async getById(id: string) {
    return await this.fastify.prisma.education.findUnique({
      where: { id }
    });
  }

  async create(data: CreateEducationInput) {
    return await this.fastify.prisma.education.create({
      data
    });
  }

  async update(id: string, data: UpdateEducationInput) {
    return await this.fastify.prisma.education.update({
      where: { id },
      data
    });
  }

  async reorder(orders: { id: string; sortOrder: number }[]) {
    return await this.fastify.prisma.$transaction(
      orders.map(item =>
        this.fastify.prisma.education.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    );
  }

  async delete(id: string) {
    return await this.fastify.prisma.education.delete({
      where: { id }
    });
  }
}
