import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBulkCreateLinks } from '@/hooks/useLinks';

export function BulkUploadModal({ isOpen, onClose }) {
  const bulkCreateMutation = useBulkCreateLinks();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedLinks, setParsedLinks] = useState([]);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [failures, setFailures] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, parsed, uploading, completed

  const resetState = () => {
    setFile(null);
    setParsedLinks([]);
    setError('');
    setSuccessCount(0);
    setFailures([]);
    setStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      processFile(droppedFile);
    } else {
      setError('Please upload a valid CSV file.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file) => {
    setFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseCSV(text);
    };
    reader.onerror = () => {
      setError('Failed to read CSV file.');
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) {
        setError('The CSV file is empty.');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const hasHeader = headers.includes('url') || headers.includes('originalurl') || headers.includes('destination');

      let urlIdx = 0;
      let aliasIdx = 1;
      let expiryIdx = 2;

      let dataLines = lines;
      if (hasHeader) {
        urlIdx = headers.findIndex(h => h === 'url' || h === 'originalurl' || h === 'destination');
        aliasIdx = headers.findIndex(h => h === 'alias' || h === 'customalias' || h === 'custom');
        expiryIdx = headers.findIndex(h => h === 'expiry' || h === 'expirydate' || h === 'date');
        dataLines = lines.slice(1);
      }

      const links = [];
      dataLines.forEach((line) => {
        // Handle basic split by comma, respecting quotes if simple
        const cols = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        cols.push(current.trim());

        const originalUrl = cols[urlIdx] || '';
        const customAlias = aliasIdx !== -1 ? cols[aliasIdx] || '' : '';
        const expiryDate = expiryIdx !== -1 ? cols[expiryIdx] || '' : '';

        if (originalUrl) {
          links.push({
            originalUrl,
            customAlias: customAlias || undefined,
            expiryDate: expiryDate || undefined
          });
        }
      });

      if (links.length === 0) {
        setError('No valid URLs found in the CSV file.');
        return;
      }

      setParsedLinks(links);
      setStatus('parsed');
    } catch (err) {
      console.error('CSV Parsing Error:', err);
      setError('Error parsing CSV. Ensure correct formatting.');
    }
  };

  const handleUpload = async () => {
    setStatus('uploading');
    try {
      const res = await bulkCreateMutation.mutateAsync({ links: parsedLinks });
      setSuccessCount(res.data?.length || 0);
      setFailures(res.errors || []);
      setStatus('completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bulk shorten links.');
      setStatus('parsed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
          >
            <Card className="glass relative">
              <button 
                onClick={() => { resetState(); onClose(); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Bulk CSV Link Upload
                </CardTitle>
                <CardDescription>
                  Upload a CSV file containing links to shorten. Columns should ideally be: <strong>originalUrl, customAlias, expiryDate</strong>.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {status === 'idle' && (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 transition-all rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">CSV files only (up to 5MB)</p>
                    </div>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>
                )}

                {status === 'parsed' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{file?.name}</p>
                        <p className="text-xs text-muted-foreground">{(file?.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Badge variant="default" className="text-xs font-semibold">
                        {parsedLinks.length} Links Parsed
                      </Badge>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border text-xs">
                      {parsedLinks.slice(0, 5).map((l, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between bg-muted/10">
                          <span className="truncate max-w-[250px] font-medium" title={l.originalUrl}>{l.originalUrl}</span>
                          <span className="text-muted-foreground font-mono">{l.customAlias || '(auto)'}</span>
                        </div>
                      ))}
                      {parsedLinks.length > 5 && (
                        <div className="p-2 text-center text-muted-foreground text-xs font-medium">
                          + {parsedLinks.length - 5} more links...
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={resetState}>Reset</Button>
                      <Button onClick={handleUpload}>Shorten Links</Button>
                    </div>
                  </div>
                )}

                {status === 'uploading' && (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <div>
                      <p className="font-semibold">Shortening Links...</p>
                      <p className="text-xs text-muted-foreground mt-1">Uploading links to server, please wait.</p>
                    </div>
                  </div>
                )}

                {status === 'completed' && (
                  <div className="space-y-4">
                    <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Upload Processed</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Successfully shortened <strong>{successCount}</strong> links.
                        </p>
                      </div>
                    </div>

                    {failures.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                          Failed Rows ({failures.length})
                        </h4>
                        <div className="max-h-36 overflow-y-auto border border-red-500/20 rounded-lg divide-y divide-red-500/10 text-xs bg-red-500/5">
                          {failures.map((f, idx) => (
                            <div key={idx} className="p-2 flex items-start justify-between gap-4">
                              <span className="truncate max-w-[200px] text-muted-foreground" title={f.originalUrl}>{f.originalUrl}</span>
                              <span className="text-red-600 text-right">{f.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={() => { resetState(); onClose(); }}>Done</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
