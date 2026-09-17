import React from "react";
import kadaLogo from "../assets/kada.png";

/**
 * High-performance, GPU-accelerated Loading component using the KADA logo.
 * Eliminates lag by using CSS transform/opacity properties only.
 */
const Loading = ({
  text = "Loading...",
  fullScreen = false,
  size = "md", // "sm", "md", "lg"
  className = "",
}) => {
  const sizeMap = {
    sm: {
      container: "w-12 h-12",
      img: "w-8 h-8",
      ring: "w-12 h-12 border-2",
      text: "text-xs",
    },
    md: {
      container: "w-20 h-20",
      img: "w-12 h-12",
      ring: "w-20 h-20 border-[3px]",
      text: "text-sm",
    },
    lg: {
      container: "w-28 h-28",
      img: "w-16 h-16",
      ring: "w-28 h-28 border-4",
      text: "text-base",
    },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Subtle glowing animated pulse wave */}
        <div
          className={`absolute rounded-full bg-emerald-500/15 animate-kada-wave ${selectedSize.container}`}
        />

        {/* Rotating modern accent ring */}
        <div
          className={`absolute rounded-full border-transparent border-t-emerald-500 border-r-emerald-400 animate-kada-ring ${selectedSize.ring}`}
        />

        {/* KADA Logo with subtle smooth pulsing */}
        <div className={`relative flex items-center justify-center p-2 rounded-2xl bg-white shadow-sm border border-slate-100 ${selectedSize.container}`}>
          <img
            src={kadaLogo}
            alt="KADA"
            className={`object-contain animate-kada-pulse ${selectedSize.img}`}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {text && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className={`font-semibold text-slate-700 tracking-wide ${selectedSize.text}`}>
            {text}
          </p>
          <span className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
          </span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white/95 rounded-3xl p-8 shadow-2xl border border-white/50 flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default Loading;
