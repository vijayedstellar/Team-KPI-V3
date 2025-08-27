import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AnalystManagement from './components/AnalystManagement';
import PerformanceTracking from './components/PerformanceTracking';
import TargetManagement from './components/TargetManagement';
import Reports from './components/Reports';
import AnnualReportGenerator from './components/AnnualReportGenerator';
import UnifiedTargets from './components/UnifiedTargets';
import Settings from './components/Settings';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Force re-render when authentication state changes
  React.useEffect(() => {
    console.log('Authentication state changed:', isAuthenticated);
    console.log('Loading state:', loading);
    
    // Check if user manually cleared localStorage
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus !== 'true' && isAuthenticated) {
      console.log('Authentication mismatch detected, forcing logout');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('App render - isAuthenticated:', isAuthenticated);
  console.log('App render - loading:', loading);

  if (!isAuthenticated) {
    console.log('Rendering login page');
    return (
      <>
        <Login />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </>
    );
  }

  console.log('Rendering main application');
  
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analysts':
        return <AnalystManagement />;
      case 'performance':
        return <PerformanceTracking />;
      case 'targets':
        return <UnifiedTargets />;
      case 'reports':
        return <Reports />;
      case 'annual-reports':
        return <AnnualReportGenerator />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderActiveComponent()}
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

export default App;