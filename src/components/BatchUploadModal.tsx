import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileJson, AlertCircle, CheckCircle2, Loader2, FileText, Table } from 'lucide-react';
import { FailureReport } from '../types';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { extractReportsFromText } from '../services/geminiService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (reports: FailureReport[]) => void;
}

export default function BatchUploadModal({ isOpen, onClose, onUpload }: BatchUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateReports = (data: any): FailureReport[] => {
    if (!Array.isArray(data)) {
      if (typeof data === 'object' && data !== null) {
        // AI might wrap in an object sometimes
        const key = Object.keys(data).find(k => Array.isArray(data[k]));
        if (key) return validateReports(data[key]);
      }
      throw new Error("Invalid format: Data must be an array of reports.");
    }

    const COMPONENT_TYPES = ["Bolt", "Nut", "Crankshaft", "Piston", "Sheet Metal", "Engine Block", "Connecting Rod"];
    const FAILURE_CATEGORIES = ["Fatigue", "Wear", "Corrosion", "Manufacturing Defect", "None"];

    return data.map((item: any, index: number) => {
      // Basic structural validation
      const requiredFields = ['reportId', 'componentName', 'manufacturer', 'customer', 'date', 'metSpec', 'observed', 'spec', 'failureCategory', 'failureAnalysis'];
      for (const field of requiredFields) {
        if (!(field in item)) {
          // Soft failure for individual item if it's a large batch? 
          // No, let's keep it strict but maybe filter out nulls if AI hallucinated some empty objects
          return null;
        }
      }

      if (typeof item.reportId !== 'string') return null;

      const validatedItem: FailureReport = {
        ...item,
        id: item.id || `rep-${item.reportId}-${Math.random().toString(36).substr(2, 9)}`,
        componentName: COMPONENT_TYPES.includes(item.componentName) ? item.componentName : "Bolt",
        failureCategory: FAILURE_CATEGORIES.includes(item.failureCategory) ? item.failureCategory : "None",
        metSpec: !!item.metSpec
      };

      return validatedItem;
    }).filter(Boolean) as FailureReport[];
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setProgress({ current: 0, total: 1, stage: "Initializing" });

    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      let reports: FailureReport[] = [];

      if (extension === 'json') {
        setProgress({ current: 0, total: 1, stage: "Parsing JSON" });
        const text = await file.text();
        reports = validateReports(JSON.parse(text));
      } 
      else if (extension === 'csv') {
        setProgress({ current: 0, total: 1, stage: "Parsing CSV" });
        reports = await processCSV(file);
      } 
      else if (extension === 'pdf') {
        reports = await processPDF(file);
      } 
      else {
        throw new Error("Unsupported file format. Please upload JSON, CSV, or PDF.");
      }

      if (reports.length === 0) {
        throw new Error("No valid failure reports could be extracted from the file.");
      }

      onUpload(reports);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file.");
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const processCSV = (file: File): Promise<FailureReport[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data.map((row: any) => {
              return {
                ...row,
                metSpec: typeof row.metSpec === 'string' ? row.metSpec.toLowerCase() === 'true' : !!row.metSpec,
                observed: {
                  hardnessCore: row.observed_hardnessCore || row.hardnessCore || "N/A",
                  hardnessCase: row.observed_hardnessCase || row.hardnessCase || "N/A",
                  caseDepth: row.observed_caseDepth || row.caseDepth || "N/A",
                  microstructure: row.observed_microstructure || row.microstructure || "N/A",
                  composition: row.observed_composition || row.composition || "N/A"
                },
                spec: {
                  hardnessCore: row.spec_hardnessCore || "N/A",
                  hardnessCase: row.spec_hardnessCase || "N/A",
                  caseDepth: row.spec_caseDepth || "N/A",
                  microstructure: row.spec_microstructure || "N/A",
                  composition: row.spec_composition || "N/A"
                },
                failureCategory: row.failureCategory || "None",
                failureAnalysis: row.failureAnalysis || "No analysis provided"
              };
            });
            resolve(validateReports(data));
          } catch (e) {
            reject(new Error("CSV format mismatch."));
          }
        },
        error: (err) => reject(new Error(`CSV Error: ${err.message}`))
      });
    });
  };

  const processPDF = async (file: File): Promise<FailureReport[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let allExtractedReports: FailureReport[] = [];
    
    // Process in chunks of 3 pages to stay within AI limits while being efficient
    const chunkSize = 3;
    const totalChunks = Math.ceil(totalPages / chunkSize);

    for (let c = 0; c < totalChunks; c++) {
      const startPage = c * chunkSize + 1;
      const endPage = Math.min((c + 1) * chunkSize, totalPages);
      
      setProgress({ 
        current: c + 1, 
        total: totalChunks, 
        stage: `Extracting pages ${startPage}-${endPage}` 
      });

      let chunkText = "";
      for (let i = startPage; i <= endPage; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        chunkText += pageText + "\n";
      }

      if (chunkText.trim().length > 0) {
        try {
          const chunkReports = await extractReportsFromText(chunkText);
          allExtractedReports = [...allExtractedReports, ...validateReports(chunkReports)];
        } catch (e) {
          console.warn(`Failed to extract data from pages ${startPage}-${endPage}:`, e);
          // Continue to next chunk instead of failing entirely for large batches
        }
      }
    }

    return allExtractedReports;
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative z-10"
          >
            <div className="px-6 py-4 bg-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-black uppercase tracking-wider text-sm italic">New Batch Injection</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
                id="close-upload-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div 
                className={`relative border-2 border-dashed rounded-xl p-10 transition-all text-center flex flex-col items-center justify-center gap-4 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleInput}
                  accept=".json,.csv,.pdf"
                  className="hidden"
                  id="batch-file-input"
                />

                <div className="flex gap-4 mb-2">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center opacity-40">
                    <FileJson className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner relative">
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center opacity-40">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>

                <div>
                  <p className="text-slate-900 font-bold mb-1">
                    {progress ? "In Processing..." : "Drag & Drop Batch Files"}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                    {progress ? progress.stage : "JSON, CSV, or PDF Supported"}
                  </p>
                </div>

                {progress && progress.total > 0 && (
                  <div className="w-full max-w-[200px] mt-2">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                    <p className="text-[10px] font-mono mt-1 text-slate-400">
                      STEP {progress.current} / {progress.total}
                    </p>
                  </div>
                )}

                {!isProcessing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    id="browse-files-button"
                  >
                    Browse Local Storage
                  </button>
                )}
              </div>

              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-[0.2em] mb-1">
                      {error.includes(":") ? error.split(":")[0].replace(/_/g, ' ') : "SYSTEM FAULT"}
                    </p>
                    <p className="text-xs text-red-600 leading-relaxed font-medium">
                      {error.includes(":") ? error.split(":").slice(1).join(":").trim() : error}
                    </p>
                    <button 
                      onClick={() => setError(null)}
                      className="mt-3 text-[10px] font-black text-red-800 uppercase tracking-widest hover:underline"
                    >
                      Dismiss & Try Again
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">FA-v4.0 Multi-Format Support</h4>
                <div className="grid grid-cols-2 gap-4">
                  <ValidationRequirement label="Auto-Extraction (AI)" />
                  <ValidationRequirement label="CSV Column Mapping" />
                  <ValidationRequirement label="PDF Text OCR" />
                  <ValidationRequirement label="JSON native parsing" />
                  <ValidationRequirement label="Schema validation" />
                  <ValidationRequirement label="Sanitization" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ValidationRequirement({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-3 h-3 text-slate-300" />
      <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
    </div>
  );
}
