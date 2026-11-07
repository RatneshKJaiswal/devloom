/**
 * Pure 12-week GitHub-style activity grid calculation for Leitner Knowledge Base.
 */

export interface HeatmapDay {
  dateStr: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapGridResult {
  weeks: HeatmapDay[][]; // 12 columns, 7 rows each
  monthLabels: Array<{ month: string; colIndex: number }>;
  totalActivities: number;
  currentStreak: number;
  longestStreak: number;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function calculateRecallHeatmap(
  items: Array<{ createdAt?: string | Date | null; lastReviewedAt?: string | Date | null }>,
  referenceDate: Date = new Date()
): HeatmapGridResult {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  // Map dates to activity counts
  const activityMap = new Map<string, number>();

  for (const item of items) {
    if (item.lastReviewedAt) {
      const d = new Date(item.lastReviewedAt);
      const str = formatDate(d);
      activityMap.set(str, (activityMap.get(str) || 0) + 1);
    }
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      const str = formatDate(d);
      activityMap.set(str, (activityMap.get(str) || 0) + 1);
    }
  }

  // Determine current day of week (0 = Sun, 6 = Sat)
  // End on the Saturday of the current week (or today's week end)
  const endOfWeek = new Date(today);
  const daysUntilSaturday = 6 - endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilSaturday);

  // 12 weeks = 84 days total
  const startDate = new Date(endOfWeek);
  startDate.setDate(startDate.getDate() - (12 * 7 - 1));

  const weeks: HeatmapDay[][] = [];
  const monthLabels: Array<{ month: string; colIndex: number }> = [];
  let lastMonth = -1;

  let cursor = new Date(startDate);
  for (let w = 0; w < 12; w++) {
    const week: HeatmapDay[] = [];

    // Check if new month starts in this week column
    const monthAtStartOfWeek = cursor.getMonth();
    if (monthAtStartOfWeek !== lastMonth) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthLabels.push({
        month: monthNames[monthAtStartOfWeek],
        colIndex: w,
      });
      lastMonth = monthAtStartOfWeek;
    }

    for (let d = 0; d < 7; d++) {
      const dateStr = formatDate(cursor);
      const count = activityMap.get(dateStr) || 0;
      const isToday = dateStr === todayStr;
      const isFuture = cursor.getTime() > today.getTime();

      week.push({
        dateStr,
        dayOfWeek: cursor.getDay(),
        count: isFuture ? 0 : count,
        isToday,
        isFuture,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  // Calculate total activities in the 12-week window
  let totalActivities = 0;
  for (const week of weeks) {
    for (const day of week) {
      if (!day.isFuture) {
        totalActivities += day.count;
      }
    }
  }

  // Calculate streaks backwards from today
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Streak check over the last 84 days up to today
  const dayList: HeatmapDay[] = [];
  for (const week of weeks) {
    for (const day of week) {
      if (!day.isFuture) {
        dayList.push(day);
      }
    }
  }

  // Current streak (consecutive active days leading up to today or yesterday)
  const todayIdx = dayList.findIndex((d) => d.isToday);
  if (todayIdx >= 0) {
    let checkIdx = todayIdx;
    // If no activity today, check if active yesterday
    if (dayList[checkIdx].count === 0 && checkIdx > 0 && dayList[checkIdx - 1].count > 0) {
      checkIdx = todayIdx - 1;
    }

    while (checkIdx >= 0 && dayList[checkIdx].count > 0) {
      currentStreak++;
      checkIdx--;
    }
  }

  // Longest streak
  for (const day of dayList) {
    if (day.count > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    weeks,
    monthLabels,
    totalActivities,
    currentStreak,
    longestStreak,
  };
}
