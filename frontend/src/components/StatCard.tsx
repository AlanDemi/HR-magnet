
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendType?: 'up' | 'down';
  chartData?: any[];
  className?: string;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendType = 'up',
  chartData,
  className,
  children
}) => {
  return (
    <div className={`glass-panel p-5 flex flex-col h-full hover-glow group transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider group-hover:text-blue-300 transition-colors">{title}</span>
        {trend && (
          <span className={`text-xs font-bold ${trendType === 'up' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}`}>
            {trendType === 'up' ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex items-end justify-between">
          <span className="text-4xl font-bold text-white group-hover:text-blue-400 transition-colors">{value}</span>
          {chartData && (
            <div className="h-12 w-24 opacity-60 group-hover:opacity-100 transition-opacity">
              <LineChart width={96} height={48} data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </div>
          )}
        </div>
        {children}
      </div>
    </div >
  );
};
