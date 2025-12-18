import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#5B9A9A', '#C9A962', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function OutcomeChart({ data = [], chartType = 'area', title, onChartTypeChange }) {
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                }} 
              />
              <Bar dataKey="value" fill="#5B9A9A" radius={[4, 4, 0, 0]} />
              {data[0]?.value2 && <Bar dataKey="value2" fill="#C9A962" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B9A9A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5B9A9A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                }} 
              />
              <Area type="monotone" dataKey="value" stroke="#5B9A9A" fill="url(#colorValue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {onChartTypeChange && (
          <Select value={chartType} onValueChange={onChartTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {data.length > 0 ? renderChart() : (
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          No data available
        </div>
      )}
    </div>
  );
}