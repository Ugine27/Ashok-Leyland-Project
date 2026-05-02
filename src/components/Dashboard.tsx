import { useMemo, ReactNode } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
} from 'recharts';
import { FailureReport } from '../types';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardProps {
  reports: FailureReport[];
  key?: string;
}

export default function Dashboard({ reports }: DashboardProps) {
  const stats = useMemo(() => {
    const componentMap: Record<string, { count: number; failures: number }> = {};
    const categoryMap: Record<string, number> = {};
    let totalFailures = 0;

    reports.forEach(report => {
      if (!componentMap[report.componentName]) {
        componentMap[report.componentName] = { count: 0, failures: 0 };
      }
      componentMap[report.componentName].count++;
      if (!report.metSpec) {
        componentMap[report.componentName].failures++;
        totalFailures++;
        
        if (report.failureCategory !== "None") {
          categoryMap[report.failureCategory] = (categoryMap[report.failureCategory] || 0) + 1;
        }
      }
    });

    const distributionData = Object.entries(componentMap).map(([name, data]) => ({
      name,
      count: data.count,
    }));

    const failureRateData = Object.entries(componentMap).map(([name, data]) => ({
      name,
      rate: parseFloat(((data.failures / data.count) * 100).toFixed(1)),
    }));

    const failureCategoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    return {
      distributionData,
      failureRateData,
      failureCategoryData,
      totalFailures,
      totalCount: reports.length,
      overallFailureRate: ((totalFailures / reports.length) * 100).toFixed(1)
    };
  }, [reports]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 h-full overflow-auto space-y-8"
    >
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Components Analyzed" 
          value={stats.totalCount.toLocaleString()} 
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          subValue="Cross-sector aggregate"
        />
        <StatCard 
          label="Critical Failures Detected" 
          value={stats.totalFailures.toLocaleString()} 
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          subValue={`${stats.overallFailureRate}% overall failure rate`}
          trend="negative"
        />
        <StatCard 
          label="Compliance Rating" 
          value={`${(100 - parseFloat(stats.overallFailureRate)).toFixed(1)}%`} 
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
          subValue="Verified data points"
          trend="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Component Distribution */}
        <div className="sleek-card p-6 bg-white flex flex-col h-[450px]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Component Inventory Distribution</h3>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Volume by category node</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.distributionData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fontSize: 10, fill: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Rates */}
        <div className="sleek-card p-6 bg-white flex flex-col h-[450px]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Failure Incident Matrix</h3>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Percentage rate per component</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.failureRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit="%"
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={40}>
                  {stats.failureRateData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.rate > 30 ? '#ef4444' : entry.rate > 25 ? '#f59e0b' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Failure Mechanism Breakdown */}
        <div className="sleek-card p-6 bg-white flex flex-col h-[400px] lg:col-span-3">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Failure Mechanism Distribution</h3>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">Aggregated root causes</p>
            </div>
            <div className="flex gap-4">
              {stats.failureCategoryData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 4]}`} style={{ backgroundColor: ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 4] }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.failureCategoryData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                  {stats.failureCategoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 4]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, subValue, trend }: { label: string; value: string; icon: ReactNode; subValue: string; trend?: 'positive' | 'negative' }) {
  return (
    <div className="sleek-card p-6 bg-white flex flex-col group hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend === 'positive' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
      </div>
      <p className="text-[10px] text-slate-400 font-mono mt-2 uppercase italic">{subValue}</p>
    </div>
  );
}
