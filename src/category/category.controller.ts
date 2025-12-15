import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, UpdatePreferencesDto } from './dto/category.dtos';
import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import type { User } from 'generated/prisma';

@Controller('categories')
@UseGuards(JwtGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAll() {
    console.log('get all hit');
    return await this.categoryService.getAllCategories();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @Get('preferences')
  async getUserCategoryPreferences(@GetUser('id') userId: number) {
    return await this.categoryService.getUserPreferences(userId);
  }

  @Patch('preferences')
  async updateCategoryPreferences(
    @GetUser() user: User,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const res = await this.categoryService.updateUserPreferences(user.id, dto);
    if(!user.isOnboarded){
      await this.categoryService.setOnboardingTrue(user.id);
    }
    return res;
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.getCategoryById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteCategory(id);
  }
}
