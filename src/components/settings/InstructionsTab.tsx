import React from 'react';
import { CheckCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';

const InstructionsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Setup Complete!</h3>
        </div>
        <p className="text-green-700">
          Your KPI tracking system is ready to use. Follow the steps below to customize it for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900">Set Up Designations</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Define the roles/designations in your organization (e.g., SEO Analyst, Content Writer).
          </p>
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <ArrowRight className="w-4 h-4 mr-1" />
            Go to Designations tab
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900">Define KPIs</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Create the Key Performance Indicators you want to track (e.g., Outreaches, Live Links).
          </p>
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <ArrowRight className="w-4 h-4 mr-1" />
            Go to KPI Definitions tab
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900">Map KPIs to Designations</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Assign which KPIs are relevant for each designation and set default targets.
          </p>
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <ArrowRight className="w-4 h-4 mr-1" />
            Go to KPI Mappings tab
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">4</span>
            </div>
            <h4 className="font-semibold text-gray-900">Add Team Members</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Add your team members and assign them to designations in the Members section.
          </p>
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <ArrowRight className="w-4 h-4 mr-1" />
            Go to Members page
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-800">Important Notes</h3>
        </div>
        <ul className="space-y-2 text-amber-700">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>KPI columns are automatically added to the performance tracking table when you create new KPIs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>You can set user-specific targets that override designation defaults</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
            <span>Changes to KPI definitions will affect all existing performance records</span>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">System Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-medium mb-2">Performance Tracking</h4>
            <ul className="space-y-1 text-sm">
              <li>• Monthly performance recording</li>
              <li>• Automatic achievement calculations</li>
              <li>• Performance category indicators</li>
              <li>• Action item recommendations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Reporting & Analytics</h4>
            <ul className="space-y-1 text-sm">
              <li>• Real-time dashboard analytics</li>
              <li>• Annual performance reports</li>
              <li>• Team performance leaderboards</li>
              <li>• PDF export capabilities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsTab;