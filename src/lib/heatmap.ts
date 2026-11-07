/**
 * Pure GitHub-style calendar-year activity grid calculation for Leitner Knowledge Base.
 */

export interface HeatmapDay {
  dateStr: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapGridResult {
  weeks: HeatmapDay[][]; // 52-53 columns, 7 rows each
  monthLabels: Array<{ month: string; colIndex: number }>;
  totalActivities: number;
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  year: number;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function calculateRecallHeatmap(
  items: Array<{ createdAt?: string | Date | null; lastReviewedAt?: string | Date | null }>,
  targetYear: number = new Date().getFullYear(),
  referenceDate: Date = new Date()
): HeatmapGridResult {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);
  const isCurrentYear = targetYear === today.getFullYear();

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

  // Calculate start of calendar year grid (align to Sunday before or on Jan 1)
  const jan1 = new Date(targetYear, 0, 1);
  jan1.setHours(0, 0, 0, 0);
  const startDayOfWeek = jan1.getDay(); // 0 = Sun
  const startDate = new Date(jan1);
  startDate.setDate(startDate.getDate() - startDayOfWeek);

  // Calculate end of calendar year grid (align to Saturday after or on Dec 31)
  const dec31 = new Date(targetYear, 11, 31);
  dec31.setHours(0, 0, 0, 0);
  const endDayOfWeek = dec31.getDay();
  const endDate = new Date(dec31);
  endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  const weeks: HeatmapDay[][] = [];
  const monthLabels: Array<{ month: string; colIndex: number }> = [];
  let lastMonth = -1;

  let cursor = new Date(startDate);
  for (let w = 0; w < numWeeks; w++) {
    const week: HeatmapDay[] = [];

    // Detect month transition in this week column
    let monthForWeek = -1;
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(cursor);
      dayDate.setDate(dayDate.getDate() + d);
      if (dayDate.getFullYear() === targetYear && dayDate.getDate() === 1) {
        monthForWeek = dayDate.getMonth();
        break;
      }
    }
    if (w === 0 && monthForWeek === -1) {
      monthForWeek = 0; // Jan
    }

    if (monthForWeek !== -1 && monthForWeek !== lastMonth) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthLabels.push({
        month: monthNames[monthForWeek],
        colIndex: w,
      });
      lastMonth = monthForWeek;
    }

    for (let d = 0; d < 7; d++) {
      const dateStr = formatDate(cursor);
      const count = activityMap.get(dateStr) || 0;
      const isToday = isCurrentYear && dateStr === todayStr;
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

  // Calculate total activities and active days in the target year
  let totalActivities = 0;
  let activeDaysCount = 0;
  for (const week of weeks) {
    for (const day of week) {
      if (!day.isFuture) {
        // Only count days belonging to targetYear
        const dayYear = parseInt(day.dateStr.split("-")[0], 10);
        if (dayYear === targetYear) {
          totalActivities += day.count;
          if (day.count > 0) {
            activeDaysCount++;
          }
        }
      }
    }
  }

  // Streak calculations
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const dayList: HeatmapDay[] = [];
  for (const week of weeks) {
    for (const day of week) {
      if (!day.isFuture) {
        dayList.push(day);
      }
    }
  }

  // Current streak applies if inspecting current year
  if (isCurrentYear) {
    const todayIdx = dayList.findIndex((d) => d.isToday);
    if (todayIdx >= 0) {
      let checkIdx = todayIdx;
      if (dayList[checkIdx].count === 0 && checkIdx > 0 && dayList[checkIdx - 1].count > 0) {
        checkIdx = todayIdx - 1;
      }

      while (checkIdx >= 0 && dayList[checkIdx].count > 0) {
        currentStreak++;
        checkIdx--;
      }
    }
  }

  // Longest streak in target year
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
    activeDaysCount,
    year: targetYear,
  };
}
