/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// --- TOAST SYSTEM ---
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastsList: Toast[] = [];

export const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = { id, message, type };
  toastsList.push(newToast);
  toastListeners.forEach(listener => listener([...toastsList]));
  
  setTimeout(() => {
    toastsList = toastsList.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener([...toastsList]));
  }, 4000);
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToastsChange = (updated: Toast[]) => setToasts(updated);
    toastListeners.push(handleToastsChange);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleToastsChange);
    };
  }, []);

  const removeToast = (id: string) => {
    toastsList = toastsList.filter(t => t.id !== id);
    setToasts([...toastsList]);
  };

  return (
    <div id="toast-root" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full no-print">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-xl shadow-xl border transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-950'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-sky-50 border-sky-200 text-sky-950'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="text-emerald-600 w-5 h-5 flex-shrink-0" />}
            {toast.type === 'error' && <XCircle className="text-red-600 w-5 h-5 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="text-sky-600 w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-800 transition-colors ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};


// --- VECTOR BARCODE GENERATOR ---
export const Barcode: React.FC<{ value: string }> = ({ value }) => {
  // Generates a simple, scan-ready aesthetic vector barcode
  return (
    <div className="flex flex-col items-center p-2 bg-white rounded border border-gray-200">
      <svg className="h-10 w-44" viewBox="0 0 100 30" preserveAspectRatio="none">
        <rect width="100" height="30" fill="white" />
        <g fill="black">
          {/* A mock repeatable vector pattern unique to the code value */}
          {Array.from({ length: 40 }).map((_, i) => {
            const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0) * (i + 1), 0);
            const isBar = (hash % (i % 3 === 0 ? 3 : 2)) === 0;
            return isBar ? (
              <rect
                key={i}
                x={i * 2.3 + 4}
                y="2"
                width={i % 5 === 0 ? "1.5" : "0.7"}
                height="26"
              />
            ) : null;
          })}
        </g>
      </svg>
      <span className="text-[10px] font-mono tracking-widest mt-1 text-gray-700 font-bold">{value}</span>
    </div>
  );
};


// --- VECTOR QR CODE GENERATOR ---
export const QRCode: React.FC<{ value: string }> = ({ value }) => {
  // Generates an attractive mock QR code
  return (
    <div className="flex flex-col items-center p-2 bg-white rounded border border-gray-200 w-fit">
      <svg className="w-24 h-24" viewBox="0 0 24 24">
        {/* Borders */}
        <rect width="24" height="24" fill="white" />
        {/* Helper function to generate deterministic dark blocks based on value string */}
        {Array.from({ length: 24 }).map((_, y) => (
          <g key={y}>
            {Array.from({ length: 24 }).map((_, x) => {
              // Position detection patterns (Standard QR boxes in 3 corners)
              const isFinder = 
                (x < 7 && y < 7) || 
                (x > 16 && y < 7) || 
                (x < 7 && y > 16);
              
              if (isFinder) {
                // Draw finder pattern outline
                const isBorder = x === 0 || x === 6 || y === 0 || y === 6 ||
                                 (x === 17 || x === 23) && (y === 0 || y === 6) ||
                                 (x === 0 || x === 6) && (y === 17 || y === 23);
                const isCenter = (x > 1 && x < 5 && y > 1 && y < 5) ||
                                 (x > 18 && x < 22 && y > 1 && y < 5) ||
                                 (x > 1 && x < 5 && y > 18 && y < 22);
                
                if (isBorder || isCenter) {
                  return <rect key={x} x={x} y={y} width="1" height="1" fill="#0f172a" />;
                }
                return null;
              }
              
              // Seed pseudo-random blocks with the text hash
              const seed = value.split('').reduce((acc, c) => acc + c.charCodeAt(0) * (x + y + 1), 0);
              const fill = (seed % 3 === 0 || seed % 7 === 0) ? '#0f172a' : 'transparent';
              
              return fill !== 'transparent' ? (
                <rect key={x} x={x} y={y} width="1" height="1" fill={fill} />
              ) : null;
            })}
          </g>
        ))}
      </svg>
      <span className="text-[9px] font-mono mt-1 text-gray-500 uppercase">{value.split('-')[0]}</span>
    </div>
  );
};


