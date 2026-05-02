import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  User, 
  GraduationCap, 
  MapPin, 
  Info,
  ShieldAlert
} from 'lucide-react';

interface SettingsViewProps {
  onBack: () => void;
  key?: string;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-8 h-full overflow-auto max-w-4xl mx-auto"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 mb-12 transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> 
        RETURN TO SYSTEM
      </button>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-3xl font-serif italic text-slate-900 tracking-tight">Developer Credits</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="sleek-card p-6 bg-white border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-medium text-slate-900 border-b-2 border-slate-100 pb-1 inline-block">Ugine Mercy J</h3>
                </div>
              </div>
            </div>

            <div className="sleek-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Qualification</label>
                  <p className="text-sm font-bold text-slate-700">BTech in Metallurgical and Materials Engineering</p>
                </div>
              </div>
            </div>

            <div className="sleek-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Institution</label>
                  <p className="text-sm font-bold text-slate-700">IIT Madras</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-black tracking-tighter uppercase italic">Disclaimer</h2>
            </div>
            <div className="space-y-4 max-w-2xl">
              <p className="text-slate-300 leading-relaxed font-medium">
                This data visualisation project has been developed only for the sole purpose of <span className="text-blue-400">Data Visualization</span> and does <span className="text-red-400">NOT</span> represent real data.
              </p>
              <p className="text-slate-400 text-sm italic">
                The data generated is random and is not in any way depictive of the real data. Any case of similarities in data is purely coincidental and NOT intended.
              </p>
            </div>
          </div>
          {/* Subtle background pattern */}
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <ShieldAlert className="w-64 h-64 -mr-24 -mt-24 rotate-12" />
          </div>
        </section>

        <footer className="pt-8 border-t border-slate-200">
          <p className="text-[10px] font-mono text-slate-400 uppercase text-center tracking-[0.2em]">
            SYSTEM VERSION: 4.0.0-PROTOTYPE / METRIX-AERO-SURFACE
          </p>
        </footer>
      </div>
    </motion.div>
  );
}
