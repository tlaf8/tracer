import React, {useCallback, useEffect, useState} from 'react';
import QRCode from 'qrcode';
import QRImage from './QRImage';
import JSZip from "jszip";
import {saveAs} from "file-saver";

interface QRItem {
    data: string;
    label: string;
}

interface QRCodeGridProps {
    qrData: QRItem[];
}

const downloadQRCodesZip = async (qrData: QRItem[], qrImages: string[]) => {
    const zip = new JSZip();

    qrData.forEach((item: QRItem, index: number) => {
        const base64 = qrImages[index].split(',')[1];
        const filename = `${item.label.replace(/[^a-z0-9]/gi, '_')}.png`; // clean filename
        zip.file(filename, base64, {base64: true});
    });

    saveAs(await zip.generateAsync({type: 'blob'}), `tracer-qrcodes.zip`);
};


const QRCodeGrid: React.FC<QRCodeGridProps> = ({qrData}) => {
    const [hoveringDownload, setHoveringDownload] = useState<boolean>(false);
    const [qrImages, setQrImages] = useState<string[]>([]);

    const generateQRCodes = useCallback(async () => {
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

    useEffect(() => {
        if (qrData.length > 0) {
            generateQRCodes().catch((err) => {
                console.error(err);
            });
        } else {
            setQrImages([]);
        }
    }, [generateQRCodes, qrData]);

    return (
        <div style={{padding: '20px'}}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '20px',
                    justifyItems: 'center',
                }}
            >
                {qrImages.map((src, index) => (
                    <QRImage src={src} key={index}/>
                ))}
            </div>
            <div className='position-absolute' style={{
                bottom: '25px',
                right: '30px',
            }}>
                <span className='bi bi-download' style={{
                    color: hoveringDownload ? 'white' : '#4D5154',
                    cursor: 'pointer',
                    fontSize: '2rem',
                }}
                      onClick={() => downloadQRCodesZip(qrData, qrImages)}
                      onMouseEnter={() => setHoveringDownload(true)}
                      onMouseLeave={() => setHoveringDownload(false)}>
                </span>
            </div>
        </div>
    );
};

export default QRCodeGrid;
