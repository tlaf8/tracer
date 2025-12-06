import React, {useCallback, useEffect, useState} from 'react';
import QRCode from 'qrcode';
import QRImage from './QRImage';
import JSZip from "jszip";
import {saveAs} from "file-saver";
import Icon from "./Icon.tsx";

interface QRItem {
    data: string;
    label: string;
}

interface QRCodeGridProps {
    qrData: QRItem[];
}

const downloadQRCodesZip = async (qrData: QRItem[], qrImages: string[]): Promise<void> => {
    if (!qrData || qrImages.length === 0) return;

    const zip = new JSZip();

    qrData.forEach((item: QRItem, index: number) => {
        const base64 = qrImages[index].split(',')[1];
        const filename = `${item.label.replace(/[^a-z0-9]/gi, '_')}.png`; // clean filename
        zip.file(filename, base64, {base64: true});
    });

    saveAs(await zip.generateAsync({type: 'blob'}), `tracer-qrcodes.zip`);
};


const QRCodeGrid: React.FC<QRCodeGridProps> = ({qrData}: QRCodeGridProps) => {
    const [qrImages, setQrImages] = useState<string[]>([]);

    const generateQRCodes = useCallback(async (): Promise<void> => {
        const images: string[] = [];
        const qrSize = 150;
        const fontSize = 11;
        const fontFamily = 'Arial';

        for (const item of qrData) {
            const qrCanvas = document.createElement('canvas');
            await QRCode.toCanvas(qrCanvas, item.data, {
                width: qrSize,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });

            const labelCanvas = document.createElement('canvas');
            const labelCtx = labelCanvas.getContext('2d');
            const labelHeight = fontSize + 8;
            const finalCanvas = document.createElement('canvas');
            const ctx = finalCanvas.getContext('2d');
            if (!labelCtx || !ctx) continue;

            labelCtx.font = `${fontSize}px ${fontFamily}`;
            finalCanvas.width = qrSize;
            finalCanvas.height = qrSize + labelHeight;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            ctx.drawImage(qrCanvas, 0, 0);
            ctx.fillStyle = '#000000';
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const label = item.label.length > 30 ? item.label.slice(0, 27) + '…' : item.label;

            ctx.fillText(label, qrSize / 2, qrSize + 4);

            images.push(finalCanvas.toDataURL('image/png'));
        }

        setQrImages(images);
    }, [qrData])

    useEffect((): void => {
        if (qrData.length > 0) {
            generateQRCodes().catch((err) => {
                console.error(err);
            });
        } else {
            setQrImages([]);
        }
    }, [generateQRCodes, qrData]);

    return (
        <div className='overflow-auto scrollable-container' style={{
            padding: '20px',
            height: '85vh',
        }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '20px',
                    justifyItems: 'center',
                }}
            >
                {qrImages.map((src, index) => (
                    <QRImage src={src} index={index} key={index}/>
                ))}
            </div>
            <div className='bg-dark d-flex justify-content-center align-items-center rounded-pill position-absolute' style={{
                bottom: '25px',
                right: '25px',
                width: '75px',
                height: '75px',
                zIndex: '999'
            }}>
                <Icon className='bi bi-download' onClick={(): Promise<void> => downloadQRCodesZip(qrData, qrImages)} fontSize='2rem' />
            </div>
        </div>
    );
};

export default QRCodeGrid;
