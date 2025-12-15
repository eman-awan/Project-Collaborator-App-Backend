import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async createProject(userId: number, dto: CreateProjectDto) {
    try {
      // Ensure category exists, create if it doesn't
      await this.prisma.category.upsert({
        where: { name: dto.category },
        update: {},
        create: { name: dto.category },
      });

      const project = await this.prisma.project.create({
        data: {
          title: dto.title,
          description: dto.description,
          category: dto.category,
          tags: dto.tags,
          requiredSkills: dto.requiredSkills,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          ownerId: userId,
          memberships: {
            create: {
              userId: userId,
              role: 'Owner',
              status: 'active',
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          applications: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return project;
    } catch (error) {
      throw error;
    }
  }

  async getAllProjects(userId?: number) {
    const projects = await this.prisma.project.findMany({
      where: {
        archived: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            memberships: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  async getProjectById(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            availability: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                availability: true,
              },
            },
          },
        },
        applications: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                availability: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async updateProject(userId: number, projectId: number, dto: UpdateProjectDto) {
    // Check if project exists and user is the owner
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.category && { category: dto.category }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.requiredSkills && { requiredSkills: dto.requiredSkills }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.archived !== undefined && { archived: dto.archived }),
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        applications: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return updatedProject;
  }

  async deleteProject(userId: number, projectId: number) {
    // Check if project exists and user is the owner
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own projects');
    }

    // Use transaction to delete all related records first, then the project
    await this.prisma.$transaction(async (tx) => {
      // Delete all applications for this project
      await tx.application.deleteMany({
        where: { projectId: projectId },
      });

      // Delete all memberships for this project
      await tx.membership.deleteMany({
        where: { projectId: projectId },
      });

      // Finally delete the project
      await tx.project.delete({
        where: { id: projectId },
      });
    });

    return { message: 'Project deleted successfully' };
  }

  async getUserProjects(userId: number) {
    const projects = await this.prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            memberships: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  async archiveProject(userId: number, projectId: number) {
    return this.updateProject(userId, projectId, { archived: true });
  }

  async unarchiveProject(userId: number, projectId: number) {
    return this.updateProject(userId, projectId, { archived: false });
  }
}