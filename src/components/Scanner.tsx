import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import QrScanner from 'qr-scanner';

interface ScannerProps {
    onScan: (data: string) => void;
    onError: (error: string | Error) => void;
    setStatus: (status: boolean) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onError, setStatus }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);

    const startScanner = (): void => {
        if (isScanning || !videoRef.current) return;

        stopScanner();

        qrScannerRef.current = new QrScanner(
            videoRef.current,
            result => onScan(result.data),
            {
                onDecodeError: error => onError(error),
                highlightCodeOutline: true,
                highlightScanRegion: false,
            }
        );

        setTimeout(() => {
            requestAnimationFrame(async () => {
                try {
                    await qrScannerRef.current?.start();
                    setIsScanning(true);
                    setStatus(true);
                } catch (error) {
                    onError(error as Error | string);
                }
            });
        }, 200);
    };

    const stopScanner = useCallback((): void => {
        qrScannerRef.current?.stop();
        qrScannerRef.current?.destroy();
        qrScannerRef.current = null;
        setIsScanning(false);
        setStatus(false);
    }, [setStatus]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                stopScanner();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [stopScanner]);

    useEffect(() => {
        return () => stopScanner();
    }, [stopScanner]);

    return (
        <div className='d-flex flex-column align-items-center justify-content-center'>
            {!isScanning ? (
                <motion.button
                    className='btn btn-outline-secondary rounded-pill mt-5 p-4'
                    onClick={startScanner}
                    key='start'
                    initial={{ y: -120, scale: 0 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ duration: 1.5, ease: 'circInOut' }}
                >
                    Start Camera
                </motion.button>
            ) : (
                <motion.button
                    className='btn btn-outline-secondary rounded-pill mb-3'
                    onClick={stopScanner}
                    key='stop'
                    initial={{ y: -60 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1, ease: 'circInOut' }}
                >
                    Stop Camera
                </motion.button>
            )}

            <div className="position-relative w-75 h-auto">
                <video ref={videoRef} className='w-100 h-auto rounded' />
                {isScanning && (
                    <div
                        className="position-absolute top-50 start-50 translate-middle"
                        style={{
                            width: "240px",
                            height: "240px",
                            border: "3px solid rgba(255,255,255,0.9)",
                            borderRadius: "16px",
                            pointerEvents: "none",
                            boxShadow: "0 0 25px rgba(255,255,255,0.4)",
                            animation: "pulseBox 2s infinite ease-in-out",
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Scanner;
