import React from 'react';
import { FileText, Award, TrendingUp, AlertTriangle, Target, Calendar, User, Mail } from 'lucide-react';

const MockAnnualReport: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          Sample Annual Performance Report - SEO Analyst
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          This is a mock report showing how the system generates comprehensive annual reviews
        </p>
      </div>

      <div className="p-6">
        {/* Report Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Annual Performance Report</h1>
          <div className="text-lg text-gray-600 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <User className="w-5 h-5" />
              <span><strong>Sarah Johnson</strong> - SEO Analyst</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              <span>sarah.johnson@company.com</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Performance Period: September 2025 - September 2026</span>
            </div>
            <p className="text-sm">Report Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Executive Summary
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">94%</div>
                <div className="text-sm text-gray-600 font-medium">Overall Performance</div>
                <div className="text-xs text-gray-500 mt-1">Above Target Range</div>
              </div>
              <div className="text-center">
                <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  TARGET ACHIEVED
                </div>
                <div className="text-sm text-gray-600 font-medium mt-1">Performance Grade</div>
                <div className="text-xs text-gray-500">84-119% Range</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600">13</div>
                <div className="text-sm text-gray-600 font-medium">Months Tracked</div>
                <div className="text-xs text-gray-500 mt-1">Complete Annual Cycle</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Performance Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            KPI Performance Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Monthly Outreaches', actual: 7845, target: 6825, unit: 'emails', achievement: 115 },
              { name: 'Live Links', actual: 218, target: 195, unit: 'links', achievement: 112 },
              { name: 'High DA Backlinks (90+)', actual: 52, target: 39, unit: 'links', achievement: 133 },
              { name: 'Content Distribution', actual: 127, target: 104, unit: 'pieces', achievement: 122 },
              { name: 'New Blog Contributions', actual: 156, target: 130, unit: 'posts', achievement: 120 },
              { name: 'Blog Optimizations', actual: 89, target: 65, unit: 'posts', achievement: 137 },
              { name: 'Top 5 Ranking Keywords', actual: 62, target: 39, unit: 'keywords', achievement: 159 }
            ].map((kpi) => {
              const getPerformanceColor = (achievement: number) => {
                if (achievement >= 120) return 'bg-blue-100 text-blue-800 border-blue-200';
                if (achievement >= 84) return 'bg-green-100 text-green-800 border-green-200';
                if (achievement >= 67) return 'bg-amber-100 text-amber-800 border-amber-200';
                return 'bg-red-100 text-red-800 border-red-200';
              };

              return (
                <div key={kpi.name} className={`p-4 rounded-lg border-2 ${getPerformanceColor(kpi.achievement)}`}>
                  <div className="font-semibold text-gray-900 text-sm mb-2">{kpi.name}</div>
                  <div className="text-2xl font-bold mb-1">{kpi.actual.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mb-2">Target: {kpi.target.toLocaleString()} {kpi.unit}</div>
                  <div className="text-sm font-semibold">
                    {kpi.achievement}% Achievement
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Strengths */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Key Strengths & Achievements
          </h3>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Exceptional Keyword Performance:</strong> Achieved 159% of Top 5 Keywords target (62/39), demonstrating strong SEO optimization skills</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Outstanding Blog Optimization:</strong> Exceeded target by 37% (89/65), showing excellent content improvement capabilities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>High-Quality Link Building:</strong> Secured 33% more High DA backlinks than target (52/39), focusing on premium link opportunities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Consistent Content Creation:</strong> Delivered 120% of new blog target (156/130), maintaining steady content production</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Strong Outreach Performance:</strong> Exceeded annual outreach target by 15% (7,845/6,825), showing excellent prospecting skills</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Development Opportunities
          </h3>
          <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Outreach-to-Link Conversion:</strong> While outreach volume is strong, focus on improving conversion rates from outreach to live links</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Content Distribution Scaling:</strong> Opportunity to expand content distribution channels beyond current 122% achievement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Process Documentation:</strong> Share successful keyword ranking strategies with team members for knowledge transfer</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Recommendations for Next Year */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Strategic Recommendations for 2026-2027
          </h3>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Leadership Development:</strong> Consider mentoring junior SEO analysts given exceptional performance across all KPIs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Advanced SEO Specialization:</strong> Focus on technical SEO and advanced keyword research to leverage current strengths</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Process Optimization:</strong> Document and systematize successful approaches for team-wide implementation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Goal Expansion:</strong> Consider 10-15% target increases for next year given consistent over-achievement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Cross-Training:</strong> Explore content strategy and technical SEO to broaden skill set</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Monthly Performance Trend */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Performance Highlights</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outreaches</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Live Links</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">High DA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Blogs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keywords</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { month: 'Sep 2025', outreaches: 580, links: 18, da: 4, blogs: 12, keywords: 4 },
                  { month: 'Oct 2025', outreaches: 620, links: 16, da: 3, blogs: 11, keywords: 3 },
                  { month: 'Nov 2025', outreaches: 545, links: 14, da: 2, blogs: 9, keywords: 2 },
                  { month: 'Dec 2025', outreaches: 490, links: 12, da: 2, blogs: 8, keywords: 2 },
                  { month: 'Jan 2026', outreaches: 510, links: 13, da: 3, blogs: 10, keywords: 3 },
                  { month: 'Feb 2026', outreaches: 560, links: 15, da: 3, blogs: 11, keywords: 3 },
                  { month: 'Mar 2026', outreaches: 595, links: 17, da: 4, blogs: 12, keywords: 4 },
                  { month: 'Apr 2026', outreaches: 630, links: 19, da: 5, blogs: 13, keywords: 5 },
                  { month: 'May 2026', outreaches: 655, links: 20, da: 5, blogs: 14, keywords: 5 },
                  { month: 'Jun 2026', outreaches: 680, links: 22, da: 6, blogs: 15, keywords: 6 },
                  { month: 'Jul 2026', outreaches: 700, links: 24, da: 7, blogs: 16, keywords: 7 },
                  { month: 'Aug 2026', outreaches: 720, links: 25, da: 8, blogs: 17, keywords: 8 },
                  { month: 'Sep 2026', outreaches: 740, links: 26, da: 8, blogs: 18, keywords: 9 }
                ].map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.outreaches}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.links}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.da}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.blogs}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.keywords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Annual Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Overall Assessment</h4>
              <p className="text-sm text-gray-600">
                Sarah Johnson has demonstrated exceptional performance as an SEO Analyst, achieving 94% overall performance 
                with particular strength in keyword rankings and content optimization. Her consistent delivery across all 
                KPIs makes her a valuable team asset.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Career Development</h4>
              <p className="text-sm text-gray-600">
                Ready for increased responsibilities and potential promotion to SEO Specialist role. Strong candidate 
                for leadership development and cross-training opportunities. Consider advanced SEO certifications 
                and team mentoring responsibilities.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>This report was generated automatically by the Marketing KPI Tracker system.</p>
          <p>Report Date: {new Date().toLocaleDateString()} | Performance Period: Sep 2025 - Sep 2026</p>
        </div>
      </div>
    </div>
  );
};

export default MockAnnualReport;