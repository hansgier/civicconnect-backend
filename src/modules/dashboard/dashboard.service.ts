import { prisma } from '../../config/database.js';
import { getCache, setCache } from '../../shared/utils/cache.js';

const DASHBOARD_CACHE_TTL = 300; // 5 minutes

class DashboardService {
  /**
   * Get all summary statistics in a single call.
   */
  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = getCache<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    // City population: sum of all barangay populations
    const populationResult = await prisma.barangay.aggregate({
      _sum: { population: true },
    });
    const cityPopulation = populationResult._sum.population ?? 0;

    // Project counts by status
    const statusCounts = await prisma.project.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalProjects = statusCounts.reduce((sum, s) => sum + s._count, 0);

    const statusDistribution: Record<string, number> = {};
    for (const s of statusCounts) {
      statusDistribution[s.status.toLowerCase()] = s._count;
    }

    const stats = {
      cityPopulation,
      totalProjects,
      completedProjects: statusDistribution['completed'] ?? 0,
      ongoingProjects: statusDistribution['ongoing'] ?? 0,
      cancelledProjects: statusDistribution['cancelled'] ?? 0,
      plannedProjects: statusDistribution['planned'] ?? 0,
      onHoldProjects: statusDistribution['on_hold'] ?? 0,
      approvedProposalProjects: statusDistribution['approved_proposal'] ?? 0,
      statusDistribution,
    };

    setCache(cacheKey, stats, DASHBOARD_CACHE_TTL);
    return stats;
  }

  /**
   * Monthly project creation trend for the last N months.
   */
  async getProjectTrends(months: number = 12) {
    const cacheKey = `dashboard:project-trends:${months}`;
    const cached = getCache<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await prisma.$queryRaw<
      { month: string; count: bigint }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::bigint AS count
      FROM projects
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    // Convert bigint to number and fill missing months
    const result = this.fillMissingMonths(
      trends.map((t) => ({ month: t.month, count: Number(t.count) })),
      months
    );

    // Calculate percentage change
    const currentMonth = result[result.length - 1]?.count ?? 0;
    const previousMonth = result[result.length - 2]?.count ?? 0;
    const percentChange =
      previousMonth > 0
        ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
        : 0;

    const data = { trends: result, percentChange };
    setCache(cacheKey, data, DASHBOARD_CACHE_TTL);
    return data;
  }

  /**
   * Monthly community engagement trend (approvals/reactions count).
   */
  async getEngagementTrends(months: number = 12) {
    const cacheKey = `dashboard:engagement-trends:${months}`;
    const cached = getCache<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await prisma.$queryRaw<
      { month: string; count: bigint }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::bigint AS count
      FROM reactions
      WHERE "createdAt" >= ${startDate}
        AND type = 'LIKE'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    const result = this.fillMissingMonths(
      trends.map((t) => ({ month: t.month, count: Number(t.count) })),
      months
    );

    const currentMonth = result[result.length - 1]?.count ?? 0;
    const previousMonth = result[result.length - 2]?.count ?? 0;
    const percentChange =
      previousMonth > 0
        ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
        : 0;

    const data = { trends: result, percentChange };
    setCache(cacheKey, data, DASHBOARD_CACHE_TTL);
    return data;
  }

  /**
   * Top N projects ranked by engagement score (approvals + comments).
   */
  async getTopProjects(limit: number = 5) {
    const cacheKey = `dashboard:top-projects:${limit}`;
    const cached = getCache<Record<string, unknown>[]>(cacheKey);
    if (cached) return cached;

    const projects = await prisma.$queryRaw<
      {
        id: string;
        title: string;
        status: string;
        category: string | null;
        approve_count: bigint;
        comment_count: bigint;
        score: bigint;
      }[]
    >`
      SELECT
        p.id,
        p.title,
        p.status,
        p.category,
        COALESCE(r.approve_count, 0) AS approve_count,
        COALESCE(c.comment_count, 0) AS comment_count,
        (COALESCE(r.approve_count, 0) + COALESCE(c.comment_count, 0)) AS score
      FROM projects p
      LEFT JOIN (
        SELECT "projectId", COUNT(*) AS approve_count
        FROM reactions
        WHERE type = 'LIKE' AND "projectId" IS NOT NULL
        GROUP BY "projectId"
      ) r ON r."projectId" = p.id
      LEFT JOIN (
        SELECT "projectId", COUNT(*) AS comment_count
        FROM comments
        GROUP BY "projectId"
      ) c ON c."projectId" = p.id
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    const result = projects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      category: p.category,
      approveCount: Number(p.approve_count),
      commentCount: Number(p.comment_count),
      score: Number(p.score),
    }));

    setCache(cacheKey, result, DASHBOARD_CACHE_TTL);
    return result;
  }

  /**
   * Get project status distribution trends over time.
   * Returns counts of each status per month for the last N months.
   */
  async getStatusTrends(months: number = 12) {
    const cacheKey = `dashboard:status-trends:${months}`;
    const cached = getCache<Record<string, number | string>[]>(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Query projects grouped by month and status
    const trends = await prisma.$queryRaw<
      { month: string; status: string; count: bigint }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        status,
        COUNT(*)::bigint AS count
      FROM projects
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('month', "createdAt"), status
      ORDER BY month ASC, status ASC
    `;

    // Get all unique statuses
    const statuses = ['ONGOING', 'COMPLETED', 'PLANNED', 'APPROVED_PROPOSAL', 'ON_HOLD', 'CANCELLED'];

    // Fill missing months and organize by status
    const monthKeys: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthKeys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    // Create result structure with all statuses initialized to 0
    const result = monthKeys.map((month) => {
      const monthData: Record<string, number | string> = { month };
      for (const status of statuses) {
        monthData[status.toLowerCase()] = 0;
      }
      return monthData;
    });

    // Fill in actual counts from query
    for (const row of trends) {
      const monthIndex = monthKeys.indexOf(row.month);
      if (monthIndex !== -1) {
        result[monthIndex][row.status.toLowerCase()] = Number(row.count);
      }
    }

    setCache(cacheKey, result, DASHBOARD_CACHE_TTL);
    return result;
  }

  /**
   * Top N projects with the most disapprovals.
   */
  async getWorstProjects(limit: number = 5) {
    const cacheKey = `dashboard:worst-projects:${limit}`;
    const cached = getCache<Record<string, unknown>[]>(cacheKey);
    if (cached) return cached;

    const projects = await prisma.$queryRaw<
      {
        id: string;
        title: string;
        status: string;
        category: string | null;
        disapprove_count: bigint;
      }[]
    >`
      SELECT
        p.id,
        p.title,
        p.status,
        p.category,
        COUNT(r.id) AS disapprove_count
      FROM projects p
      INNER JOIN reactions r ON r."projectId" = p.id AND r.type = 'DISLIKE'
      GROUP BY p.id, p.title, p.status, p.category
      ORDER BY disapprove_count DESC
      LIMIT ${limit}
    `;

    const result = projects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      category: p.category,
      disapproveCount: Number(p.disapprove_count),
    }));

    setCache(cacheKey, result, DASHBOARD_CACHE_TTL);
    return result;
  }

  /**
   * Helper: Fill missing months in trend data with zero counts.
   */
  private fillMissingMonths(
    data: { month: string; count: number }[],
    totalMonths: number
  ): { month: string; count: number }[] {
    const result: { month: string; count: number }[] = [];
    const dataMap = new Map(data.map((d) => [d.month, d.count]));

    for (let i = totalMonths - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: key, count: dataMap.get(key) ?? 0 });
    }

    return result;
  }
}

export const dashboardService = new DashboardService();
