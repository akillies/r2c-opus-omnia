import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Check, Loader2, ArrowRight, FileSpreadsheet, AlertCircle } from "lucide-react";

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
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-slate-900">
          Upload Your Requirements
        </h2>
        <p className="text-slate-600">
          Drop your RFQ, PO, or paste a list. We'll auto-detect items, quantities, and constraints.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Upload failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!uploadSuccess ? (
        <div className="space-y-4">
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
            className={`upload-zone border-2 border-dashed rounded-lg p-16 text-center cursor-pointer w-full transition-all ${
              isDragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-blue-300 hover:border-primary hover:bg-primary/5'
            }`}
            data-testid="upload-zone"
          >
            <CloudUpload className={`upload-icon w-16 h-16 mx-auto mb-4 transition-transform ${
              isDragOver ? 'text-primary scale-110' : 'text-blue-600'
            }`} />
            <p className="text-lg font-semibold text-slate-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports: Excel (.xlsx, .xls), CSV files
            </p>
          </div>

          <div className="text-center">
            <span className="text-sm text-slate-500">or</span>
          </div>

          <Button
            onClick={handleDemoUpload}
            variant="outline"
            className="w-full"
            data-testid="button-demo-upload"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Use Demo File (school-supplies-rfq-2024.xlsx)
          </Button>
        </div>
      ) : (
        <div className="space-y-4 fade-in">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900" data-testid="text-upload-success">File uploaded successfully</p>
              <p className="text-sm text-green-700" data-testid="text-file-name">{uploadedFileName}</p>
            </div>
          </div>

          {uploadProgress < 100 ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="pulse">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Processing your requirements...</p>
                  <p className="text-sm text-blue-700">
                    Detecting items, quantities, and matching to contracts
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-progress">{uploadProgress}%</div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Check className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900" data-testid="text-items-detected">
                  {parsedItemCount} items detected and matched
                </p>
                <p className="text-sm text-blue-700">
                  Ready to review product matches
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={onNext}
          disabled={!uploadSuccess || uploadProgress < 100}
          className="btn-primary flex items-center gap-2"
          data-testid="button-continue-check"
        >
          Continue to Check
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