// --- SIGNATURE DRAWING PAD ---
interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ label, onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#047857'; // Deep emerald stroke
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#f8fafc'; // light slate bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save signature
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL();
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onSave('');
        if (onClear) onClear();
      }
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <canvas
          id={`sig-canvas-${label.toLowerCase().replace(/\s/g, '-')}`}
          ref={canvasRef}
          width={300}
          height={120}
          className="w-full h-[120px] cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-2 right-2 bg-white text-slate-500 hover:text-slate-800 px-2 py-1 text-[10px] rounded border border-slate-200 shadow-sm font-semibold transition-all"
        >
          Clear
        </button>
      </div>
      <span className="text-[10px] text-slate-500 italic font-medium">Sign using your cursor or touchscreen</span>
    </div>
  );
};


// --- EXCEL/CSV DATA EXPORTER ---
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    showToast('No data available to export', 'error');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      let val = obj[header];
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      // Escape quotation marks
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );
  
  const csvContent = 'data:text/csv;charset=utf-8,' 
    + [headers.join(','), ...rows].join('\n');
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`${filename}.csv exported successfully`, 'success');
};


// --- PRINT POPUP WRAPPER ---
export const handlePrintLayout = (elementId: string) => {
  const printElement = document.getElementById(elementId);
  if (!printElement) {
    showToast('Element to print not found', 'error');
    return;
  }
  
  // Open a new top-level window/tab to bypass iframe sandbox restrictions
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Popup blocked! Please allow popups to print/save.', 'error');
    return;
  }

  // Create deep copy/clone of targeted element
  const clone = printElement.cloneNode(true) as HTMLElement;
  
  // Automatically strip out interactive buttons, print triggers, or close icons
  clone.querySelectorAll('.no-print').forEach(el => el.remove());

  // Determine layout and size
  const idLower = elementId.toLowerCase();
  const isThermal = (idLower.includes('thermal') || idLower.includes('receipt') || idLower.includes('slip') || idLower.includes('voucher')) && !idLower.includes('salary-slip');
  
  let customStyle = '';
  if (isThermal) {
    customStyle = `
      body {
        margin: 0;
        padding: 4mm;
        background: white !important;
        color: black !important;
        font-family: 'Courier New', Courier, monospace !important;
        font-size: 11px !important;
        width: 80mm;
        max-width: 80mm;
      }
      * {
        color: black !important;
        background: transparent !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }
      img {
        max-width: 100px;
        height: auto;
        display: block;
        margin: 0 auto 10px;
      }
      @page {
        size: auto;
        margin: 0mm;
      }
    `;
  } else {
    customStyle = `
      body {
        margin: 0;
        padding: 0;
        background: white !important;
        color: black !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      * {
        color: black !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }
      #print-root > * {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
      }
      ${elementId === 'printable-a4-agreement' ? `
      #print-root > #printable-a4-agreement {
        height: 281mm !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
      }
      #print-root > #printable-a4-agreement > * {
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }
      ` : ''}
      @page {
        size: A4;
        margin: 8mm 10mm;
      }
    `;
  }

  // Write base document structure
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Document - Manha Financing</title>
        <style>
          ${customStyle}
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
    </html>
  `);

  // Copy all link tags (stylesheets, fonts) and style tags from current document to the popup
  const headTags = Array.from(document.querySelectorAll('link, style'));
  headTags.forEach(tag => {
    printWindow.document.head.appendChild(tag.cloneNode(true));
  });

  // Append cloned content to root of new document
  const printRoot = printWindow.document.getElementById('print-root');
  if (printRoot) {
    printRoot.appendChild(clone);
  }

  printWindow.document.close();

  // Trigger print and handle cleanup
  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };

  // Wait for resources to load, fallback to timeout if needed
  printWindow.onload = triggerPrint;
  setTimeout(triggerPrint, 600);

  showToast('Opening print dialog...', 'success');
};

// --- CUSTOM CONFIRMATION DIALOG ---
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: (password?: string) => void;
  onCancel: () => void;
  requirePassword?: boolean;
  placeholderPassword?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
  requirePassword = false,
  placeholderPassword = 'Enter administrator password...'
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requirePassword) {
      if (!password) {
        setError('Password is required');
        return;
      }
      onConfirm(password);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 animate-scale-up space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-full ${isDanger ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requirePassword && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Admin Authentication Required
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={placeholderPassword}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-bold"
                autoFocus
              />
              {error && <p className="text-[10px] text-red-600 font-bold">{error}</p>}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all cursor-pointer ${
                isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

