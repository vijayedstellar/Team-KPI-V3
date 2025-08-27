import type { PerformanceRecord, KPITarget } from '../lib/supabase';
import { getPerformanceCategory } from './performanceCategories';

export interface ActionItem {
  id: string;
  kpi: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendations: string[];
  priority: number; // 1-5, 1 being highest priority
}

export interface PerformanceTrend {
  kpi: string;
  current: number;
  previous: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
}

const KPI_RECOMMENDATIONS = {
  outreaches: {
    critical: {
      title: "Outreach Performance Critical - Immediate Action Required",
      recommendations: [
        "Review and update outreach templates for better engagement",
        "Analyze competitor outreach strategies and adapt successful approaches",
        "Implement automated outreach tools to increase volume",
        "Schedule daily outreach blocks (2-3 hours minimum)",
        "Create personalized outreach sequences for different prospect types",
        "Review and expand prospect database with high-quality targets"
      ]
    },
    bad: {
      title: "Outreach Performance Below Target - Needs Improvement",
      recommendations: [
        "A/B test different subject lines and email templates",
        "Increase daily outreach target by 25%",
        "Focus on building relationships before pitching",
        "Research prospects more thoroughly for personalization",
        "Follow up consistently with previous outreach attempts"
      ]
    },
    target: {
      title: "Outreach Performance On Track - Maintain Momentum",
      recommendations: [
        "Continue current outreach strategies",
        "Document successful outreach templates for team sharing",
        "Explore new outreach channels (LinkedIn, Twitter, etc.)",
        "Build relationships with key industry contacts"
      ]
    },
    good: {
      title: "Excellent Outreach Performance - Scale Success",
      recommendations: [
        "Share successful strategies with team members",
        "Mentor other analysts on outreach best practices",
        "Explore premium outreach opportunities",
        "Focus on building long-term industry relationships"
      ]
    }
  },
  live_links: {
    critical: {
      title: "Link Acquisition Critical - Immediate Intervention Required",
      recommendations: [
        "Review outreach-to-link conversion rates and identify bottlenecks",
        "Focus on relationship building before link requests",
        "Improve content quality to increase link-worthy assets",
        "Analyze successful link placements and replicate approach",
        "Consider guest posting opportunities for easier link acquisition",
        "Schedule weekly follow-ups with promising prospects"
      ]
    },
    bad: {
      title: "Link Acquisition Below Target - Strategy Review Needed",
      recommendations: [
        "Analyze rejection reasons and address common objections",
        "Improve value proposition in outreach messages",
        "Focus on building relationships before asking for links",
        "Create more linkable assets (infographics, studies, tools)",
        "Target lower-competition, niche-specific opportunities"
      ]
    },
    target: {
      title: "Link Acquisition On Target - Optimize for Quality",
      recommendations: [
        "Maintain current link building strategies",
        "Focus on acquiring higher authority links",
        "Build relationships for future link opportunities",
        "Document successful link building tactics"
      ]
    },
    good: {
      title: "Outstanding Link Acquisition - Maximize Impact",
      recommendations: [
        "Focus on high-authority, industry-leading publications",
        "Develop thought leadership content for premium placements",
        "Build strategic partnerships for ongoing link opportunities",
        "Share successful link building strategies with team"
      ]
    }
  },
  high_da_links: {
    critical: {
      title: "High DA Link Acquisition Critical - Strategic Overhaul Needed",
      recommendations: [
        "Research and target top-tier publications in your industry",
        "Develop thought leadership content worthy of high-DA sites",
        "Build relationships with editors at major publications",
        "Create comprehensive, data-driven content that attracts high-DA links",
        "Consider HARO (Help a Reporter Out) for media opportunities",
        "Analyze competitors' high-DA backlinks for targeting ideas"
      ]
    },
    bad: {
      title: "High DA Links Below Target - Quality Focus Required",
      recommendations: [
        "Prioritize relationship building with high-authority site editors",
        "Create exceptional, newsworthy content",
        "Participate in industry events and conferences for networking",
        "Develop original research and data studies",
        "Focus on fewer, higher-quality outreach attempts"
      ]
    },
    target: {
      title: "High DA Link Performance On Track - Maintain Standards",
      recommendations: [
        "Continue targeting high-authority publications",
        "Maintain relationships with key industry contacts",
        "Focus on creating exceptional, shareable content",
        "Document successful high-DA link strategies"
      ]
    },
    good: {
      title: "Exceptional High DA Link Performance - Industry Leadership",
      recommendations: [
        "Establish yourself as a thought leader in the industry",
        "Speak at conferences and industry events",
        "Develop strategic partnerships with major publications",
        "Mentor team members on high-DA link acquisition"
      ]
    }
  },
  content_distribution: {
    critical: {
      title: "Content Distribution Critical - Multi-Channel Strategy Needed",
      recommendations: [
        "Audit current distribution channels and identify gaps",
        "Develop a comprehensive content distribution calendar",
        "Automate social media posting with scheduling tools",
        "Build email lists for content promotion",
        "Engage with industry communities and forums",
        "Repurpose content for different platforms and formats"
      ]
    },
    bad: {
      title: "Content Distribution Below Target - Channel Expansion Required",
      recommendations: [
        "Increase posting frequency across all channels",
        "Explore new distribution platforms (Reddit, Quora, industry forums)",
        "Build relationships with influencers for content amplification",
        "Create platform-specific content variations",
        "Implement content syndication strategies"
      ]
    },
    target: {
      title: "Content Distribution On Track - Optimize Engagement",
      recommendations: [
        "Focus on improving engagement rates on existing channels",
        "Analyze best-performing content and replicate success",
        "Build community around your content",
        "Experiment with new content formats"
      ]
    },
    good: {
      title: "Excellent Content Distribution - Maximize Reach",
      recommendations: [
        "Develop strategic partnerships for content amplification",
        "Create viral-worthy content campaigns",
        "Build thought leadership through consistent, valuable content",
        "Share distribution strategies with team members"
      ]
    }
  },
  new_blogs: {
    critical: {
      title: "Blog Content Creation Critical - Production Ramp-Up Required",
      recommendations: [
        "Develop a structured content calendar with daily writing goals",
        "Use content templates to speed up creation process",
        "Repurpose existing content into new blog formats",
        "Collaborate with subject matter experts for faster content creation",
        "Implement content batching techniques",
        "Consider outsourcing research to focus on writing"
      ]
    },
    bad: {
      title: "Blog Creation Below Target - Workflow Optimization Needed",
      recommendations: [
        "Streamline content creation workflow",
        "Create content templates for common topics",
        "Batch similar content creation tasks",
        "Set daily writing goals and track progress",
        "Use AI tools to assist with research and outlining"
      ]
    },
    target: {
      title: "Blog Creation On Track - Quality Focus",
      recommendations: [
        "Maintain current content creation pace",
        "Focus on improving content quality and depth",
        "Optimize content for search engines",
        "Track content performance and iterate"
      ]
    },
    good: {
      title: "Outstanding Blog Production - Content Leadership",
      recommendations: [
        "Focus on creating comprehensive, authoritative content",
        "Develop content series and pillar pages",
        "Share content creation best practices with team",
        "Explore advanced content formats (interactive, multimedia)"
      ]
    }
  },
  blog_optimizations: {
    critical: {
      title: "Blog Optimization Critical - Technical SEO Audit Required",
      recommendations: [
        "Conduct comprehensive technical SEO audit of existing content",
        "Prioritize optimization of highest-traffic pages first",
        "Update meta titles, descriptions, and header tags",
        "Improve internal linking structure",
        "Optimize page loading speeds and mobile responsiveness",
        "Add schema markup to improve search visibility"
      ]
    },
    bad: {
      title: "Blog Optimization Below Target - Systematic Approach Needed",
      recommendations: [
        "Create optimization checklist and follow systematically",
        "Focus on pages with highest potential impact",
        "Update outdated content with fresh information",
        "Improve keyword targeting and content structure",
        "Add relevant internal and external links"
      ]
    },
    target: {
      title: "Blog Optimization On Track - Maintain Quality",
      recommendations: [
        "Continue systematic optimization approach",
        "Monitor optimization impact on search rankings",
        "Focus on user experience improvements",
        "Document successful optimization strategies"
      ]
    },
    good: {
      title: "Excellent Blog Optimization - Advanced Techniques",
      recommendations: [
        "Implement advanced SEO techniques (topic clusters, semantic SEO)",
        "Focus on featured snippet optimization",
        "Develop comprehensive content hubs",
        "Share optimization expertise with team members"
      ]
    }
  },
  top_5_keywords: {
    critical: {
      title: "Keyword Rankings Critical - SEO Strategy Overhaul Required",
      recommendations: [
        "Conduct comprehensive keyword research and competitive analysis",
        "Audit current content for keyword optimization opportunities",
        "Develop targeted content for priority keywords",
        "Improve technical SEO foundation (site speed, mobile, crawlability)",
        "Build topical authority through comprehensive content coverage",
        "Analyze SERP features and optimize for featured snippets"
      ]
    },
    bad: {
      title: "Keyword Rankings Below Target - Focused Optimization Required",
      recommendations: [
        "Prioritize optimization of pages closest to top 5 rankings",
        "Improve content quality and comprehensiveness",
        "Build more relevant backlinks to target pages",
        "Optimize for user intent and search experience",
        "Monitor competitor strategies and adapt successful tactics"
      ]
    },
    target: {
      title: "Keyword Rankings On Track - Maintain Momentum",
      recommendations: [
        "Continue current keyword optimization strategies",
        "Monitor rankings closely and defend positions",
        "Expand content around successful keywords",
        "Build authority through consistent, quality content"
      ]
    },
    good: {
      title: "Outstanding Keyword Performance - Expand Dominance",
      recommendations: [
        "Target more competitive, high-value keywords",
        "Develop comprehensive topic clusters",
        "Build thought leadership around key topics",
        "Share keyword strategy insights with team"
      ]
    }
  }
};

