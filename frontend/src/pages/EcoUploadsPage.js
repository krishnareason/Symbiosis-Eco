import React, { useState, useEffect, useCallback, useRef } from 'react';
import EXIF from 'exif-js';
import './EcoUploadsPage.css';
import { API_BASE_URL } from '../apiConfig';

// --- MAIN PAGE COMPONENT ---
export default function EcoUploadsPage() {
    
    return (
        <div className="eco-uploads-container">
            <div className="upload-panel" style={{margin: '0 auto'}}>
                <UploaderAndCapture />
            </div>
        </div>
    );
}

// --- UPLOADER AND CAPTURE COMPONENT ---
const UploaderAndCapture = () => {
    const [mode, setMode] = useState('upload');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const resetState = (clearFile = false) => {
        setError('');
        setMessage('');
        setIsSubmitting(false);
        stopCamera();
        if (clearFile) {
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = null;
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const uploadToBackend = async (file, dataPayload, setProgressMessage) => {
        const formData = new FormData();
        formData.append("file", file, file.name || "live_capture.jpg");
        formData.append("lat", dataPayload.lat);
        formData.append("lon", dataPayload.lng);

        if (setProgressMessage) setProgressMessage("Uploading image...");
        const res = await fetch(`${API_BASE_URL}/threats/upload`, { 
            method: 'POST', 
            body: formData 
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.detail || "Upload failed.");
        }
        
        if (data.status === "processing" && data.data && data.data.threat_id) {
            if (setProgressMessage) setProgressMessage("Image uploaded. Waiting for Gemini AI verification (~10 secs)...");
            const threatId = data.data.threat_id;
            
            for (let i = 0; i < 15; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const statusRes = await fetch(`${API_BASE_URL}/threats/${threatId}`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.status === 'verified') {
                        return `Verified as: ${statusData.title}! It will now appear on the map.`;
                    } else if (statusData.status === 'rejected') {
                        throw new Error("Gemini AI rejected the image. No environmental threat detected.");
                    }
                }
            }
            throw new Error("AI verification timed out.");
        }
        
        return "Submitted successfully!";
    };

    const handleLiveCapture = async () => {
        resetState();
        setIsSubmitting(true);
        try {
            const userLocation = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
            const userCoords = { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude };

            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
            const blob = await (await fetch(imageDataUrl)).blob();
            
            const successMsg = await uploadToBackend(blob, {
                lat: userCoords.latitude,
                lng: userCoords.longitude
            }, setMessage);
            setMessage(successMsg);
        } catch (err) {
            setError(err.message || "Live capture failed.");
        } finally {
            setIsSubmitting(false);
            stopCamera();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        resetState();
        setIsSubmitting(true);
        try {
            const exifData = await new Promise((resolve, reject) => {
                EXIF.getData(file, function() {
                    const allTags = EXIF.getAllTags(this);
                    if (Object.keys(allTags).length === 0) {
                        reject(new Error("No EXIF data found. The file may have been modified or is not a direct camera image."));
                        return;
                    }
                    const lat = EXIF.getTag(this, "GPSLatitude");
                    const lon = EXIF.getTag(this, "GPSLongitude");
                    const dateTime = EXIF.getTag(this, "DateTimeOriginal");
                    
                    if (!lat || !lon || !dateTime) {
                        reject(new Error("Image is missing required GPS or Date metadata. Please use an original, unmodified photo from your camera."));
                    } else {
                        resolve({ lat, lon, dateTime });
                    }
                });
            });
            
            const toDecimal = (gpsData) => {
                if (!gpsData || !Array.isArray(gpsData) || gpsData.length !== 3) return NaN;
                const degrees = (gpsData[0]?.numerator && gpsData[0]?.denominator) ? gpsData[0].numerator / gpsData[0].denominator : 0;
                const minutes = (gpsData[1]?.numerator && gpsData[1]?.denominator) ? gpsData[1].numerator / gpsData[1].denominator : 0;
                const seconds = (gpsData[2]?.numerator && gpsData[2]?.denominator) ? gpsData[2].numerator / gpsData[2].denominator : 0;
                return degrees + (minutes / 60) + (seconds / 3600);
            };
            const imageCoords = { latitude: toDecimal(exifData.lat), longitude: toDecimal(exifData.lon) };
            
            if (isNaN(imageCoords.latitude) || isNaN(imageCoords.longitude)) {
                throw new Error("Could not parse GPS coordinates from the image file. The format may be unsupported.");
            }

            const successMsg = await uploadToBackend(file, {
                lat: imageCoords.latitude,
                lng: imageCoords.longitude
            }, setMessage);
            setMessage(successMsg);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
            e.target.value = null;
        }
    };
    
    const handleDeveloperSubmit = async (e) => {
        e.preventDefault();
        resetState(true);
        setIsSubmitting(true);
        const { lat, lng } = e.target.elements;
        try {
            // For developer manual submit, we can just use a dummy blank image for validation if needed,
            // but our backend route strictly requires a file. So we create a dummy file.
            const dummyCanvas = document.createElement("canvas");
            dummyCanvas.width = 10; dummyCanvas.height = 10;
            const dummyCtx = dummyCanvas.getContext("2d");
            dummyCtx.fillStyle = "gray"; dummyCtx.fillRect(0,0,10,10);
            const dummyDataUrl = dummyCanvas.toDataURL('image/jpeg');
            const blob = await (await fetch(dummyDataUrl)).blob();
            
            const successMsg = await uploadToBackend(blob, {
                lat: parseFloat(lat.value),
                lng: parseFloat(lng.value)
            }, setMessage);
            setMessage(successMsg);
            e.target.reset();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startCamera = () => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(streamData => {
                setStream(streamData);
                if (videoRef.current) videoRef.current.srcObject = streamData;
            })
            .catch(err => setError("Could not access camera."));
    };
    
    useEffect(() => {
        if (mode === 'capture' && !stream) startCamera();
        else if (mode !== 'capture' && stream) stopCamera();
        return stopCamera;
    }, [mode, stream, stopCamera]);

    return (
        <div className="uploader-card">
            <div className="mode-selector">
                <button onClick={() => { resetState(true); setMode('upload'); }} className={mode === 'upload' ? 'active' : ''}>Upload</button>
                <button onClick={() => { resetState(true); setMode('capture'); }} className={mode === 'capture' ? 'active' : ''}>Live Capture</button>
                <button onClick={() => { resetState(true); setMode('developer'); }} className={mode === 'developer' ? 'active' : ''}>Dev Tool</button>
            </div>

            {mode === 'upload' && (
                <div>
                    <h3>Upload Geotagged Image</h3>
                    <p>Select a valid, original photo from your device. Do not use images from social media or messaging apps as they may lack location data.</p>
                    <input type="file" id="file-upload" accept="image/jpeg, image/jpg" onChange={handleFileUpload} disabled={isSubmitting} />
                    <label htmlFor="file-upload" className={`custom-file-upload ${isSubmitting ? 'disabled' : ''}`}>
                       {isSubmitting ? 'Processing...' : 'Select Geotagged Image'}
                    </label>
                </div>
            )}
            
            {mode === 'capture' && (
                <div>
                    <h3>Live Camera Capture</h3>
                    <div className="camera-view">
                        <video ref={videoRef} autoPlay playsInline muted></video>
                        <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
                    </div>
                    <button onClick={handleLiveCapture} disabled={isSubmitting || !stream} className="capture-btn">
                        {isSubmitting ? "Submitting..." : "Capture & Submit"}
                    </button>
                </div>
            )}

            {mode === 'developer' && (
                <div>
                    <h3>Developer Manual Upload</h3>
                    <p>Submit data directly to the new Python backend.</p>
                    <form className="dev-form" onSubmit={handleDeveloperSubmit}>
                        <input name="lat" placeholder="Latitude (e.g., 28.6139)" required type="number" step="any" />
                        <input name="lng" placeholder="Longitude (e.g., 77.2090)" required type="number" step="any" />
                        <button type="submit" disabled={isSubmitting}>Submit Test Data</button>
                    </form>
                </div>
            )}

            {error && <p className="message error-message">{error}</p>}
            {message && <p className="message success-message">{message}</p>}
        </div>
    );
};