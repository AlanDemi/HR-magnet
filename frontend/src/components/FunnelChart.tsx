
import React from 'react';

interface Step {
  label: string;
  count: number;
  pct: string;
  color: string;
}

interface FunnelChartProps {
  customSteps?: Step[];
}

const defaultSteps = [
  { label: 'Отклики', count: 1542, pct: '100%', color: 'rgba(59, 130, 246, 0.8)' },
  { label: 'Интервью', count: 138, pct: '16.2%', color: 'rgba(59, 130, 246, 0.6)' },
  { label: 'Тестовое', count: 26, pct: '11.2%', color: 'rgba(59, 130, 246, 0.4)' },
  { label: 'Оффер', count: 10, pct: '8.7%', color: 'rgba(59, 130, 246, 0.3)' },
  { label: 'Найм', count: 11, pct: '-', color: 'rgba(59, 130, 246, 0.2)' },
];

export const FunnelChart: React.FC<FunnelChartProps> = ({ customSteps }) => {
  const displaySteps = customSteps && customSteps.length > 0 ? customSteps : defaultSteps;

  return (
    <div className="glass-panel p-5 h-full">
      <h3 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Воронка найма</h3>
      <div className="flex items-center justify-between gap-1 h-32">
        {displaySteps.map((step, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="mb-2 text-center h-10 flex flex-col justify-end">
              <div className="text-[9px] text-gray-400 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full px-1">{step.label}</div>
              <div className="text-sm font-bold text-white leading-none">{step.count}</div>
            </div>
            <div
              className="w-full h-8 relative transition-all duration-700"
              style={{
                background: step.color,
                clipPath: idx === 0 ? 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)' :
                  idx === displaySteps.length - 1 ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 50%)' :
                    'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)'
              }}
            />
            <div className="mt-2 text-[10px] text-gray-500 font-medium">{step.pct}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
