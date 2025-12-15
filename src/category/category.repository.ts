import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dtos';

@Injectable()
export class CategoryRepository {
  constructor(private prisma: PrismaService) {}

  getPrismaService(){
    return this.prisma;
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { name: dto.name },
    });
  }

  async findAllCategories() {
    return await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: { ...dto },
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }

  // --- USER CATEGORY PREFERENCES ---

  async findUserPreferences(userId: number) {
    return this.prisma.userCategoryPreference.findMany({
      where: { userId },
      include: { category: true },
    });
  }

  async deleteUserPreferences(userId: number) {
    return this.prisma.userCategoryPreference.deleteMany({
      where: { userId },
    });
  }

  async createUserPreferences(data: { userId: number; categoryId: number }[]) {
    return this.prisma.userCategoryPreference.createMany({ data });
  }
}
