import { FailureReport } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Scale, CheckCircle2, XCircle, BarChart2 } from 'lucide-react';
import { ReactNode } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
} from 'recharts';

interface CompareViewProps {
  reports: FailureReport[];
  onBack: () => void;
  key?: string;
}

const parseMetric = (val: string) => {
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export default function CompareView({ reports, onBack }: CompareViewProps) {
  if (reports.length < 2) return null;
  const [a, b] = reports;

  const chartData = [
    {
      name: 'Hardness Core',
      [a.reportId]: parseMetric(a.observed.hardnessCore),
      [b.reportId]: parseMetric(b.observed.hardnessCore),
      unit: a.observed.hardnessCore.replace(/[0-9.]/g, '').trim()
    },
    {
      name: 'Hardness Case',
      [a.reportId]: parseMetric(a.observed.hardnessCase),
      [b.reportId]: parseMetric(b.observed.hardnessCase),
      unit: a.observed.hardnessCase.replace(/[0-9.]/g, '').trim()
    },
    {
      name: 'Case Depth',
      [a.reportId]: parseMetric(a.observed.caseDepth),
      [b.reportId]: parseMetric(b.observed.caseDepth),
      unit: a.observed.caseDepth.replace(/[0-9.]/g, '').trim()
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 h-full overflow-auto flex flex-col items-center"
    >
      <button 
        onClick={onBack}
        className="self-start flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 mb-8 transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> 
        RETURN TO DATABASE
      </button>

      <div className="w-full max-w-6xl space-y-8">
        <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
          <CompareHeader report={a} />
          <CompareHeader report={b} />
          
          <CompareSection title="Operational Context">
            <CompareRow label="Component Type" valA={a.componentName} valB={b.componentName} />
            <CompareRow label="Manufacturer" valA={a.manufacturer} valB={b.manufacturer} />
            <CompareRow label="Customer" valA={a.customer} valB={b.customer} />
            <CompareRow label="Batch Date" valA={a.date} valB={b.date} />
          </CompareSection>

          <CompareSection title="Technical Metrics (Observed)">
            <CompareRow 
              label="Hardness Core" 
              valA={a.observed.hardnessCore} 
              valB={b.observed.hardnessCore} 
              isMetric
            />
            <CompareRow 
              label="Hardness Case" 
              valA={a.observed.hardnessCase} 
              valB={b.observed.hardnessCase} 
              isMetric
            />
            <CompareRow 
              label="Case Depth" 
              valA={a.observed.caseDepth} 
              valB={b.observed.caseDepth} 
              isMetric
            />
            <CompareRow 
              label="Microstructure" 
              valA={a.observed.microstructure} 
              valB={b.observed.microstructure} 
            />
          </CompareSection>

          <CompareSection title="Quality Disposition">
            <CompareRow label="Failure Mode" valA={a.failureCategory} valB={b.failureCategory} isMetric />
            <div className="bg-white p-8 flex flex-col items-center justify-center border-b border-r border-slate-100">
               <StatusIndicator met={a.metSpec} />
               <p className="mt-4 text-xs font-mono text-center opacity-60 leading-relaxed">{a.failureAnalysis}</p>
            </div>
            <div className="bg-white p-8 flex flex-col items-center justify-center border-b border-slate-100">
               <StatusIndicator met={b.metSpec} />
               <p className="mt-4 text-xs font-mono text-center opacity-60 leading-relaxed">{b.failureAnalysis}</p>
            </div>
          </CompareSection>
        </div>

        {/* Visual Comparison Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider italic">Visual Metric Delta</h3>
          </div>
          <div className="p-8 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Bar dataKey={a.reportId} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey={b.reportId} fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{a.reportId}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{b.reportId}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompareHeader({ report }: { report: FailureReport }) {
  return (
    <div className="bg-slate-900 text-white p-8 border-b border-white/10">
      <div className="flex items-center gap-3 mb-2 opacity-50">
        <Scale className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Comparative Node</span>
      </div>
      <h3 className="text-2xl font-black tracking-tighter">{report.reportId}</h3>
      <p className="text-blue-400 font-mono text-xs mt-1 uppercase">{report.componentName} Analysis</p>
    </div>
  );
}

function CompareSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="col-span-2 grid grid-cols-2 bg-slate-50 border-b border-slate-200">
      <div className="col-span-2 px-6 py-2 bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {title}
      </div>
      {children}
    </div>
  );
}

function CompareRow({ label, valA, valB, isMetric }: { label: string; valA: string; valB: string; isMetric?: boolean }) {
  const isDiff = valA !== valB;
  return (
    <>
      <div className={`p-6 bg-white border-r border-slate-100 flex flex-col gap-1 ${isDiff && isMetric ? 'bg-amber-50/30' : ''}`}>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">{label}</span>
        <span className={`text-sm font-semibold ${isDiff && isMetric ? 'text-amber-700 font-black' : 'text-slate-800'}`}>{valA}</span>
      </div>
      <div className={`p-6 bg-white flex flex-col gap-1 ${isDiff && isMetric ? 'bg-amber-50/30' : ''}`}>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">{label}</span>
        <span className={`text-sm font-semibold ${isDiff && isMetric ? 'text-amber-700 font-black' : 'text-slate-800'}`}>{valB}</span>
      </div>
    </>
  );
}

function StatusIndicator({ met }: { met: boolean }) {
  return met ? (
    <div className="flex flex-col items-center gap-2">
      <CheckCircle2 className="w-8 h-8 text-green-500" />
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-tighter">Compliant</span>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2">
      <XCircle className="w-8 h-8 text-red-500" />
      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black uppercase tracking-tighter">Non-Compliant</span>
    </div>
  );
}
