import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto';
import { ApplicationStatus } from 'generated/prisma/client';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async createApplication(userId: number, dto: CreateApplicationDto) {
    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is already a member of the project
    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: dto.projectId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of this project');
    }

    // Check if user has already applied
    const existingApplication = await this.prisma.application.findFirst({
      where: {
        userId: userId,
        projectId: dto.projectId,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this project');
    }

    const application = await this.prisma.application.create({
      data: {
        userId: userId,
        projectId: dto.projectId,
        role: dto.role,
        skills: dto.skills,
        reasonForJoining: dto.reasonForJoining,
        availability: dto.availability,
      },
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
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
          },
        },
      },
    });

    return application;
  }

  async getApplicationById(applicationId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            bio: true,
            location: true,
            availability: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            ownerId: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async getUserApplications(userId: number) {
    const applications = await this.prisma.application.findMany({
      where: { userId: userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            tags: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return applications;
  }

  async getProjectApplications(projectId: number, userId: number) {
    // Verify that the user is the project owner
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'You can only view applications for your own projects',
      );
    }

    const applications = await this.prisma.application.findMany({
      where: { projectId: projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            bio: true,
            location: true,
            availability: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return applications;
  }

  async updateApplication(
    userId: number,
    applicationId: number,
    dto: UpdateApplicationDto,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only the applicant can update their application details (not status)
    // Only the project owner can update the status
    if (dto.status) {
      if (application.project.ownerId !== userId) {
        throw new ForbiddenException(
          'Only the project owner can update application status',
        );
      }
    } else {
      if (application.userId !== userId) {
        throw new ForbiddenException(
          'You can only update your own applications',
        );
      }
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        ...(dto.role && { role: dto.role }),
        ...(dto.skills && { skills: dto.skills }),
        ...(dto.reasonForJoining && { reasonForJoining: dto.reasonForJoining }),
        ...(dto.availability && { availability: dto.availability }),
        ...(dto.status && { status: dto.status }),
      },
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
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    return updatedApplication;
  }

  async acceptApplication(applicationId: number, userId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can accept applications',
      );
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending applications can be accepted',
      );
    }

    // Use transaction to update application and create membership
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.ACCEPTED },
      });

      const membership = await tx.membership.create({
        data: {
          userId: application.userId,
          projectId: application.projectId,
          role: application.role,
          status: 'active',
        },
      });

      return { application: updatedApplication, membership };
    });

    return result;
  }

  async rejectApplication(applicationId: number, userId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { project: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.project.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can reject applications',
      );
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending applications can be rejected',
      );
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.REJECTED },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedApplication;
  }

  async withdrawApplication(applicationId: number, userId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.userId !== userId) {
      throw new ForbiddenException('You can only withdraw your own applications');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be withdrawn');
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    });

    return updatedApplication;
  }

  async deleteApplication(applicationId: number, userId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.userId !== userId) {
      throw new ForbiddenException('You can only delete your own applications');
    }

    await this.prisma.application.delete({
      where: { id: applicationId },
    });

    return { message: 'Application deleted successfully' };
  }
}
