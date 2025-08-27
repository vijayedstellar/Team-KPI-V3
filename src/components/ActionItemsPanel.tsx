import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ActionItem } from '../utils/actionItemsGenerator';
import { formatKPIName } from '../utils/actionItemsGenerator';

interface ActionItemsPanelProps {
  actionItems: ActionItem[];
  analystName?: string;
  month?: string;
  year?: number;
}

const ActionItemsPanel: React.FC<ActionItemsPanelProps> = ({ 
  actionItems, 
  analystName = "Team Member",
  month,
  year 
}) => {
  const getSeverityIcon = (severity: ActionItem['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityStyles = (severity: ActionItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTrendIcon = (description: string) => {
    if (description.includes('improving')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (description.includes('declining')) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const criticalItems = actionItems.filter(item => item.severity === 'critical');
  const warningItems = actionItems.filter(item => item.severity === 'warning');
  const infoItems = actionItems.filter(item => item.severity === 'info');
  const successItems = actionItems.filter(item => item.severity === 'success');

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Action Items & Recommendations</h3>
            <p className="text-sm text-gray-600">
              Performance analysis for {analystName}
              {month && year && ` - ${month} ${year}`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Critical Items */}
        {criticalItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-800">Critical - Immediate Intervention Required</h4>
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                {criticalItems.length}
              </span>
            </div>
            <div className="space-y-3">
              {criticalItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Warning Items */}
        {warningItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-amber-800">Needs Attention</h4>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">
                {warningItems.length}
              </span>
            </div>
            <div className="space-y-3">
              {warningItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Info Items */}
        {infoItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">On Track - Maintain Momentum</h4>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                {infoItems.length}
              </span>
            </div>
            <div className="space-y-3">
              {infoItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Success Items */}
        {successItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Excellent Performance</h4>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                {successItems.length}
              </span>
            </div>
            <div className="space-y-3">
              {successItems.map((item) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {actionItems.length === 0 && (
          <div className="text-center py-8">
            <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No performance data available for analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionItemCard: React.FC<{ item: ActionItem }> = ({ item }) => {
  const getSeverityStyles = (severity: ActionItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: ActionItem['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (description: string) => {
    if (description.includes('improving')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (description.includes('declining')) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityStyles(item.severity)}`}>
      <div className="flex items-start gap-3">
        {getSeverityIcon(item.severity)}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h5 className="font-semibold text-gray-900">{formatKPIName(item.kpi)}</h5>
            {getTrendIcon(item.description)}
          </div>
          <p className="text-sm text-gray-700 mb-3">{item.description}</p>
          
          <div className="mb-3">
            <h6 className="font-medium text-gray-800 mb-2">Recommended Actions:</h6>
            <ul className="space-y-1">
              {item.recommendations.slice(0, 3).map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  {recommendation}
                </li>
              ))}
              {item.recommendations.length > 3 && (
                <li className="text-sm text-gray-500 italic">
                  +{item.recommendations.length - 3} more recommendations...
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionItemsPanel;