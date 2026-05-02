import { useState, useMemo, ReactNode, MouseEvent, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { REPORTS } from './data/reports';
import { FailureReport, ComponentType, FailureCategory } from './types';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Factory, 
  Users, 
  FileText,
  ChevronLeft,
  Settings,
  LayoutDashboard,
  Table as TableIcon,
  Scale,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import CompareView from './components/CompareView';
import SettingsView from './components/SettingsView';
import BatchUploadModal from './components/BatchUploadModal';

export default function App() {
  const [allReports, setAllReports] = useState<FailureReport[]>(REPORTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | 'All'>('All');
  const [selectedMetSpec, setSelectedMetSpec] = useState<'All' | 'Yes' | 'No'>('All');
  const [selectedCategory, setSelectedCategory] = useState<FailureCategory | 'All'>('All');
  const [selectedReport, setSelectedReport] = useState<FailureReport | null>(null);
  const [view, setView] = useState<'table' | 'dashboard' | 'compare' | 'settings'>('table');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [pageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FailureReport; direction: 'asc' | 'desc' } | null>(null);
  const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState(false);
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsComponentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const comparisonReports = useMemo(() => {
    return allReports.filter(r => compareIds.includes(r.id));
  }, [compareIds, allReports]);

  const toggleCompare = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const filteredReports = useMemo(() => {
    let result = allReports.filter((report) => {
      const matchesSearch = 
        report.reportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.customer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesComponent = selectedComponent === 'All' || report.componentName === selectedComponent;
      
      const matchesSpec = selectedMetSpec === 'All' || 
        (selectedMetSpec === 'Yes' && report.metSpec) || 
        (selectedMetSpec === 'No' && !report.metSpec);

      const matchesCategory = selectedCategory === 'All' || report.failureCategory === selectedCategory;

      return matchesSearch && matchesComponent && matchesSpec && matchesCategory;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [searchTerm, selectedComponent, selectedMetSpec, sortConfig, selectedCategory, allReports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedComponent, selectedMetSpec, selectedCategory]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);

  const displayedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  const requestSort = (key: keyof FailureReport) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof FailureReport) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleInjectBatch = (newReports: FailureReport[]) => {
    setAllReports(prev => [...newReports, ...prev]);
    addNotification(`Successfully injected ${newReports.length} reports into the database.`, 'success');
  };

  const components: (ComponentType | 'All')[] = ['All', 'Bolt', 'Nut', 'Crankshaft', 'Piston', 'Sheet Metal', 'Engine Block', 'Connecting Rod'];
  const categories: (FailureCategory | 'All')[] = ['All', 'Fatigue', 'Wear', 'Corrosion', 'Manufacturing Defect', 'None'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md min-w-[300px] ${
                n.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-700' :
                n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-700' :
                'bg-blue-500/10 border-blue-500/20 text-blue-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                n.type === 'success' ? 'bg-green-500' :
                n.type === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`} />
              <p className="text-xs font-bold flex-1">{n.message}</p>
              <button 
                onClick={() => setNotifications(prev => prev.filter(nn => nn.id !== n.id))}
                className="opacity-40 hover:opacity-100 p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <BatchUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={handleInjectBatch} 
      />
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 shadow-lg z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setView('settings'); setSelectedReport(null); }}
            className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center hover:bg-blue-400 transition-colors cursor-pointer group"
          >
            <Settings className="w-5 h-5 text-white animate-spin-slow group-hover:scale-110 transition-transform" style={{ animationDuration: '8s' }} />
          </button>
          <span className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            FAILURE ANALYSIS <span className="text-blue-400 text-[10px] tracking-[0.2em] font-black opacity-80 decoration-blue-500/30 underline-offset-4">INDUSTRIAL ASSET DATABASE</span>
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => { setView('table'); setSelectedReport(null); }}
              className={`p-1.5 rounded transition-all ${view === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setView('dashboard'); setSelectedReport(null); }}
              className={`p-1.5 rounded transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              title="Dashboard Analytics"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => {
              try {
                const headers = ['Report ID', 'Component', 'Manufacturer', 'Customer', 'Date', 'Met Spec', 'Hardness Core', 'Hardness Case', 'Case Depth'];
                const csvData = filteredReports.map(r => [
                  r.reportId,
                  r.componentName,
                  r.manufacturer,
                  r.customer,
                  r.date,
                  r.metSpec ? 'YES' : 'NO',
                  r.observed.hardnessCore,
                  r.observed.hardnessCase,
                  r.observed.caseDepth
                ]);
                const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `failure_reports_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                addNotification("Database records exported successfully.", "success");
              } catch (e) {
                addNotification("Failed to export database records. Please try again.", "error");
              }
            }}
            className="px-4 py-2 bg-slate-800 rounded-md text-sm hover:bg-slate-700 transition-colors"
          >
            Export CSV
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-semibold hover:bg-blue-500 transition-colors tracking-wide"
            id="new-batch-button"
          >
            + New Batch
          </button>
        </div>
      </nav>

      {/* Controls Bar */}
      {view === 'table' && !selectedReport && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap md:flex-nowrap gap-6 items-end shrink-0 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="sleek-header-label">Search Datasheets</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="SKU-ID, Manufacturer, or Customer..." 
                className="sleek-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        <div className="w-64 relative" ref={dropdownRef}>
          <label className="sleek-header-label">Component Type</label>
          <button 
            onClick={() => setIsComponentDropdownOpen(!isComponentDropdownOpen)}
            className="sleek-input bg-slate-50 flex items-center justify-between group h-10 px-3 py-2 w-full border border-slate-200 rounded-lg"
          >
            <span className={selectedComponent === 'All' ? 'text-slate-400' : 'text-slate-900 font-semibold'}>
              {selectedComponent}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isComponentDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isComponentDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden"
              >
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Filter types..."
                      className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={componentSearchTerm}
                      onChange={(e) => setComponentSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-auto py-1">
                  {components
                    .filter(c => c.toLowerCase().includes(componentSearchTerm.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedComponent(c);
                          setIsComponentDropdownOpen(false);
                          setComponentSearchTerm('');
                        }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${selectedComponent === c ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'}`}
                      >
                        {c}
                        {selectedComponent === c && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-56">
          <label className="sleek-header-label">Compliance Status</label>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 h-10">
            {['All', 'Yes', 'No'].map((v) => (
              <button 
                key={v}
                onClick={() => setSelectedMetSpec(v as any)}
                className={`flex-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${selectedMetSpec === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {v === 'Yes' && <CheckCircle2 className={`w-3 h-3 ${selectedMetSpec === 'Yes' ? 'text-green-500' : 'opacity-40'}`} />}
                {v === 'No' && <XCircle className={`w-3 h-3 ${selectedMetSpec === 'No' ? 'text-red-500' : 'opacity-40'}`} />}
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="w-64">
            <label className="sleek-header-label">Failure Mechanism</label>
            <select 
              className="sleek-input bg-slate-50 appearance-none cursor-pointer h-10"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedComponent('All'); setSelectedMetSpec('All'); setSelectedCategory('All'); }}
            className="p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-200"
            title="Reset Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <Dashboard reports={allReports} key="dashboard" />
          ) : view === 'compare' ? (
            <CompareView 
              reports={comparisonReports} 
              onBack={() => setView('table')} 
              key="compare" 
            />
          ) : view === 'settings' ? (
            <SettingsView onBack={() => setView('table')} key="settings" />
          ) : !selectedReport ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 p-6 overflow-hidden flex flex-col"
            >
              <div className="sleek-card flex-1 flex flex-col h-full shadow-sm">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th className="sleek-table-header w-12 text-center bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]">
                          <Scale className="w-3 h-3 mx-auto opacity-40" />
                        </th>
                        <th 
                          className="sleek-table-header w-32 cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('reportId')}
                        >
                          <div className="flex items-center">SKU-ID {getSortIcon('reportId')}</div>
                        </th>
                        <th 
                          className="sleek-table-header cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('componentName')}
                        >
                          <div className="flex items-center">Component Type {getSortIcon('componentName')}</div>
                        </th>
                        <th 
                          className="sleek-table-header cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('manufacturer')}
                        >
                          <div className="flex items-center">Manufacturer {getSortIcon('manufacturer')}</div>
                        </th>
                        <th 
                          className="sleek-table-header cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('customer')}
                        >
                          <div className="flex items-center">Client {getSortIcon('customer')}</div>
                        </th>
                        <th 
                          className="sleek-table-header w-40 text-center cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('date')}
                        >
                          <div className="flex items-center justify-center">Batch Date {getSortIcon('date')}</div>
                        </th>
                        <th 
                          className="sleek-table-header w-32 text-center cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('metSpec')}
                        >
                          <div className="flex items-center justify-center">QC Status {getSortIcon('metSpec')}</div>
                        </th>
                        <th 
                          className="sleek-table-header w-40 text-center cursor-pointer hover:bg-slate-100 transition-colors bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.05)]"
                          onClick={() => requestSort('failureCategory')}
                        >
                          <div className="flex items-center justify-center">Failure Mode {getSortIcon('failureCategory')}</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {displayedReports.map((report) => (
                        <tr 
                          key={report.id} 
                          className={`hover:bg-slate-50 transition-colors group cursor-pointer h-12 ${compareIds.includes(report.id) ? 'bg-blue-50/50' : ''}`}
                          onClick={() => setSelectedReport(report)}
                        >
                          <td className="px-4 text-center" onClick={(e) => toggleCompare(report.id, e)}>
                            <div className={`w-4 h-4 rounded border mx-auto flex items-center justify-center transition-all ${compareIds.includes(report.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                              {compareIds.includes(report.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </td>
                          <td className="px-6 font-mono font-medium text-blue-600">#{report.reportId.split('-').pop()}</td>
                          <td className="px-6 font-semibold">{report.componentName}</td>
                          <td className="px-6 text-slate-500">{report.manufacturer}</td>
                          <td className="px-6 text-slate-500">{report.customer}</td>
                          <td className="px-6 text-center font-mono text-slate-400 text-xs">{report.date}</td>
                          <td className="px-6 text-center">
                            {report.metSpec ? (
                              <span className="status-badge bg-green-100 text-green-700">Verified</span>
                            ) : (
                              <span className="status-badge bg-red-100 text-red-700">QC Failed</span>
                            )}
                          </td>
                          <td className="px-6 text-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                              report.failureCategory === 'None' 
                                ? 'text-slate-400 border-slate-200' 
                                : 'text-orange-600 border-orange-200 bg-orange-50'
                            }`}>
                              {report.failureCategory}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredReports.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 opacity-30 italic">
                      <Search className="w-12 h-12 mb-4" />
                      <p>No industrial records match current search criteria</p>
                    </div>
                  )}
                </div>
                
                {/* Responsive Pagination */}
                <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                  <span className="text-slate-500 font-medium order-2 sm:order-1">
                    Displaying <span className="text-slate-900 font-bold">{displayedReports.length}</span> of <span className="text-slate-900 font-bold">{filteredReports.length}</span> results
                  </span>
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="pagination-btn px-2 sm:px-3 h-8 flex items-center gap-1 border border-slate-300 rounded bg-white font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    
                    <div className="flex gap-1 px-2 items-center">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                        }
                        
                        return (
                          <button 
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded font-black transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-500 ring-offset-1' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && totalPages > (currentPage + 2) && (
                        <span className="px-1 text-slate-300 font-bold">...</span>
                      )}
                    </div>

                    <button 
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="pagination-btn px-2 sm:px-3 h-8 flex items-center gap-1 border border-slate-300 rounded bg-white font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronDown className="w-3 h-3 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparison Tray */}
              <AnimatePresence>
                {compareIds.length > 0 && (
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40"
                  >
                    <div className="bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-6 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Scale className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">{compareIds.length} Selected</span>
                      </div>
                      <div className="flex -space-x-2">
                        {comparisonReports.map((r) => (
                          <div 
                            key={r.id} 
                            className="w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold"
                            title={r.reportId}
                          >
                            {r.componentName[0]}
                          </div>
                        ))}
                        {compareIds.length < 2 && (
                          <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold opacity-30">
                            +
                          </div>
                        )}
                      </div>
                      <div className="h-6 w-px bg-slate-700 mx-2" />
                      <button 
                        onClick={() => setCompareIds([])}
                        className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        CLEAR
                      </button>
                      <button 
                        disabled={compareIds.length < 2}
                        onClick={() => setView('compare')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${compareIds.length === 2 ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                      >
                        COMPARE NOW
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 p-8 overflow-auto flex flex-col items-center scrollbar-hide"
            >
              <button 
                onClick={() => setSelectedReport(null)}
                className="self-start flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 mb-6 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> 
                BACK TO COMPONENT DATABASE
              </button>

              <div className="w-full max-w-4xl bg-white p-12 shadow-2xl rounded-2xl border border-slate-200 min-h-[900px] flex flex-col relative overflow-hidden">
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-full h-2 ${selectedReport.metSpec ? 'bg-green-500' : 'bg-red-500'}`} />
                
                {/* QC Stamp */}
                <motion.div 
                  initial={{ scale: 1.5, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 0.1, rotate: 15 }}
                  className={`absolute top-20 right-12 border-8 px-10 py-4 font-black text-6xl uppercase pointer-events-none select-none ${selectedReport.metSpec ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'}`}
                >
                  {selectedReport.metSpec ? 'PASSED' : 'FAILED'}
                </motion.div>

                <div className="flex justify-between items-start mb-16">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">ASHOK LEYLAND</h2>
                    <p className="text-sm font-mono text-slate-400 uppercase tracking-[0.3em] font-light">Laboratory Diagnostics / Failure Analysis</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Document Ref</p>
                    <p className="font-mono text-xl text-blue-600 font-bold">{selectedReport.reportId}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{selectedReport.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                  <div className="space-y-6">
                    <DetailItem label="Asset Name" value={selectedReport.componentName} icon={<Settings className="w-4 h-4" />} />
                    <DetailItem label="Primary Manufacturer" value={selectedReport.manufacturer} icon={<Factory className="w-4 h-4" />} />
                    <DetailItem label="Filing Customer" value={selectedReport.customer} icon={<Users className="w-4 h-4" />} />
                    {!selectedReport.metSpec && (
                      <DetailItem label="Failure Mode" value={selectedReport.failureCategory} icon={<Filter className="w-4 h-4 text-orange-500" />} />
                    )}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Technical Abstract
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-600 font-light italic">
                      This report evaluates specialized stress parameters for serial {selectedReport.id}. Metadata extraction indicates testing conducted in compliance with industrial structural integrity protocols.
                    </p>
                  </div>
                </div>

                <table className="w-full border-collapse rounded-xl overflow-hidden mb-12">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest h-12">
                      <th className="px-6 text-left">Internal Property</th>
                      <th className="px-6 text-center">Design Specification</th>
                      <th className="px-6 text-center">Operational Metric</th>
                      <th className="px-6 text-right">variance</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <ReportRow label="Surface Hardness (Core)" spec={selectedReport.spec.hardnessCore} observed={selectedReport.observed.hardnessCore} />
                    <ReportRow label="Surface Hardness (Case)" spec={selectedReport.spec.hardnessCase} observed={selectedReport.observed.hardnessCase} />
                    <ReportRow label="Effective Case Depth" spec={selectedReport.spec.caseDepth} observed={selectedReport.observed.caseDepth} />
                    <ReportRow label="Micro-Structural Array" spec={selectedReport.spec.microstructure} observed={selectedReport.observed.microstructure} isText />
                    <ReportRow label="Chemical Composition" spec={selectedReport.spec.composition} observed={selectedReport.observed.composition} isText />
                  </tbody>
                </table>

                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    {selectedReport.metSpec ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />}
                    Final Disposition
                  </h3>
                  <p className="font-mono text-sm leading-relaxed text-slate-700 bg-white p-6 rounded-xl border border-slate-200 shadow-inner">
                    {selectedReport.failureAnalysis}
                  </p>
                </div>

                <div className="mt-auto pt-12 flex justify-between items-end text-[9px] font-mono text-slate-400 uppercase tracking-widest border-t border-slate-100">
                  <div className="flex gap-4">
                    <span>Authenticity Hash: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    <span>Server Node: US-EAST-01</span>
                  </div>
                  <span>Failure Analysis Reporting System v2.4</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* System Status Bar */}
      <footer className="shrink-0 bg-slate-100 border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <div className="flex gap-6">
          <span>DB STATUS: <span className="text-green-500 font-bold">ONLINE</span></span>
          <span className="hidden sm:inline">LATENCY: 24ms</span>
          <span className="hidden sm:inline">RECORDS: {allReports.length}</span>
          <span className="hidden sm:inline">SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        </div>
        <div className="flex gap-1 uppercase tracking-widest">
          <span>v2.4.1-STABLE</span>
        </div>
      </footer>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: ReactNode }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-lg font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function ReportRow({ label, spec, observed, isText }: { label: string, spec: string, observed: string, isText?: boolean }) {
  const isDiff = spec !== observed;
  return (
    <tr className={`border-b border-slate-100 h-14 ${isDiff && !isText ? 'bg-red-50/30' : ''}`}>
      <td className="px-6 font-bold text-slate-500">{label}</td>
      <td className="px-6 text-center font-mono opacity-60">{spec}</td>
      <td className={`px-6 text-center font-mono font-bold ${isDiff && !isText ? 'text-red-700 underline underline-offset-4' : 'text-blue-600'}`}>
        {observed}
      </td>
      <td className="px-6 text-right font-mono text-[10px] opacity-40">
        {isDiff ? 'SIG_VARIA' : 'NOM_VARIA'}
      </td>
    </tr>
  );
}

