import React from 'react';

interface PerformanceRecord {
  month: string;
  year: number;
  [key: string]: any;
}

interface KPITarget {
  kpi_name: string;
  monthly_target: number;
}

interface MonthlyTrendsTableProps {
  performanceRecords: PerformanceRecord[];
  targets: KPITarget[];
  kpiDefinitions: any[];
}

const MonthlyTrendsTable: React.FC<MonthlyTrendsTableProps> = ({ 
  performanceRecords, 
  targets, 
  kpiDefinitions 
}) => {
  const formatKPIName = (kpiName: string) => {
    const kpiDef = kpiDefinitions.find(kpi => kpi.name === kpiName);
    return kpiDef ? kpiDef.display_name : kpiName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatMonthYear = (month: string, year: number) => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Get the main KPIs to display (limit to most important ones for table width)
  const mainKPIs = targets
    .filter(target => target.monthly_target > 0)
    .slice(0, 5)
    .map(target => target.kpi_name);

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Performance Trends</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              {mainKPIs.map((kpiName) => (
                <th key={kpiName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {formatKPIName(kpiName)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceRecords.map((record, index) => (
              <tr key={`${record.year}-${record.month}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatMonthYear(record.month, record.year)}
                </td>
                {mainKPIs.map((kpiName) => (
                  <td key={kpiName} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record[kpiName]?.toLocaleString() || '0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyTrendsTable;