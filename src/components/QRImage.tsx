import React from "react";
import {useState} from 'react';

interface QRImageProps {
    key: number,
    src: string,
}

const openInNewTab = (base64DataUrl: string) => {
    const base64 = base64DataUrl.split(',')[1];
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const blobUrl = URL.createObjectURL(blob);

    window.open(blobUrl, '_blank');
};

const QRImage: React.FC<QRImageProps> = ({ key, src }) => {
    const [hoveringDownload, setHoveringDownload] = useState<boolean>(false)

    return (
        <div style={{
            border: '1px solid #4D5154',
            borderRadius: '8px'
        }}>
            <div className='d-flex flex-column align-items-end p-2'>
                <img
                    key={key}
                    src={src}
                    alt={`QR ${key + 1}`}
                    style={{
                        width: '150px',
                    }}
                />
                <span className='bi bi-box-arrow-up-right mt-2 me-1' style={{
                    color: hoveringDownload ? 'white' : '#4D5154',
                    cursor: 'pointer'
                }}
                      onClick={() => openInNewTab(src)}
                      onMouseEnter={() => setHoveringDownload(true)}
                      onMouseLeave={() => setHoveringDownload(false)}>
                </span>
            </div>
        </div>
    )
}

export default QRImage;