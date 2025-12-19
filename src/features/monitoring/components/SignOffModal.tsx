import React, { useEffect, useRef, useState } from 'react';
import { TermSignOff } from '@/types';
import { X } from 'lucide-react';

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signerName: string, signatureImage?: string) => void;
  signerName: string;
  existingSignOff: TermSignOff | null;
}

export const SignOffModal: React.FC<SignOffModalProps> = ({ isOpen, onClose, onConfirm, signerName, existingSignOff }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [name, setName] = useState(signerName);
  const [mode, setMode] = useState<'type' | 'draw'>('type');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setName(signerName);
      setHasDrawn(false);
      setMode('type');
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen, signerName]);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111827'; // slate-900
        ctx.lineWidth = 3;
      }
    }
  }, [mode]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.nativeEvent instanceof MouseEvent) {
      return { x: e.nativeEvent.clientX - rect.left, y: e.nativeEvent.clientY - rect.top };
    }
    if (e.nativeEvent instanceof TouchEvent && e.nativeEvent.touches.length > 0) {
      return { x: e.nativeEvent.touches[0].clientX - rect.left, y: e.nativeEvent.touches[0].clientY - rect.top };
    }
    return { x: 0, y: 0 };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if(canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    }
  };

  const handleConfirm = () => {
    if (!name.trim()) return;
    if (mode === 'draw' && hasDrawn && canvasRef.current) {
        const signatureImage = canvasRef.current.toDataURL('image/png');
        onConfirm(name.trim(), signatureImage);
    } else {
        onConfirm(name.trim());
    }
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  }

  const isConfirmDisabled = !name.trim() || (mode === 'draw' && !hasDrawn);

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-xl shadow-xl w-11/12 max-w-lg backdrop:bg-black/50 border border-slate-200">
      <div className="p-6 bg-white text-slate-900">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">{existingSignOff?.date ? 'Review Sign Off' : 'Confirm Sign Off'}</h3>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>
        
        {existingSignOff?.date ? (
            <div className="mt-4 text-sm text-slate-700 text-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p>This document was signed off by:</p>
                 {existingSignOff.signatureImage ? (
                    <img src={existingSignOff.signatureImage} alt="Signature" className="my-3 mx-auto h-20 w-auto bg-white border rounded-md p-2" />
                ) : (
                    <p className="font-caveat text-4xl my-3 text-slate-800">{existingSignOff.teacherName}</p>
                )}
                <p className="font-bold text-lg">{existingSignOff.teacherName}</p>
                <p className="text-slate-500">on {new Date(existingSignOff.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
            </div>
        ) : (
            <>
                <div className="mt-4">
                    <label htmlFor="signerNameInput" className="block text-sm font-medium text-slate-700">Your Name (Required)</label>
                    <input 
                        type="text"
                        id="signerNameInput"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full p-2.5 bg-white rounded-lg border border-slate-300 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        placeholder="Enter your full name"
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Signature</label>
                    <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 mb-3 w-min">
                        <button onClick={() => setMode('type')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'type' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Type</button>
                        <button onClick={() => setMode('draw')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${mode === 'draw' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Draw</button>
                    </div>

                    {mode === 'type' ? (
                        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center h-40">
                            <p className="font-caveat text-5xl text-slate-700">{name || 'Your Signature'}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                width="450"
                                height="160"
                                className="border border-slate-200 rounded-lg bg-white cursor-crosshair touch-none w-full"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            <button onClick={clearCanvas} className="absolute top-2 right-2 px-2 py-1 bg-white border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-50">Clear</button>
                        </div>
                    )}
                </div>
                
                <p className="mt-4 text-xs text-slate-500 bg-amber-50 p-2 rounded text-amber-700 border border-amber-100">
                    By confirming, you certify that you have completed and/or reviewed the required documentation and that it is accurate.
                </p>
            </>
        )}
      </div>
      <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-200 rounded-b-xl">
        <button onClick={handleClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            {existingSignOff?.date ? 'Close' : 'Cancel'}
        </button>
        {!existingSignOff?.date && (
            <button 
                onClick={handleConfirm} 
                disabled={isConfirmDisabled}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Confirm and Sign
            </button>
        )}
      </div>
    </dialog>
  );
};