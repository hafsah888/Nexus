import React, { useState, useRef } from 'react';
import {
  FileText, Upload, Download, Trash2, Share2, Eye, PenTool, X, Check, AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type DocStatus = 'Draft' | 'In Review' | 'Signed';

interface DocItem {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  status: DocStatus;
  fileUrl?: string;
  signatureDataUrl?: string;
}

const initialDocuments: DocItem[] = [
  { id: '1', name: 'Pitch Deck 2024.pdf',         type: 'PDF',         size: '2.4 MB', lastModified: '2024-02-15', shared: true,  status: 'In Review' },
  { id: '2', name: 'Financial Projections.xlsx',   type: 'Spreadsheet', size: '1.8 MB', lastModified: '2024-02-10', shared: false, status: 'Draft'     },
  { id: '3', name: 'Business Plan.docx',           type: 'Document',    size: '3.2 MB', lastModified: '2024-02-05', shared: true,  status: 'Signed'    },
  { id: '4', name: 'Market Research.pdf',          type: 'PDF',         size: '5.1 MB', lastModified: '2024-01-28', shared: false, status: 'Draft'     },
];

// ── helpers ──────────────────────────────────────────────
const statusVariant = (s: DocStatus) =>
  s === 'Signed' ? 'success' : s === 'In Review' ? 'accent' : 'gray';

const getFileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'PDF';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Spreadsheet';
  if (['doc', 'docx'].includes(ext)) return 'Document';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'Image';
  return 'File';
};

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

const today = () => new Date().toISOString().split('T')[0];

