import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Check, Loader2, ArrowRight, FileSpreadsheet, AlertCircle, Sparkles } from "lucide-react";

interface MatchedItem {
  requestedItem: {
    name: string;
    quantity: number;
    unitOfMeasure?: string;
  };
  matchedProduct: {
    id: string;
    name: string;
    unitPrice: string;
  } | null;
  confidence: string;
  quantity: number;
}

interface FileUploadProps {
  onUpload: (fileName: string, matchedItems?: MatchedItem[]) => void;
  isUploading: boolean;
  onNext: () => void;
}

export default function FileUpload({ onUpload, isUploading, onNext }: FileUploadProps) {
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [parsedItemCount, setParsedItemCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setUploadedFileName(file.name);
    setUploadProgress(10);

    try {
      const isCSV = file.name.endsWith('.csv');
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (!isCSV && !isExcel) {
        setError("Please upload a CSV or Excel file");
        return;
      }

      setUploadSuccess(true);
      setUploadProgress(30);

      let content: string;
      let fileType: string;

      if (isCSV) {
        content = await file.text();
        fileType = 'csv';
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        content = btoa(binary);
        fileType = 'excel';
      }

      setUploadProgress(50);

      const response = await fetch('/api/parse-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fileName: file.name,
          fileType
        })
      });

      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse file');
      }

      const result = await response.json();
      
      if (!result.matchedItems || result.matchedItems.length === 0) {
        throw new Error('No items could be matched from the file. Please check the file format.');
      }

      setUploadProgress(100);
      setParsedItemCount(result.rowCount);
      
      onUpload(file.name, result.matchedItems);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setUploadSuccess(false);
      setUploadProgress(0);
    }
  };

  const handleDemoUpload = () => {
    setUploadSuccess(true);
    setUploadedFileName("school-supplies-rfq-2024.xlsx");
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setParsedItemCount(5);
          onUpload("school-supplies-rfq-2024.xlsx");
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClick = () => fileInputRef.current?.click();

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <div>
            <p className="font-medium text-red-900">Upload failed</p>
            <p className="text-red-700 text-xs">{error}</p>
          </div>
        </div>
      )}

      {!uploadSuccess ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
            data-testid="input-file"
          />
          
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragOver 
                ? 'border-[#1e3a5f] bg-blue-50 scale-[1.02]' 
                : 'border-gray-300 hover:border-[#1e3a5f] hover:bg-blue-50/50'
            }`}
            data-testid="upload-zone"
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isDragOver ? 'bg-[#1e3a5f] text-white scale-110' : 'bg-gray-100 text-gray-500'
            }`}>
              <CloudUpload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Excel (.xlsx, .xls) or CSV files
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <span className="relative bg-white px-3 text-xs text-gray-400">or try a sample</span>
          </div>

          <Button
            onClick={handleDemoUpload}
            variant="outline"
            className="w-full h-10 text-sm border-dashed hover:bg-blue-50 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all"
            data-testid="button-demo-upload"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Use Demo File (school-supplies-rfq.xlsx)
          </Button>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-green-900 text-sm" data-testid="text-upload-success">File uploaded</p>
              <p className="text-xs text-green-700 truncate" data-testid="text-file-name">{uploadedFileName}</p>
            </div>
          </div>

          {uploadProgress < 100 ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">Processing...</span>
                </div>
                <span className="text-sm font-bold text-blue-600" data-testid="text-progress">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1.5">Detecting items and matching to contracts</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="font-medium text-blue-900 text-sm" data-testid="text-items-detected">
                  {parsedItemCount} items detected
                </p>
                <p className="text-xs text-blue-700">Ready to review matches</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={!uploadSuccess || uploadProgress < 100}
        className="w-full bg-[#1e3a5f] hover:bg-[#15293f] text-white h-10"
        data-testid="button-continue-check"
      >
        Continue to Match
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
