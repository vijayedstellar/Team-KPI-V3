import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { performanceService } from '../../services/performanceService';
import { analystService } from '../../services/analytService';
import type { Designation, KPIDefinition, KPIDesignationMapping } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface KPIMappingsTabProps {
  designations: Designation[];
  kpiDefinitions: KPIDefinition[];
  onMappingsChange: () => void;
}

const KPIMappingsTab: React.FC<KPIMappingsTabProps> = ({ 
  designations, 
  kpiDefinitions, 
  onMappingsChange 
}) => {
  const [mappings, setMappings] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadMappings();
  }, [designations, kpiDefinitions]);

  const syncFromUserMappings = async () => {
    try {
      setSyncing(true);
      
      // Get all user KPI mappings
      const userMappings = await performanceService.getUserKPIMappings();
      console.log('User KPI mappings found:', userMappings);
      
      // Get all team members to find their designations
      const teamMembers = await analystService.getAllAnalysts();
      console.log('Team members found:', teamMembers);
      
      // Create designation mappings based on user mappings
      const designationKPIs = new Set<string>();
      
      userMappings.forEach(userMapping => {
        const teamMember = teamMembers.find(tm => tm.id === userMapping.team_member_id);
        if (teamMember) {
          const key = `${teamMember.designation}-${userMapping.kpi_name}`;
          designationKPIs.add(key);
          console.log(`Found user mapping: ${teamMember.name} (${teamMember.designation}) -> ${userMapping.kpi_name}`);
        }
      });
      
      // Create mappings to save to Supabase
      const mappingsToCreate: Array<Omit<KPIDesignationMapping, 'id' | 'created_at' | 'updated_at'>> = [];
      
      designationKPIs.forEach(key => {
        const [designationName, kpiName] = key.split('-');
        mappingsToCreate.push({
          designation_name: designationName,
          kpi_name: kpiName,
          is_active: true
        });
      });
      
      console.log('Creating designation mappings:', mappingsToCreate);
      
      // Clear existing mappings and create new ones
      const existingMappings = await performanceService.getKPIDesignationMappings();
      for (const mapping of existingMappings) {
        await performanceService.deleteKPIDesignationMapping(mapping.id);
      }
      
      if (mappingsToCreate.length > 0) {
        await performanceService.bulkCreateKPIDesignationMappings(mappingsToCreate);
      }
      
      // Reload the mappings to update the UI
      await loadMappings();
      
      toast.success(`Synced ${mappingsToCreate.length} KPI mappings from user data`);
      onMappingsChange();
    } catch (error) {
      console.error('Error syncing from user mappings:', error);
      toast.error('Failed to sync from user mappings');
    } finally {
      setSyncing(false);
    }
  };
  const loadMappings = async () => {
    try {
      setLoading(true);
      
      // First, try to get existing mappings from kpi_designation_mappings table
      let existingMappings = await performanceService.getKPIDesignationMappings();
      
      console.log('Loaded KPI designation mappings from Supabase:', existingMappings);
      
      // If no mappings exist in kpi_designation_mappings, infer from kpi_targets table
      if (existingMappings.length === 0) {
        console.log('No mappings found in kpi_designation_mappings, inferring from kpi_targets...');
        const kpiTargets = await performanceService.getKPITargets();
        console.log('KPI targets found:', kpiTargets);
        
        // Create mappings based on existing kpi_targets
        const inferredMappings = kpiTargets.map(target => ({
          id: `inferred-${target.id}`,
          kpi_name: target.kpi_name,
          designation_name: target.designation || target.role || 'SEO Analyst',
          is_active: true,
          created_at: target.created_at,
          updated_at: target.created_at
        }));
        
        console.log('Inferred mappings from kpi_targets:', inferredMappings);
        existingMappings = inferredMappings;
      }
      
      const mappingState: { [key: string]: boolean } = {};
      
      // Initialize all combinations as false first
      designations.forEach(designation => {
        kpiDefinitions.forEach(kpi => {
          const key = `${designation.name}-${kpi.name}`;
          mappingState[key] = false;
        });
      });
      
      // Then set true for existing mappings
      existingMappings.forEach(mapping => {
        const key = `${mapping.designation_name}-${mapping.kpi_name}`;
        console.log(`Setting mapping ${key} to true`);
        mappingState[key] = true;
      });
      
      console.log('Final mapping state:', mappingState);
      setMappings(mappingState);
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast.error('Failed to load KPI mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (designationName: string, kpiName: string, checked: boolean) => {
    const key = `${designationName}-${kpiName}`;
    setMappings(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('Saving KPI mappings:', mappings);
      
      // Create mappings for checked items
      const mappingsToCreate: Array<Omit<KPIDesignationMapping, 'id' | 'created_at' | 'updated_at'>> = [];
      
      Object.entries(mappings).forEach(([key, isChecked]) => {
        if (isChecked) {
          const [designationName, kpiName] = key.split('-');
          mappingsToCreate.push({
            designation_name: designationName,
            kpi_name: kpiName,
            is_active: true
          });
        }
      });

      console.log('Mappings to create:', mappingsToCreate);

      // Clear existing mappings and create new ones
      const existingMappings = await performanceService.getKPIDesignationMappings();
      console.log('Existing mappings to delete:', existingMappings.length);
      
      for (const mapping of existingMappings) {
        await performanceService.deleteKPIDesignationMapping(mapping.id);
      }

      if (mappingsToCreate.length > 0) {
        await performanceService.bulkCreateKPIDesignationMappings(mappingsToCreate);
        console.log('Created new mappings successfully');
      }

      toast.success('KPI mappings saved successfully');
      onMappingsChange();
    } catch (error) {
      console.error('Error saving mappings:', error);
      toast.error('Failed to save KPI mappings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">KPI to Designation Mappings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select which KPIs are relevant for each designation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={syncFromUserMappings}
            disabled={syncing}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Auto-Syncing...' : 'Auto-Sync from User Data'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Mappings'}
          </button>
        </div>
      </div>

      {designations.length === 0 || kpiDefinitions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {designations.length === 0 && 'No designations found. '}
            {kpiDefinitions.length === 0 && 'No KPIs found. '}
            Please create designations and KPIs first.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KPI / Designation
                  </th>
                  {designations.map((designation) => (
                    <th key={designation.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {designation.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kpiDefinitions.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{kpi.display_name}</div>
                        <div className="text-sm text-gray-500">{kpi.name}</div>
                      </div>
                    </td>
                    {designations.map((designation) => {
                      const key = `${designation.name}-${kpi.name}`;
                      return (
                        <td key={designation.id} className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={mappings[key] || false}
                            onChange={(e) => handleMappingChange(designation.name, kpi.name, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIMappingsTab;