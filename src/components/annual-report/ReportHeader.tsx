import React from 'react';
import { User, Calendar, FileText } from 'lucide-react';

interface ReportHeaderProps {
  analystName: string;
  analystDesignation: string;
  analystEmail: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
  analystName,
  analystDesignation,
  analystEmail,
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
    <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Annual Performance Report</h1>
      <div className="text-lg text-gray-600 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <User className="w-5 h-5" />
          <span><strong>{analystName}</strong> - {analystDesignation}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" />
          <span>{analystEmail}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Performance Period: {formatMonthName(startMonth)} {startYear} - {formatMonthName(endMonth)} {endYear}</span>
        </div>
        <p className="text-sm">Report Generated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default ReportHeader;