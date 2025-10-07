import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Check, Loader2, ArrowRight } from "lucide-react";

interface FileUploadProps {
  onUpload: (fileName: string) => void;
  isUploading: boolean;
  onNext: () => void;
}

export default function FileUpload({ onUpload, isUploading, onNext }: FileUploadProps) {
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadClick = () => {
    setUploadSuccess(true);
    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 87) {
          clearInterval(interval);
          onUpload("school-supplies-rfq-2024.xlsx");
          return 87;
        }
        return prev + 10;
      });
    }, 200);
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

      {!uploadSuccess ? (
        <button
          onClick={handleUploadClick}
          className="upload-zone border-2 border-dashed border-blue-300 rounded-lg p-16 text-center cursor-pointer w-full hover:border-primary hover:bg-primary/5"
          data-testid="upload-zone"
        >
          <CloudUpload className="upload-icon w-16 h-16 text-blue-600 mx-auto mb-4 transition-transform" />
          <p className="text-lg font-semibold text-slate-900 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-slate-500">
            Supports: Excel, CSV, PDF, or paste text directly
          </p>
        </button>
      ) : (
        <div className="space-y-4 fade-in">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">File uploaded successfully</p>
              <p className="text-sm text-green-700">school-supplies-rfq-2024.xlsx • 125 KB</p>
            </div>
          </div>

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
            <div className="text-2xl font-bold text-blue-600">{uploadProgress}%</div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={onNext}
          disabled={!isUploading && !uploadSuccess}
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
