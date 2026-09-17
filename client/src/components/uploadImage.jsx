import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";

const CameraCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(0);
  const [error, setError] = useState("");
  const [cameraStarting, setCameraStarting] = useState(false);

  const isMobileOrTablet = () => {
    return /android|iphone|ipad|ipod|tablet|mobile/i.test(
      navigator.userAgent
    );
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setCameras(videoDevices);
      return videoDevices;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const startCamera = async (cameraIndex = 0, cameraList = cameras) => {
    try {
      setError("");
      setCameraStarting(true);
      stopCamera();

      let constraints;

      if (cameraList && cameraList.length > 0 && cameraList[cameraIndex]?.deviceId) {
        constraints = {
          video: {
            deviceId: { exact: cameraList[cameraIndex].deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
      } else {
        constraints = {
          video: {
            facingMode: isMobileOrTablet() ? "environment" : "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setError("Camera access was denied or is unavailable on this device.");
    } finally {
      setCameraStarting(false);
    }
  };

  const openCamera = async () => {
    setIsOpen(true);
    setCapturedImage(null);
    setError("");

    try {
      // First prompt permissions
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      initialStream.getTracks().forEach((t) => t.stop());

      const deviceList = await getCameras();
      let preferred = 0;
      if (isMobileOrTablet()) {
        const backIdx = deviceList.findIndex((d) =>
          /back|rear|environment/i.test(d.label)
        );
        if (backIdx !== -1) preferred = backIdx;
      }
      setCurrentCamera(preferred);
      await startCamera(preferred, deviceList);
    } catch (err) {
      setError("Please allow camera permission to take a product photo.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, width, height);

    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);
    stopCamera();
  };

  const dataURLToFile = (dataURL, filename) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const usePhoto = () => {
    if (!capturedImage) return;
    const file = dataURLToFile(capturedImage, `product-${Date.now()}.jpg`);
    onCapture(file, capturedImage);
    closeCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(currentCamera, cameras);
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const nextCamera = (currentCamera + 1) % cameras.length;
    setCurrentCamera(nextCamera);
    startCamera(nextCamera, cameras);
  };

  const closeCamera = () => {
    stopCamera();
    setIsOpen(false);
    setCapturedImage(null);
    setError("");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openCamera}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
      >
        <Camera size={14} />
        <span>Camera</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCamera();
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <Camera size={18} className="text-blue-600" />
                Capture Product Photo
              </h2>
              <button
                type="button"
                onClick={closeCamera}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video / Captured Viewport */}
            <div className="relative bg-slate-950 aspect-video sm:aspect-[4/3] flex items-center justify-center overflow-hidden">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {cameraStarting && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 text-white text-xs gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Starting camera...</span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/90 text-white text-center text-xs sm:text-sm">
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              {!capturedImage ? (
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {cameras.length > 1 && (
                    <button
                      type="button"
                      onClick={switchCamera}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
                    >
                      <RotateCcw size={15} />
                      <span>Switch</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={cameraStarting || !!error}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-blue-600 shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50 flex items-center justify-center text-white cursor-pointer"
                    title="Take Photo"
                  >
                    <div className="w-5 h-5 rounded-full bg-white"></div>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition"
                  >
                    <RotateCcw size={16} />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={usePhoto}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition"
                  >
                    <Check size={16} />
                    <span>Use Photo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default CameraCapture;