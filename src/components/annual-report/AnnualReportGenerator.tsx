import React from 'react';
import ReportHeader from './ReportHeader';
import ExecutiveSummary from './ExecutiveSummary';
import KPIPerformanceSummary from './KPIPerformanceSummary';
import GoalsAchievementSummary from './GoalsAchievementSummary';
import StrengthsSection from './StrengthsSection';
import DevelopmentOpportunities from './DevelopmentOpportunities';
import StrategicRecommendations from './StrategicRecommendations';
import MonthlyTrendsTable from './MonthlyTrendsTable';
import ReportFooter from './ReportFooter';
import type { TeamMember, PerformanceRecord, KPITarget } from '../../lib/supabase';

interface AnnualReportGeneratorProps {
  teamMember: TeamMember;
  performanceRecords: PerformanceRecord[];
  targets: KPITarget[];
  goals: any[];
  userMappings: any[];
  kpiDefinitions: any[];
  period: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  };
  config: {
    format: 'comprehensive' | 'summary' | 'kpi-only';
    includeGoals: boolean;
    includeActionItems: boolean;
  };
}

const AnnualReportGenerator: React.FC<AnnualReportGeneratorProps> = ({
  teamMember,
  performanceRecords,
  targets,
  goals,
  userMappings,
  kpiDefinitions,
  period,
  config
}) => {
  // Check if this is being rendered for PDF export
  const isPrintMode = window.matchMedia && window.matchMedia('print').matches;

  // Get effective targets for this team member (user-specific or designation defaults)
  const getEffectiveTargets = () => {
    // Get user-specific mappings first
    const userSpecificTargets = userMappings
      .filter(mapping => mapping.team_member_id === teamMember.id && mapping.is_active)
      .map(mapping => ({
        id: mapping.id,
        kpi_name: mapping.kpi_name,
        monthly_target: mapping.monthly_target,
        annual_target: mapping.annual_target,
        designation: teamMember.designation,
        created_at: mapping.created_at
      }));

    // If user has specific mappings, use those
    if (userSpecificTargets.length > 0) {
      return userSpecificTargets;
    }

    // Fallback to designation defaults
    return targets.filter(target => 
      (target.designation === teamMember.designation || target.role === teamMember.designation) &&
      target.monthly_target > 0
    );
  };

  const effectiveTargets = getEffectiveTargets();

  // Calculate KPI performance data
  const calculateKPIData = () => {
    return effectiveTargets.map(target => {
      const totalActual = performanceRecords.reduce((sum, record) => {
        return sum + ((record as any)[target.kpi_name] || 0);
      }, 0);

      const periodTarget = target.monthly_target * performanceRecords.length;
      const achievement = periodTarget > 0 ? Math.round((totalActual / periodTarget) * 100) : 0;

      const kpiDef = kpiDefinitions.find(kpi => kpi.name === target.kpi_name);
      
      return {
        name: kpiDef?.display_name || target.kpi_name.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        actual: totalActual,
        target: periodTarget,
        unit: kpiDef?.unit || 'count',
        achievement
      };
    });
  };

  // Calculate overall performance
  const calculateOverallPerformance = () => {
    const kpiData = calculateKPIData();
    if (kpiData.length === 0) return 0;
    
    const totalAchievement = kpiData.reduce((sum, kpi) => sum + kpi.achievement, 0);
    return Math.round(totalAchievement / kpiData.length);
  };

  // Get performance grade
  const getPerformanceGrade = (overallPerformance: number) => {
    if (overallPerformance >= 120) return 'Good';
    if (overallPerformance >= 84) return 'Target';
    if (overallPerformance >= 67) return 'Bad';
    return 'Critical';
  };

  // Calculate goals data
  const calculateGoalsData = () => {
    if (!config.includeGoals || goals.length === 0) return [];
    
    return goals.map(goal => ({
      id: goal.id,
      goal_name: goal.goal_name || goal.goals?.goal_name || 'Unknown Goal',
      priority: 'Medium', // Default priority
      status: goal.status || 'assigned',
      assigned_date: goal.assigned_date || goal.created_at,
      deadline: goal.deadline || goal.goals?.deadline || goal.assigned_date,
      completed_date: goal.status === 'completed' ? goal.updated_at : undefined,
      notes: goal.notes || ''
    }));
  };

  // Calculate goals completion rate
  const calculateGoalsCompletionRate = () => {
    const goalsData = calculateGoalsData();
    if (goalsData.length === 0) return 0;
    
    const completedGoals = goalsData.filter(goal => goal.status === 'completed').length;
    return Math.round((completedGoals / goalsData.length) * 100);
  };

  const kpiData = calculateKPIData();
  const goalsData = calculateGoalsData();
  const overallPerformance = calculateOverallPerformance();
  const performanceGrade = getPerformanceGrade(overallPerformance);
  const goalsCompletionRate = calculateGoalsCompletionRate();

  // For PDF export, show only the header information on a single page
  if (isPrintMode) {
    return (
      <div className="bg-white p-8 max-w-4xl mx-auto">
        <style>{`
          @media print {
            body { margin: 0; padding: 0; }
            .print-only { display: block !important; }
            .no-print { display: none !important; }
            @page { margin: 1in; size: letter; }
          }
        `}</style>
        <ReportHeader
          analystName={teamMember.name}
          analystDesignation={teamMember.designation}
          analystEmail={teamMember.email}
          startMonth={period.startMonth}
          startYear={period.startYear}
          endMonth={period.endMonth}
          endYear={period.endYear}
        />
      </div>
    );
  }
  return (
    <div className="bg-white">
      {/* Report Header */}
      <ReportHeader
        analystName={teamMember.name}
        analystDesignation={teamMember.designation}
        analystEmail={teamMember.email}
        startMonth={period.startMonth}
        startYear={period.startYear}
        endMonth={period.endMonth}
        endYear={period.endYear}
      />

      {/* Executive Summary */}
      <ExecutiveSummary
        overallPerformance={overallPerformance}
        performanceGrade={performanceGrade}
        monthsTracked={performanceRecords.length}
        hasGoalsData={config.includeGoals && goalsData.length > 0}
        goalsCompletionRate={goalsCompletionRate}
      />

      {/* KPI Performance Summary */}
      <KPIPerformanceSummary kpiData={kpiData} />

      {/* Goals Achievement Summary (if enabled and data exists) */}
      {config.includeGoals && (
        <GoalsAchievementSummary goals={goalsData} />
      )}

      {/* Strengths Section (if not KPI-only) */}
      {config.format !== 'kpi-only' && (
        <StrengthsSection kpiData={kpiData} goals={goalsData} />
      )}

      {/* Development Opportunities (if comprehensive or summary) */}
      {(config.format === 'comprehensive' || config.format === 'summary') && (
        <DevelopmentOpportunities kpiData={kpiData} goals={goalsData} />
      )}

      {/* Strategic Recommendations (if comprehensive) */}
      {config.format === 'comprehensive' && (
        <StrategicRecommendations 
          kpiData={kpiData} 
          goals={goalsData}
          analystDesignation={teamMember.designation}
        />
      )}

      {/* Monthly Trends Table (if comprehensive or KPI-only) */}
      {(config.format === 'comprehensive' || config.format === 'kpi-only') && (
        <MonthlyTrendsTable 
          performanceRecords={performanceRecords}
          targets={effectiveTargets}
          kpiDefinitions={kpiDefinitions}
        />
      )}

      {/* Report Footer */}
      <ReportFooter
        startMonth={period.startMonth}
        startYear={period.startYear}
        endMonth={period.endMonth}
        endYear={period.endYear}
      />
    </div>
  );
};

export default AnnualReportGenerator;