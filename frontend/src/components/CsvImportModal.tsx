import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { importTestCases } from '../api/testcase';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onSuccess: () => void;
}

const DB_FIELDS = [
  { key: 'title', label: '제목 (필수)' },
  { key: 'description', label: '설명' },
  { key: 'precondition', label: '사전 조건' },
  { key: 'steps', label: '테스트 단계' },
  { key: 'expectedResult', label: '기대 결과' },
  { key: 'priority', label: '우선순위 (LOW/MEDIUM/HIGH)' },
];

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  currentFolderId,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ successCount: number; failureCount: number; failures: any[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      
      // CSV 헤더 파싱
      Papa.parse(selectedFile, {
        header: true,
        preview: 1, // 첫 줄만 읽음
        complete: (results) => {
          if (results.meta.fields) {
            setHeaders(results.meta.fields);
            
            // 자동 매핑 시도
            const initialMapping: Record<string, string> = {};
            results.meta.fields.forEach(header => {
              // 정확히 일치하거나 비슷한 이름 찾기 (간단히)
              const match = DB_FIELDS.find(f => f.key === header || f.label.includes(header));
              if (match) {
                initialMapping[header] = match.key;
              }
            });
            setMapping(initialMapping);
          }
        }
      });
    }
  };

  const handleMappingChange = (csvHeader: string, dbField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: dbField
    }));
  };

  const handleImport = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      const response = await importTestCases(currentFolderId, file, mapping);
      if (response.success) {
        setResult(response.data);
        if (response.data.failureCount === 0) {
           setTimeout(() => {
             onSuccess();
             onClose();
           }, 1500);
        }
      }
    } catch (error) {
      alert('Import 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">CSV Import</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {!result ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">CSV 파일 선택</label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm text-gray-600">
                  {file ? file.name : '클릭하여 CSV 파일 업로드'}
                </span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {headers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">필드 매핑</h3>
                <div className="space-y-2">
                  {headers.map(header => (
                    <div key={header} className="flex items-center gap-4">
                      <div className="w-1/3 text-sm font-medium text-gray-700 truncate" title={header}>
                        {header}
                      </div>
                      <div className="text-gray-400">→</div>
                      <select
                        className="flex-1 border rounded-md p-2 text-sm"
                        value={mapping[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                      >
                        <option value="">(건너뛰기)</option>
                        {DB_FIELDS.map(field => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                취소
              </button>
              <button 
                onClick={handleImport}
                disabled={!file || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Import 중...' : 'Import 실행'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="text-center mb-6">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-2" />
              <h3 className="text-lg font-medium">Import 완료</h3>
              <p className="text-gray-600">
                성공: {result.successCount}건 / 실패: {result.failureCount}건
              </p>
            </div>

            {result.failures.length > 0 && (
              <div className="bg-red-50 p-4 rounded-md mb-6 max-h-40 overflow-y-auto">
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <AlertCircle size={16} className="mr-2" /> 실패 내역
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.failures.map((fail, idx) => (
                    <li key={idx}>
                      행 {fail.row}: {fail.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button 
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

