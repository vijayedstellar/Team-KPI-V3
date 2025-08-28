import React, { ReactNode } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

interface SettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'instructions', label: 'Instructions' },
    { id: 'designations', label: 'Designations' },
    { id: 'kpis', label: 'KPI Definitions' },
    { id: 'kpi-mappings', label: 'KPI Mappings' },
    { id: 'user-mappings', label: 'User KPI Mappings' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Configure your KPI tracking system. Set up designations, define KPIs, and manage target mappings.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;