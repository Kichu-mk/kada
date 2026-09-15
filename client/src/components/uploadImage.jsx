import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw } from "lucide-react";

const CameraCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState(0);
    const [error, setError] = useState("");

    const isMobileOrTablet = () => {
        return /android|iphone|ipad|ipod|tablet|mobile/i.test(
            navigator.userAgent
        );
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const getCameras = async () => {
        try {
            const permissionStream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });

            permissionStream.getTracks().forEach((track) => {
                track.stop();
            });

            const devices =
                await navigator.mediaDevices.enumerateDevices();

            const videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );

            setCameras(videoDevices);

            return videoDevices;
        } catch (err) {
            console.error(err);
            setError(
                "Camera permission denied or camera is not available."
            );
            return [];
        }
    };

    const startCamera = async (
        cameraIndex = 0,
        cameraList = cameras
    ) => {
        try {
            setError("");
            stopCamera();

            let constraints;

            if (cameraList.length > 0) {
                constraints = {
                    video: {
                        deviceId: {
                            exact:
                                cameraList[cameraIndex]
                                    .deviceId,
                        },
                    },
                    audio: false,
                };
            } else {
                constraints = {
                    video: {
                        facingMode: isMobileOrTablet()
                            ? "environment"
                            : "user",
                    },
                    audio: false,
                };
            }

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    constraints
                );

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err) {
            console.error(err);
            setError(
                "Unable to start camera. Please check camera permissions."
            );
        }
    };

    const selectPreferredCamera = (cameraList) => {
        if (!cameraList.length) {
            startCamera(0, []);
            return;
        }

        const mobile = isMobileOrTablet();

        let preferredIndex = -1;

        cameraList.forEach((camera, index) => {
            const label = camera.label.toLowerCase();

            if (mobile) {
                if (
                    label.includes("back") ||
                    label.includes("rear") ||
                    label.includes("environment")
                ) {
                    preferredIndex = index;
                }
            } else {
                if (
                    label.includes("front") ||
                    label.includes("integrated") ||
                    label.includes("user") ||
                    label.includes("webcam")
                ) {
                    preferredIndex = index;
                }
            }
        });

        if (preferredIndex === -1) {
            preferredIndex = 0;
        }

        setCurrentCamera(preferredIndex);
        startCamera(preferredIndex, cameraList);
    };

    const openCamera = async () => {
        setIsOpen(true);
        setCapturedImage(null);
        setError("");

        setTimeout(async () => {
            const cameraList = await getCameras();
            selectPreferredCamera(cameraList);
        }, 100);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
            setError("Camera is not ready.");
            return;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        const imageData = canvas.toDataURL(
            "image/jpeg",
            0.9
        );

        setCapturedImage(imageData);
        stopCamera();
    };

    const dataURLToFile = (dataURL, filename) => {
        const arr = dataURL.split(",");
        const mime =
            arr[0].match(/:(.*?);/)[1];

        const bstr = atob(arr[1]);
        let n = bstr.length;

        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File(
            [u8arr],
            filename,
            { type: mime }
        );
    };

    const usePhoto = () => {
        if (!capturedImage) return;

        const file = dataURLToFile(
            capturedImage,
            `product-${Date.now()}.jpg`
        );

        onCapture(file, capturedImage);

        closeCamera();
    };

    const retakePhoto = () => {
        setCapturedImage(null);

        setTimeout(() => {
            startCamera(
                currentCamera,
                cameras
            );
        }, 100);
    };

    const switchCamera = () => {
        if (cameras.length <= 1) return;

        const nextCamera =
            (currentCamera + 1) % cameras.length;

        setCurrentCamera(nextCamera);

        startCamera(
            nextCamera,
            cameras
        );
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
                className="
                    flex items-center gap-2
                    px-4 py-2
                    bg-slate-800
                    text-white
                    rounded-lg
                    text-sm
                    font-medium
                    hover:bg-slate-700
                    transition
                "
            >
                <Camera size={16} />
                Camera
            </button>

            {isOpen && (
                <div
                    className="
                        fixed inset-0 z-[9999]
                        bg-black/70
                        flex items-center justify-center
                        p-4
                    "
                >
                    <div
                        className="
                            w-full max-w-lg
                            bg-white rounded-2xl
                            overflow-hidden shadow-2xl
                        "
                    >
                        <div
                            className="
                                flex items-center
                                justify-between
                                px-5 py-4 border-b
                            "
                        >
                            <h2 className="text-lg font-semibold">
                                Take Product Photo
                            </h2>

                            <button
                                type="button"
                                onClick={closeCamera}
                                className="
                                    p-2 rounded-full
                                    hover:bg-slate-100
                                "
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className="
                                relative bg-black
                                aspect-video
                            "
                        >
                            {capturedImage ? (
                                <img
                                    src={capturedImage}
                                    alt="Captured"
                                    className="
                                        w-full h-full
                                        object-contain
                                    "
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="
                                        w-full h-full
                                        object-cover
                                    "
                                />
                            )}

                            {error && (
                                <div
                                    className="
                                        absolute inset-0
                                        flex items-center
                                        justify-center p-6
                                    "
                                >
                                    <p className="text-white text-center">
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-5">
                            {!capturedImage ? (
                                <div
                                    className="
                                        flex items-center
                                        justify-center gap-5
                                    "
                                >
                                    {cameras.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={switchCamera}
                                            className="
                                                flex items-center
                                                gap-2 px-4 py-2
                                                rounded-lg
                                                bg-slate-100
                                                text-slate-700
                                            "
                                        >
                                            <RotateCcw size={18} />
                                            Switch
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={capturePhoto}
                                        className="
                                            w-16 h-16
                                            rounded-full
                                            border-4
                                            border-slate-300
                                            bg-white shadow-lg
                                            hover:scale-105
                                            transition
                                        "
                                    />
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={retakePhoto}
                                        className="
                                            flex-1
                                            flex items-center
                                            justify-center gap-2
                                            px-4 py-3
                                            rounded-lg
                                            bg-slate-100
                                            text-slate-700
                                            font-medium
                                        "
                                    >
                                        <RotateCcw size={18} />
                                        Retake
                                    </button>

                                    <button
                                        type="button"
                                        onClick={usePhoto}
                                        className="
                                            flex-1
                                            px-4 py-3
                                            rounded-lg
                                            bg-slate-800
                                            text-white
                                            font-medium
                                        "
                                    >
                                        Use Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <canvas
                ref={canvasRef}
                className="hidden"
            />
        </>
    );
};

export default CameraCapture;