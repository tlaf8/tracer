import React, {useRef, useCallback, useEffect} from 'react';

const CameraFeed: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const getCamera = useCallback(async (): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    }, []);

    useEffect(() => {
        getCamera().catch(error => {
            console.error(error);
        })
    }, [getCamera]);

    return (
        <div>
            <video className="w-100 h-100 rounded" ref={videoRef} autoPlay playsInline/>
        </div>
    )
}

export default CameraFeed;