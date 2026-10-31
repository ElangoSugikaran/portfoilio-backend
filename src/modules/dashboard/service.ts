import type { FastifyInstance } from 'fastify';
import type { DashboardOverviewResponse } from './schema.js';
import { analyticsService } from '../../services/analytics.service.js';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

export class DashboardService {
  constructor(private fastify: FastifyInstance) {}

  async getOverview(): Promise<DashboardOverviewResponse> {
    const prisma = this.fastify.prisma;

    // Start of current day (midnight UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Run parallel aggregation queries
    const [
      projectTotal,
      projectPublished,
      projectDraft,
      projectFeatured,
      messageUnread,
      messageTotal,
      messageToday,
      certTotal,
      certAcademic,
      certDigital,
      certVisible,
      skillsTotal,
      skillsVisible,
      settings,
      recentProjects,
      recentMessages,
      recentCerts,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'PUBLISHED' } }),
      prisma.project.count({ where: { status: 'DRAFT' } }),
      prisma.project.count({ where: { featured: true } }),

      prisma.message.count({ where: { isRead: false, isArchived: false } }),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: todayStart } } }),

      prisma.certificate.count(),
      prisma.certificate.count({ where: { category: 'ACADEMIC' } }),
      prisma.certificate.count({ where: { category: 'DIGITAL' } }),
      prisma.certificate.count({ where: { isVisible: true } }),

      prisma.technology.count(),
      prisma.technology.count({ where: { showInSkills: true } }),

      prisma.siteSettings.findUnique({ where: { id: 1 } }),

      prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, shortDescription: true, status: true, createdAt: true, updatedAt: true },
      }),

      prisma.message.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, subject: true, body: true, isRead: true, createdAt: true },
      }),

      prisma.certificate.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, issuer: true, category: true, createdAt: true, updatedAt: true },
      }),
    ]);

    const analytics = await analyticsService.getOverview(this.fastify.log);

    // Format UI Stats cards
    const stats: DashboardOverviewResponse['stats'] = [
      {
        title: 'Total Projects',
        value: projectTotal.toString(),
        icon: 'FolderKanban',
        description: `${projectPublished} Published · ${projectDraft} Drafts`,
      },
      {
        title: 'Unread Messages',
        value: messageUnread.toString(),
        icon: 'MessageSquare',
        description: messageToday > 0 ? `${messageToday} new today` : `${messageTotal} total received`,
      },
      {
        title: 'Page Views',
        value: analytics.status === 'connected' ? analytics.totals.pageViews.toLocaleString() : '—',
        icon: 'Eye',
        description: analytics.status === 'connected'
          ? 'Last 30 days · Google Analytics'
          : analytics.status === 'not_configured'
            ? 'Connect Google Analytics to see visitor data'
            : 'Google Analytics is temporarily unavailable',
      },
      {
        title: 'Certifications',
        value: certTotal.toString(),
        icon: 'Award',
        description: `${certAcademic} Academic · ${certDigital} Digital`,
      },
    ];

    // Build unified Recent Activity list
    const rawActivities = [
      ...recentProjects.map((p) => {
        const isNew = Math.abs(new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) < 5000;
        return {
          id: `proj-${p.id}`,
          type: 'PROJECT' as const,
          title: `${isNew ? 'Added' : 'Updated'} project "${p.title}"`,
          description: p.shortDescription || `Status: ${p.status}`,
          timestamp: new Date(p.updatedAt),
          timeAgo: formatRelativeTime(new Date(p.updatedAt)),
        };
      }),
      ...recentMessages.map((m) => ({
        id: `msg-${m.id}`,
        type: 'MESSAGE' as const,
        title: `New message from "${m.name}"`,
        description: m.subject || (m.body.length > 60 ? `${m.body.slice(0, 60)}...` : m.body),
        timestamp: new Date(m.createdAt),
        timeAgo: formatRelativeTime(new Date(m.createdAt)),
      })),
      ...recentCerts.map((c) => ({
        id: `cert-${c.id}`,
        type: 'CERTIFICATE' as const,
        title: `Added certificate "${c.title}"`,
        description: `Issued by ${c.issuer} (${c.category})`,
        timestamp: new Date(c.updatedAt),
        timeAgo: formatRelativeTime(new Date(c.updatedAt)),
      })),
    ];

    rawActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivity = rawActivities.slice(0, 6);

    return {
      stats,
      recentActivity,
      metrics: {
        projects: {
          total: projectTotal,
          published: projectPublished,
          draft: projectDraft,
          featured: projectFeatured,
        },
        messages: {
          unread: messageUnread,
          total: messageTotal,
          newToday: messageToday,
        },
        profileViews: {
          total: analytics.totals.pageViews,
          trend: analytics.range,
          isTrackingActive: analytics.status === 'connected',
        },
        analytics,
        certificates: {
          total: certTotal,
          academic: certAcademic,
          digital: certDigital,
          visible: certVisible,
        },
        skills: {
          total: skillsTotal,
          showInSkills: skillsVisible,
        },
      },
      visibilities: {
        showExperience: settings?.showExperience ?? true,
        showCertificates: settings?.showCertificates ?? true,
        totalVisibleProjects: projectPublished,
        totalVisibleSkills: skillsVisible,
      },
    };
  }
}
