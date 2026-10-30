import { z } from 'zod';

export const dashboardStatItemSchema = z.object({
  title: z.string(),
  value: z.string(),
  icon: z.enum(['FolderKanban', 'MessageSquare', 'Eye', 'Award', 'Code2', 'Briefcase']),
  description: z.string(),
});

export const recentActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['PROJECT', 'MESSAGE', 'CERTIFICATE', 'SKILL']),
  title: z.string(),
  description: z.string(),
  timeAgo: z.string(),
  timestamp: z.date(),
});

export const dashboardOverviewResponseSchema = z.object({
  stats: z.array(dashboardStatItemSchema),
  recentActivity: z.array(recentActivityItemSchema),
  metrics: z.object({
    projects: z.object({
      total: z.number(),
      published: z.number(),
      draft: z.number(),
      featured: z.number(),
    }),
    messages: z.object({
      unread: z.number(),
      total: z.number(),
      newToday: z.number(),
    }),
    profileViews: z.object({
      total: z.number(),
      trend: z.string(),
      isTrackingActive: z.boolean(),
    }),
    certificates: z.object({
      total: z.number(),
      academic: z.number(),
      digital: z.number(),
      visible: z.number(),
    }),
    skills: z.object({
      total: z.number(),
      showInSkills: z.number(),
    }),
  }),
  visibilities: z.object({
    showExperience: z.boolean(),
    showCertificates: z.boolean(),
    totalVisibleProjects: z.number(),
    totalVisibleSkills: z.number(),
  }),
});

export type DashboardOverviewResponse = z.infer<typeof dashboardOverviewResponseSchema>;
