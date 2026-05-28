/**
 * EarthGlobe — Helios-Watch Frontend (features/solar)
 *
 * 3D interactive Earth globe showing ionosphere state in real-time.
 * Moved from: components/EarthGlobe.tsx
 */

import React, { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useStore } from "../../store/useStore";

export const EarthGlobe: React.FC = () => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const isDanger = useStore((state) => state.currentFlux >= 1e-5);
  const [dimensions, setDimensions] = useState({ w: 300, h: 300 });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth < 1024 ? window.innerWidth - 64 : 550;
      setDimensions({ w: width, h: width });
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.8;
      globeEl.current.pointOfView({ altitude: 2.5 });
    }
  }, []);

  return (
    <div className={`transition-all duration-1000 ${isDanger ? "drop-shadow-[0_0_50px_rgba(255,0,0,0.6)]" : ""}`}>
      <Globe
        ref={globeEl}
        width={dimensions.w}
        height={dimensions.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl={null}
        atmosphereColor={isDanger ? "#ff0000" : "#3a228a"}
        atmosphereAltitude={isDanger ? 0.3 : 0.15}
        backgroundColor="rgba(0,0,0,0)"
        arcsData={React.useMemo(
          () =>
            isDanger
              ? Array.from({ length: 12 }).map(() => ({
                  startLat: (Math.random() - 0.5) * 180,
                  startLng: (Math.random() - 0.5) * 360,
                  endLat: (Math.random() - 0.5) * 180,
                  endLng: (Math.random() - 0.5) * 360,
                  color: ["red", "rgba(255,0,0,0.2)"],
                }))
              : [],
          [isDanger]
        )}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
        ringsData={React.useMemo(
          () => [
            { lat: 90, lng: 0, maxR: 10, propagationSpeed: 5, repeatPeriod: 1000 },
            { lat: -90, lng: 0, maxR: 10, propagationSpeed: 5, repeatPeriod: 1000 },
          ],
          []
        )}
        ringColor={() => (isDanger ? "#ff0000" : "#4dabf5")}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />

      {isDanger && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-red-500 font-bold text-2xl animate-pulse tracking-widest bg-black/60 px-4 py-2 rounded-lg border border-red-500">
            IONOSPHERE<br />UNSTABLE
          </div>
        </div>
      )}
    </div>
  );
};
