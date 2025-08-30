import React from 'react';

interface ReportFooterProps {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}

const ReportFooter: React.FC<ReportFooterProps> = ({
  startMonth,
  startYear,
  endMonth,
  endYear
}) => {
  const formatMonthName = (monthNumber: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
      <p>This report was generated automatically by the Marketing KPI Tracker system.</p>
      <p>
        Report Date: {new Date().toLocaleDateString()} | 
        Performance Period: {formatMonthName(startMonth)} {startYear} - {formatMonthName(endMonth)} {endYear}
      </p>
    </div>
  );
};

export default ReportFooter;