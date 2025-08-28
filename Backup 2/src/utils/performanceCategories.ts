export interface PerformanceCategory {
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  range: string;
}

export const performanceCategories: PerformanceCategory[] = [
  {
    name: 'Critical',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    range: '0-66%'
  },
  {
    name: 'Bad',
    color: '#F59E0B',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    range: '67-83%'
  },
  {
    name: 'Target',
    color: '#10B981',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    range: '84-119%'
  },
  {
    name: 'Good',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    range: '120%+'
  }
];

export const getPerformanceCategory = (achievementPercentage: number): PerformanceCategory => {
  if (achievementPercentage <= 66) {
    return performanceCategories[0]; // Critical
  } else if (achievementPercentage <= 83) {
    return performanceCategories[1]; // Bad
  } else if (achievementPercentage <= 119) {
    return performanceCategories[2]; // Target
  } else {
    return performanceCategories[3]; // Good
  }
};

export const getPerformanceCategoryStats = (records: any[], targets: any[]) => {
  const stats = {
    critical: 0,
    bad: 0,
    target: 0,
    good: 0,
    total: 0
  };

  const kpiNames = ['outreaches', 'live_links', 'high_da_links', 'content_distribution', 'new_blogs', 'blog_optimizations', 'top_5_keywords'];
  
  records.forEach(record => {
    kpiNames.forEach(kpiName => {
      const target = targets.find(t => t.kpi_name === kpiName);
      if (target && target.monthly_target > 0) {
        const achievement = Math.round((record[kpiName] / target.monthly_target) * 100);
        const category = getPerformanceCategory(achievement);
        
        stats.total++;
        switch (category.name) {
          case 'Critical':
            stats.critical++;
            break;
          case 'Bad':
            stats.bad++;
            break;
          case 'Target':
            stats.target++;
            break;
          case 'Good':
            stats.good++;
            break;
        }
      }
    });
  });

  return stats;
};