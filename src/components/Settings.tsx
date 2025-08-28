import React, { useState, useEffect } from 'react';
import { performanceService } from '../services/performanceService';
import type { Designation, KPIDefinition } from '../lib/supabase';
import SettingsLayout from './settings/SettingsLayout';
import InstructionsTab from './settings/InstructionsTab';
import DesignationsTab from './settings/DesignationsTab';
import KPIDefinitionsTab from './settings/KPIDefinitionsTab';
import KPIMappingsTab from './settings/KPIMappingsTab';
import UserMappingsTab from './settings/UserMappingsTab';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('instructions');
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [kpiDefinitions, setKPIDefinitions] = useState<KPIDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [designationsData, kpiData] = await Promise.all([
        performanceService.getDesignations(),
        performanceService.getKPIDefinitions()
      ]);
      
      setDesignations(designationsData);
      setKPIDefinitions(kpiData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'instructions':
        return <InstructionsTab />;
      case 'designations':
        return (
          <DesignationsTab 
            designations={designations} 
            onDesignationsChange={loadAllData} 
          />
        );
      case 'kpis':
        return (
          <KPIDefinitionsTab 
            kpiDefinitions={kpiDefinitions} 
            onKPIDefinitionsChange={loadAllData} 
          />
        );
      case 'kpi-mappings':
        return (
          <KPIMappingsTab 
            designations={designations}
            kpiDefinitions={kpiDefinitions}
            onMappingsChange={loadAllData}
          />
        );
      case 'user-mappings':
        return (
          <UserMappingsTab 
            kpiDefinitions={kpiDefinitions}
            onMappingsChange={loadAllData}
          />
        );
      default:
        return <InstructionsTab />;
    }
  };

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </SettingsLayout>
  );
};

export default Settings;