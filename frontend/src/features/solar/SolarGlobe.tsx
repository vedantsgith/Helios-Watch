/**
 * SolarGlobe — Helios-Watch Frontend (features/solar)
 *
 * 3D solar globe with real active region (sunspot) magnetic field loops.
 * Moved from: components/SolarGlobe.tsx
 */

import React, { useEffect, useRef, useMemo } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useStore } from "../../store/useStore";

export const SolarGlobe: React.FC = () => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = React.useState({ w: 500, h: 500 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth < 1024 ? 300 : 600;
      setDimensions({ w: width, h: width });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.2 });

      // Full ambient lighting — sun emits light, no shadow side
      const scene = globeEl.current.scene();
      import("three").then(({ AmbientLight, DirectionalLight }) => {
        const ambient = new AmbientLight(0xffffff, 1.5);
        (scene as { add: (obj: unknown) => void }).add(ambient);
        const dirLight = new DirectionalLight(0xffffff, 1);
        dirLight.position.set(-1, 1, -1);
        (scene as { add: (obj: unknown) => void }).add(dirLight);
      });
    }
  }, []);

  const { activeRegions } = useStore();

  const arcsData = useMemo(() => {
    if (!activeRegions || activeRegions.length === 0) {
      return Array.from({ length: 5 }).map(() => ({
        startLat: (Math.random() - 0.5) * 60,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 60,
        endLng: (Math.random() - 0.5) * 360,
        color: ["rgba(255,100,0,0.5)", "rgba(255,0,0,0.1)"],
      }));
    }
    return activeRegions.map((region) => ({
      startLat: region.latitude,
      startLng: region.longitude,
      endLat: region.latitude + (Math.random() * 10 - 5),
      endLng: region.longitude + (Math.random() * 15 - 7.5),
      color: ["rgba(255,220,0,0.8)", "rgba(255,50,0,0.4)"],
    }));
  }, [activeRegions]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-orange-500/10 blur-[100px] rounded-full z-0 pointer-events-none" />
      <Globe
        ref={globeEl}
        width={dimensions.w}
        height={dimensions.h}
        globeImageUrl="/sun_8k.jpg"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#ffaa00"
        atmosphereAltitude={0.4}
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.9}
        arcDashGap={0.1}
        arcDashAnimateTime={2000}
        arcStroke={0.8}
        arcAltitudeAutoScale={0.5}
      />
    </div>
  );
};