// ── main component ────────────────────────────────────────
export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments]       = useState<DocItem[]>(initialDocuments);
  const [previewDoc, setPreviewDoc]     = useState<DocItem | null>(null);
  const [signingDoc, setSigningDoc]     = useState<DocItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // id to confirm
  const [shareToast, setShareToast]     = useState<string | null>(null);
  const [uploadError, setUploadError]   = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── upload ──────────────────────────────────────────────
  const handleUploadClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadError('No file selected. Please choose a file to upload.');
      return;
    }

    const allowed = ['pdf','doc','docx','xls','xlsx','png','jpg','jpeg'];
    const invalid = Array.from(files).filter(
      (f) => !allowed.includes(f.name.split('.').pop()?.toLowerCase() ?? '')
    );
    if (invalid.length > 0) {
      setUploadError(`Unsupported file type: ${invalid.map((f) => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }

    const newDocs: DocItem[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: file.name,
      type: getFileType(file.name),
      size: fmtSize(file.size),
      lastModified: today(),
      shared: false,
      status: 'Draft',
      fileUrl: URL.createObjectURL(file),
    }));

    setDocuments((prev) => [...newDocs, ...prev]);
    setUploadError(null);
    e.target.value = '';
  };

  // ── delete with confirmation ─────────────────────────────
  const handleDeleteConfirmed = () => {
    if (!deleteConfirm) return;
    setDocuments((prev) => prev.filter((d) => d.id !== deleteConfirm));
    setDeleteConfirm(null);
  };

  // ── status change ────────────────────────────────────────
  const handleStatusChange = (id: string, status: DocStatus) =>
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));

  // ── share (copy link mock) ───────────────────────────────
  const handleShare = (doc: DocItem) => {
    navigator.clipboard?.writeText(`https://nexus.app/docs/${doc.id}`).catch(() => {});
    setShareToast(doc.name);
    setTimeout(() => setShareToast(null), 2500);
  };

  // ── download (works for both initial & uploaded docs) ────
  const handleDownload = (doc: DocItem) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.name;
      a.click();
    } else {
      // initial (mock) docs — just show a quick notice via toast reuse
      setShareToast(`"${doc.name}" is a sample file — no real download available.`);
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  // ── dynamic storage stats ────────────────────────────────
  const totalMB = documents.reduce((acc, d) => {
    const n = parseFloat(d.size);
    return acc + (d.size.includes('KB') ? n / 1024 : n);
  }, 0);
  const limitMB  = 20;
  const usedPct  = Math.min((totalMB / limitMB) * 100, 100);

  // ── render ───────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">Upload, review, and e-sign your deal documents</p>
        </div>
        <Button leftIcon={<Upload size={18} />} onClick={handleUploadClick}>
          Upload Document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
          <AlertTriangle size={16} className="shrink-0" />
          {uploadError}
          <button className="ml-auto" onClick={() => setUploadError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {shareToast.startsWith('"') ? shareToast : `Link copied for "${shareToast}"`}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">{totalMB.toFixed(1)} MB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-600 rounded-full transition-all"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limit</span>
                <span className="font-medium text-gray-900">{limitMB} MB</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">By Status</h3>
              <div className="space-y-2 text-sm">
                {(['Draft', 'In Review', 'Signed'] as DocStatus[]).map((s) => (
                  <div key={s} className="flex justify-between">
                    <span className="text-gray-600">{s}</span>
                    <span className="font-medium text-gray-900">
                      {documents.filter((d) => d.status === s).length}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="font-medium text-gray-900">{documents.length}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
            </CardHeader>
            <CardBody>
              {documents.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No documents yet. Upload one to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start p-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {/* Icon */}
                      <div className="p-2 bg-primary-50 rounded-lg mr-4 shrink-0">
                        <FileText size={24} className="text-primary-600" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                          <Badge variant={statusVariant(doc.status)} size="sm">{doc.status}</Badge>
                          {doc.shared && <Badge variant="secondary" size="sm">Shared</Badge>}
                          {doc.signatureDataUrl && (
                            <span className="text-xs text-green-600 font-medium">✓ Signed</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>Modified {doc.lastModified}</span>
                        </div>

                        {/* Status dropdown */}
                        <select
                          value={doc.status}
                          onChange={(e) => handleStatusChange(doc.id, e.target.value as DocStatus)}
                          className="mt-2 text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-700 bg-white"
                        >
                          <option value="Draft">Draft</option>
                          <option value="In Review">In Review</option>
                          <option value="Signed">Signed</option>
                        </select>

                        {/* Signature preview */}
                        {doc.signatureDataUrl && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Signature:</p>
                            <img
                              src={doc.signatureDataUrl}
                              alt="Signature"
                              className="h-10 border border-gray-200 rounded bg-white px-2"
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          title="Preview"
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => setSigningDoc(doc)}
                          title="Sign document"
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <PenTool size={17} />
                        </button>

                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download"
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Download size={17} />
                        </button>

                        <button
                          onClick={() => handleShare(doc)}
                          title="Copy share link"
                          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Share2 size={17} />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm(doc.id)}
                          title="Delete"
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={22} className="text-red-500 shrink-0" />
              <h3 className="font-semibold text-gray-900">Delete Document?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              "{documents.find((d) => d.id === deleteConfirm)?.name}" will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 truncate">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-600 ml-4">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewDoc.fileUrl && previewDoc.type === 'PDF' ? (
                <iframe src={previewDoc.fileUrl} className="w-full h-[65vh]" title={previewDoc.name} />
              ) : previewDoc.fileUrl && previewDoc.type === 'Image' ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full mx-auto rounded" />
              ) : (
                <div className="text-center py-16 text-gray-500 text-sm space-y-2">
                  <FileText size={40} className="mx-auto opacity-30" />
                  <p>Preview not available for this file type.</p>
                  {previewDoc.fileUrl && (
                    <a href={previewDoc.fileUrl} download={previewDoc.name} className="text-primary-600 hover:underline text-sm">
                      Download to view
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Signature Modal ── */}
      {signingDoc && (
        <SignatureModal
          docName={signingDoc.name}
          onCancel={() => setSigningDoc(null)}
          onSave={(dataUrl) => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === signingDoc.id ? { ...d, status: 'Signed', signatureDataUrl: dataUrl } : d
              )
            );
            setSigningDoc(null);
          }}
        />
      )}
    </div>
  );
};

// ── Signature Pad ─────────────────────────────────────────
interface SignatureModalProps {
  docName: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ docName, onCancel, onSave }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    const p = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const p = pos(e);
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap  = 'round';
      ctx.strokeStyle = '#1E3A8A';
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    setHasSig(true);
  };

  const stop = () => { isDrawing.current = false; };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setHasSig(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 truncate">Sign: {docName}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-2">Draw your signature below:</p>
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="border-2 border-dashed border-gray-300 rounded-md w-full touch-none bg-gray-50 cursor-crosshair"
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={stop}
          />
          <p className="text-xs text-gray-400 mt-1">Sign above the line using mouse or touch</p>
          <div className="flex justify-between items-center mt-3">
            <button onClick={clear} className="text-sm text-gray-500 hover:text-gray-700 underline">
              Clear
            </button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
              <Button
                size="sm"
                leftIcon={<Check size={16} />}
                onClick={() => onSave(canvasRef.current!.toDataURL('image/png'))}
                disabled={!hasSig}
              >
                Save & Mark Signed
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};