export const generateActionItems = (
  currentRecord: PerformanceRecord,
  previousRecords: PerformanceRecord[],
  targets: KPITarget[]
): ActionItem[] => {
  const actionItems: ActionItem[] = [];
  
  // Get all available KPI names from targets
  const kpiNames = [...new Set(targets.map(t => t.kpi_name))];
  
  console.log('Available KPI names from targets:', kpiNames);
  console.log('Available columns in performance record:', Object.keys(currentRecord));

  kpiNames.forEach((kpiName, index) => {
    const target = targets.find(t => t.kpi_name === kpiName);
    if (!target) return;

    const currentValue = currentRecord[kpiName as keyof PerformanceRecord] as number;
    
    // Skip if the KPI doesn't exist in the performance record
    if (currentValue === undefined || currentValue === null) {
      console.log(`Skipping KPI ${kpiName} - column doesn't exist in performance_records table`);
      return;
    }
    
    // Skip if the KPI column exists but has no meaningful data (0 and no target)
    if (currentValue === 0 && target.monthly_target === 0) {
      console.log(`Skipping KPI ${kpiName} - no data and no target set`);
      return;
    }
    
    const achievementPercentage = Math.round((currentValue / target.monthly_target) * 100);
    const category = getPerformanceCategory(achievementPercentage);

    // Get trend analysis
    const trend = analyzeTrend(kpiName, currentRecord, previousRecords);
    
    // Get recommendations based on category
    const kpiRecommendations = KPI_RECOMMENDATIONS[kpiName as keyof typeof KPI_RECOMMENDATIONS];
    
    // Fallback recommendations if specific KPI recommendations don't exist
    const categoryRecommendations = kpiRecommendations?.[category.name.toLowerCase() as keyof typeof kpiRecommendations] || {
      title: `${formatKPIName(kpiName)} Performance - ${category.name}`,
      recommendations: [
        `Review ${formatKPIName(kpiName)} strategy and processes`,
        `Set specific goals for improving ${formatKPIName(kpiName)}`,
        `Monitor ${formatKPIName(kpiName)} trends more closely`,
        `Ensure ${formatKPIName(kpiName)} data is being tracked properly`,
        `Verify ${formatKPIName(kpiName)} targets are realistic and achievable`
      ]
    };

    if (categoryRecommendations) {
      let severity: ActionItem['severity'] = 'info';
      let priority = 3;

      switch (category.name) {
        case 'Critical':
          severity = 'critical';
          priority = 1;
          break;
        case 'Bad':
          severity = 'warning';
          priority = 2;
          break;
        case 'Target':
          severity = 'info';
          priority = 3;
          break;
        case 'Good':
          severity = 'success';
          priority = 4;
          break;
      }

      // Adjust priority based on trend
      if (trend.trend === 'declining' && category.name !== 'Good') {
        priority = Math.max(1, priority - 1);
      }

      const description = `Current: ${currentValue} | Target: ${target.monthly_target} | Achievement: ${achievementPercentage}% | Trend: ${trend.trend} (${trend.changePercentage > 0 ? '+' : ''}${trend.changePercentage}%)`;

      actionItems.push({
        id: `${kpiName}-${currentRecord.id}`,
        kpi: kpiName,
        severity,
        title: categoryRecommendations.title,
        description,
        recommendations: categoryRecommendations.recommendations,
        priority
      });
    }
  });

  // Sort by priority (1 = highest priority)
  return actionItems.sort((a, b) => a.priority - b.priority);
};

