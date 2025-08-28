import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { performanceCategories } from '../utils/performanceCategories';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PerformanceCategoryChartProps {
  stats: {
    critical: number;
    bad: number;
    target: number;
    good: number;
    total: number;
  };
}

const PerformanceCategoryChart: React.FC<PerformanceCategoryChartProps> = ({ stats }) => {
  const data = {
    labels: performanceCategories.map(cat => `${cat.name} (${cat.range})`),
    datasets: [
      {
        data: [stats.critical, stats.bad, stats.target, stats.good],
        backgroundColor: performanceCategories.map(cat => cat.color),
        borderColor: performanceCategories.map(cat => cat.color),
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default PerformanceCategoryChart;