import React, { useState, useRef, useEffect } from 'react';
import { Brain, User, AlertCircle, Loader2, Upload, ArrowRight, BarChart3 } from 'lucide-react';
import { analyzeText } from '../services/aiDetection';
import type { DetectionResult } from '../types/detection';

interface FileUploadBoxProps {
  id: string;
  onFileUpload: (text: string) => void;
  isUploaded: boolean;
}

function FileUploadBox({ id, onFileUpload, isUploaded }: FileUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.jsonl')) {
      setError('Please upload a JSONL file');
      return;
    }

    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('JSONL file is empty');
      }

      const jsonData = JSON.parse(lines[0]);
      if (!jsonData.text || typeof jsonData.text !== 'string') {
        throw new Error('Invalid JSONL format. Each line must contain a "text" field with string content.');
      }

      setError(null);
      onFileUpload(jsonData.text);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSONL format');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to read file');
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  return (
    <div className="flex-1">
      <div
        className={`w-full h-48 glass-morphism rounded-lg flex flex-col items-center justify-center
                   border-2 border-dashed transition-all duration-300 cursor-pointer
                   ${isUploaded 
                     ? 'border-[var(--neon-primary)] bg-opacity-20' 
                     : 'border-gray-700 hover:border-[var(--neon-primary)]'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".jsonl"
          className="hidden"
        />
        {isUploaded ? (
          <div className="text-center">
            <Brain className="w-12 h-12 text-[var(--neon-primary)] mb-4 mx-auto" />
            <p className="text-[var(--neon-primary)]">File {id} uploaded</p>
            <p className="text-sm text-gray-500 mt-2">Click to replace</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-300">Upload File {id}</p>
            <p className="text-sm text-gray-500 mt-2">Drop JSONL or click to browse</p>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-2 p-2 text-sm text-red-400 bg-red-900/20 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

function MetricsDisplay({ metrics }: { metrics: DetectionResult['metrics'] }) {
  const metricsData = [
    { label: 'Accuracy', value: metrics.accuracy, color: 'text-blue-400' },
    { label: 'F1 Score', value: metrics.f1Score, color: 'text-green-400' },
    { label: 'ROC-AUC', value: metrics.rocAuc, color: 'text-purple-400' },
    { label: 'Precision', value: metrics.precision, color: 'text-orange-400' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {metricsData.map((metric) => (
        <div key={metric.label} className="glass-morphism p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{metric.label}</span>
            <BarChart3 className={`w-4 h-4 ${metric.color}`} />
          </div>
          <div className={`text-lg font-bold ${metric.color} mt-1`}>
            {(metric.value * 100).toFixed(1)}%
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                metric.color.includes('blue') ? 'bg-blue-400' :
                metric.color.includes('green') ? 'bg-green-400' :
                metric.color.includes('purple') ? 'bg-purple-400' : 'bg-orange-400'
              }`}
              style={{ width: `${metric.value * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TextAnalyzer() {
  const [texts, setTexts] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<{ [key: string]: DetectionResult }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const handleFileUpload = (id: string, text: string) => {
    setTexts(prev => ({ ...prev, [id]: text }));
  };

  const analyzeTexts = async () => {
    if (!texts['1'] || !texts['2']) {
      setError('Please upload both files to compare');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result1 = await analyzeText(texts['1']);
      const result2 = await analyzeText(texts['2']);
      setResults({ '1': result1, '2': result2 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze texts';
      setError(message);
      
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const renderComparison = () => {
    if (!results['1'] || !results['2']) return null;

    const result1 = results['1'];
    const result2 = results['2'];
    
    return (
      <div className="glass-morphism p-6 rounded-lg space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-lg ${result1.isAI ? 'bg-purple-900/20' : 'bg-emerald-900/20'}`}>
            <div className="flex items-center gap-2 mb-4">
              {result1.isAI ? (
                <Brain className="w-6 h-6 text-purple-400" />
              ) : (
                <User className="w-6 h-6 text-emerald-400" />
              )}
              <h4 className="text-lg font-semibold">File 1: {result1.isAI ? 'AI-Generated' : 'Human-Written'}</h4>
            </div>
            <MetricsDisplay metrics={result1.metrics} />
          </div>
          
          <div className={`p-6 rounded-lg ${result2.isAI ? 'bg-purple-900/20' : 'bg-emerald-900/20'}`}>
            <div className="flex items-center gap-2 mb-4">
              {result2.isAI ? (
                <Brain className="w-6 h-6 text-purple-400" />
              ) : (
                <User className="w-6 h-6 text-emerald-400" />
              )}
              <h4 className="text-lg font-semibold">File 2: {result2.isAI ? 'AI-Generated' : 'Human-Written'}</h4>
            </div>
            <MetricsDisplay metrics={result2.metrics} />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--neon-primary)]" />
            Analysis Details
          </h4>
          <div className="space-y-3 text-sm text-gray-300">
            {result1.details && (
              <div>
                <p className="font-medium text-[var(--neon-primary)]">File 1:</p>
                <p className="mt-1">{result1.details}</p>
              </div>
            )}
            {result2.details && (
              <div className="mt-4">
                <p className="font-medium text-[var(--neon-primary)]">File 2:</p>
                <p className="mt-1">{result2.details}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[var(--neon-primary)] neon-glow">Text Comparison Analysis</h2>
        <p className="text-gray-300">
          Upload two JSONL files to compare and determine which text was written by AI and which by a human.
        </p>
        <p className="text-sm text-gray-400">
          Format: Each line should be a JSON object with a "text" field: {"{ \"text\": \"Your content here\" }"}
        </p>
      </div>

      <div className="flex gap-6">
        <FileUploadBox 
          id="1" 
          onFileUpload={(text) => handleFileUpload('1', text)} 
          isUploaded={!!texts['1']} 
        />
        <FileUploadBox 
          id="2" 
          onFileUpload={(text) => handleFileUpload('2', text)} 
          isUploaded={!!texts['2']} 
        />
      </div>

      <button
        onClick={analyzeTexts}
        disabled={!texts['1'] || !texts['2'] || loading}
        className="w-full py-3 px-4 neon-border bg-gray-900 text-[var(--neon-primary)] 
                 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                 flex items-center justify-center gap-2 transition-all duration-300"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <ArrowRight className="w-5 h-5" />
            Compare Texts
          </>
        )}
      </button>

      {error && (
        <div className="glass-morphism p-4 rounded-lg flex items-start gap-3 border border-red-500/50">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {renderComparison()}
    </div>
  );
}