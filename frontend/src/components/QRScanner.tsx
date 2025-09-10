"use client";

import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { X, Camera, AlertCircle } from 'lucide-react';
import { QRScanResult } from '@/types';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: QRScanResult) => void;
  title?: string;
}

export default function QRScanner({ isOpen, onClose, onScan, title = "Scan QR Code" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      if (!videoRef.current) return;

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const scanResult = parseQRResult(result.data);
          onScan(scanResult);
          stopScanning();
          onClose();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      );

      await qrScannerRef.current.start();
    } catch (err) {
      console.error('QR Scanner error:', err);
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const parseQRResult = (data: string): QRScanResult => {
    // Check if it's a wallet address (starts with 0x and is 64 characters)
    if (data.startsWith('0x') && data.length === 66) {
      return {
        type: 'wallet_address',
        data,
        address: data
      };
    }

    // Check if it's a session ID (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(data)) {
      return {
        type: 'session_id',
        data,
        session_id: data
      };
    }

    // Check if it's a payment request (JSON format)
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'payment_request' && parsed.session_id && parsed.amount) {
        return {
          type: 'payment_request',
          data,
          session_id: parsed.session_id
        };
      }
    } catch (e) {
      // Not JSON, continue
    }

    // Default to wallet address if it looks like one
    if (data.startsWith('0x')) {
      return {
        type: 'wallet_address',
        data,
        address: data
      };
    }

    // Unknown format
    return {
      type: 'wallet_address',
      data,
      address: data
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Scanner */}
        <div className="relative">
          <div className="aspect-square bg-slate-100 relative overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-white rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-2xl"></div>
              </div>
            </div>

            {/* Status */}
            {isScanning && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Scanning...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6 bg-slate-50">
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600">
              Point your camera at a QR code to scan
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>• Wallet addresses (0x...)</p>
              <p>• Session IDs</p>
              <p>• Payment requests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
