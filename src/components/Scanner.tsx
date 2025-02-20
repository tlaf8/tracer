import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import QrScanner from "qr-scanner";

interface ScannerProps {
    onScan: (data: string) => void;
    onError: (error: string | Error) => void;
    setStatus: (status: boolean) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onError, setStatus }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        return () => {
            qrScannerRef.current?.stop();
        };
    }, []);

    const startScanner = () => {
        if (!videoRef.current) return;

        qrScannerRef.current?.stop();
        qrScannerRef.current = new QrScanner(
            videoRef.current,
            result => onScan(result.data),
            {
                onDecodeError: error => onError(error),
                highlightCodeOutline: true,
                highlightScanRegion: true,
            }
        );

        setTimeout(() => {
            requestAnimationFrame(() => {
                qrScannerRef.current?.start()
                    .then(() => {
                        setIsScanning(true);
                        setStatus(true);
                    })
                    .catch(error => {
                        console.error(error);
                        onError(error);
                    })
            });
        }, 200);
    };

    const stopScanner = () => {
        qrScannerRef.current?.stop();
        qrScannerRef.current?.destroy();
        setIsScanning(false);
        setStatus(false);
    };

    return (
        <div className='d-flex flex-column align-items-center justify-content-center'>
            {!isScanning ? (
                <motion.button
                    className='btn btn-outline-secondary rounded-pill mt-5 p-4'
                    onClick={startScanner}
                    key='start'
                    initial={{y: -120, scale: 0}}
                    animate={{y: 0, scale: 1}}
                    transition={{duration: 1.5, ease: 'circInOut'}}
                >Start Camera</motion.button>
            ) : (
                <motion.button
                    className='btn btn-outline-secondary rounded-pill mb-3'
                    onClick={stopScanner}
                    key='stop'
                    initial={{y: -60}}
                    animate={{y: 0}}
                    transition={{duration: 1, ease: 'circInOut'}}
                >Stop Camera</motion.button>
            )}
            <video ref={videoRef} className="w-100 h-100 rounded" />
        </div>
    );
}

export default Scanner;
