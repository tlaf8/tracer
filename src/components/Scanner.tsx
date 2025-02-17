import React, { useRef, useEffect } from 'react';
import QrScanner from "qr-scanner";

interface  ScannerProps {
    onScan: (data: string) => void;
    onError: (error: string | Error) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onError }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            qrScannerRef.current = new QrScanner(
                videoRef.current,
                result => onScan(result.data),
                {
                    onDecodeError: error => onError(error),
                    highlightScanRegion: true,
                }
            );
            qrScannerRef.current.start().catch(err => {
                console.error(err);
                onError(err);
            });
        }

        return () => {
            qrScannerRef.current?.stop();
        };
    }, []);

    return (
        <div>
            <video ref={videoRef} className="w-100 h-100 rounded" />
        </div>
    )
}

export default Scanner;