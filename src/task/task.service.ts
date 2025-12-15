import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, CreateCommentDto, UpdateCommentDto } from './dto';
import { TaskStatus } from 'generated/prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  // ===================== TASK METHODS =====================

  async createTask(userId: number, dto: CreateTaskDto) {
    // Verify project exists and user is a member
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: {
        memberships: {
          where: { userId: userId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.memberships.length === 0) {
      throw new ForbiddenException('You must be a member of this project to create tasks');
    }

    // If assigneeId is provided, verify they are a member of the project
    if (dto.assigneeId) {
      const assigneeMembership = await this.prisma.membership.findUnique({
        where: {
          userId_projectId: {
            userId: dto.assigneeId,
            projectId: dto.projectId,
          },
        },
      });

      if (!assigneeMembership) {
        throw new BadRequestException('Assignee must be a member of this project');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority,
        projectId: dto.projectId,
        assigneeId: dto.assigneeId,
        createdById: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return task;
  }

  async getTaskById(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user is a member of the project
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member of this project to view tasks');
    }

    return task;
  }

  async getProjectTasks(projectId: number, userId: number) {
    // Verify project exists and user is a member
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          where: { userId: userId },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.memberships.length === 0) {
      throw new ForbiddenException('You must be a member of this project to view tasks');
    }

    const tasks = await this.prisma.task.findMany({
      where: { projectId: projectId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks;
  }

  async getMyTasks(userId: number) {
    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { createdById: userId },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks;
  }

  async updateTask(taskId: number, userId: number, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user is a member of the project
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member of this project to update tasks');
    }

    // If assigneeId is being changed, verify they are a member
    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId !== null) {
        const assigneeMembership = await this.prisma.membership.findUnique({
          where: {
            userId_projectId: {
              userId: dto.assigneeId,
              projectId: task.projectId,
            },
          },
        });

        if (!assigneeMembership) {
          throw new BadRequestException('Assignee must be a member of this project');
        }
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: dto,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedTask;
  }

  async deleteTask(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only project owner or task creator can delete tasks
    if (task.project.ownerId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('Only the project owner or task creator can delete this task');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }

  // ===================== COMMENT METHODS =====================

  async createComment(userId: number, dto: CreateCommentDto) {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user is a member of the project
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member of this project to comment on tasks');
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        content: dto.content,
        taskId: dto.taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return comment;
  }

  async getTaskComments(taskId: number, userId: number) {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user is a member of the project
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member of this project to view comments');
    }

    const comments = await this.prisma.taskComment.findMany({
      where: { taskId: taskId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments;
  }

  async updateComment(commentId: number, userId: number, dto: UpdateCommentDto) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only comment author can update
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updatedComment = await this.prisma.taskComment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only comment author or project owner can delete
    if (comment.authorId !== userId && comment.task.project.ownerId !== userId) {
      throw new ForbiddenException('Only the comment author or project owner can delete this comment');
    }

    await this.prisma.taskComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
  }
}