const analyzeTrend = (
  kpiName: string,
  currentRecord: PerformanceRecord,
  previousRecords: PerformanceRecord[]
): PerformanceTrend => {
  const currentValue = currentRecord[kpiName as keyof PerformanceRecord] as number;
  
  // Get the most recent previous record
  const sortedPrevious = previousRecords
    .filter(record => record.analyst_id === currentRecord.analyst_id)
    .sort((a, b) => {
      const aDate = new Date(a.year, parseInt(a.month) - 1);
      const bDate = new Date(b.year, parseInt(b.month) - 1);
      return bDate.getTime() - aDate.getTime();
    });

  const previousRecord = sortedPrevious[0];
  const previousValue = previousRecord ? previousRecord[kpiName as keyof PerformanceRecord] as number : 0;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let changePercentage = 0;

  if (previousValue > 0) {
    changePercentage = Math.round(((currentValue - previousValue) / previousValue) * 100);
    
    if (changePercentage > 5) {
      trend = 'improving';
    } else if (changePercentage < -5) {
      trend = 'declining';
    }
  } else if (currentValue > 0) {
    trend = 'improving';
    changePercentage = 100;
  }

  return {
    kpi: kpiName,
    current: currentValue,
    previous: previousValue,
    trend,
    changePercentage
  };
};

export const formatKPIName = (kpiName: string): string => {
  const kpiDisplayNames: { [key: string]: string } = {
    outreaches: 'Monthly Outreaches',
    live_links: 'Live Links',
    high_da_links: 'High DA Backlinks (90+)',
    content_distribution: 'Content Distribution',
    new_blogs: 'New Blog Contributions',
    blog_optimizations: 'Blog Optimizations',
    top_5_keywords: 'Top 5 Ranking Keywords'
  };

  return kpiDisplayNames[kpiName] || kpiName;
};