import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto, UpdatePreferencesDto } from './dto/category.dtos';

@Injectable()
export class CategoryService {
  constructor(private readonly repo: CategoryRepository) { }
  async createCategory(dto: CreateCategoryDto) {
    return await this.repo.createCategory(dto);
  }

  async getAllCategories() {
    return await this.repo.findAllCategories();
  }

  async getCategoryById(id: number) {
    const category = await this.repo.findCategoryById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.getCategoryById(id); // ensure it exists
    return this.repo.updateCategory(id, dto);
  }

  async deleteCategory(id: number) {
    await this.getCategoryById(id);
    await this.repo.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }

  async getUserPreferences(userId: number) {
    const preferences = await this.repo.findUserPreferences(userId);
    return preferences.map((p) => p.category);
  }

  async updateUserPreferences(userId: number, dto: UpdatePreferencesDto) {
    await this.repo.deleteUserPreferences(userId);

    const data = dto.categoryIds.map((categoryId) => ({
      userId,
      categoryId,
    }));


    await this.repo.createUserPreferences(data);

    return await this.getUserPreferences(userId);
  }
  async setOnboardingTrue(userId: number) {
    await this.repo.getPrismaService().user.update({
      where: { id: userId },              // the user ID
      data: { isOnboarded: true }, // set onboarding to true
    });
  }
}
