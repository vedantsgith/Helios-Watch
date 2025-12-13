import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { useStore } from '../store/useStore';

export const EarthGlobe: React.FC = () => {
    const globeEl = useRef<any>(null);

    // OPTIMIZATION: Only re-render when 'isDanger' status changes (boolean), 
    // instead of every flux update (number). Prevents ~60 useless re-renders/sec per simulation.
    // OPTIMIZATION: Only re-render when 'isDanger' status changes.
    // Triggers if Flux is M-Class+ (>1e-5) OR if a Visual Simulation is active.
    const visSim = useStore((state) => state.visualSimulation);
    const isDanger = useStore((state) => state.currentFlux >= 1e-5 || state.visualSimulation.active);

    // Determine Color based on Simulation Type
    const getDangerColor = () => {
        if (!isDanger) return '#3a228a'; // Default Blue
        if (visSim.active) {
            switch (visSim.type) {
                case 'wind': return '#a855f7'; // Purple (Wind/Kp)
                case 'kp': return '#a855f7';   // Purple
                case 'proton': return '#eab308'; // Yellow/Orange
                case 'flux': return '#ef4444'; // Red
                default: return '#ef4444'; // Default Red
            }
        }
        return '#ef4444'; // Default Red for real events
    };

    const dangerColor = getDangerColor();

    // Responsive sizing state
    const [dimensions, setDimensions] = useState({ w: 300, h: 300 });

    useEffect(() => {
        // Responsive handler
        const updateSize = () => {
            const width = window.innerWidth < 1024 ? window.innerWidth - 64 : 550;
            setDimensions({ w: width, h: width }); // Square aspect ratio
        };

        window.addEventListener('resize', updateSize);
        updateSize(); // Initial call

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        // Auto-rotate the globe
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.8;
            globeEl.current.pointOfView({ altitude: 2.5 }); // Set camera distance
            globeEl.current.controls().enableZoom = false; // Fix: Disable zoom
        }
    }, []);

    return (
        <div className={`transition-all duration-1000 ${isDanger ? 'drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]' : ''}`}>
            <Globe
                ref={globeEl}
                width={dimensions.w}
                height={dimensions.h}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl={null} // Transparent to let page background show
                atmosphereColor={dangerColor}
                atmosphereAltitude={isDanger ? 0.3 : 0.15}
                backgroundColor="rgba(0,0,0,0)"

                // Immersive Extras
                // OPTIMIZATION: Memoize data arrays to prevent deep prop comparison checks
                arcsData={React.useMemo(() => isDanger ? Array.from({ length: 12 }).map(() => ({
                    startLat: (Math.random() - 0.5) * 180,
                    startLng: (Math.random() - 0.5) * 360,
                    endLat: (Math.random() - 0.5) * 180,
                    endLng: (Math.random() - 0.5) * 360,
                    color: [dangerColor, 'rgba(255,255,255,0.2)']
                })) : [], [isDanger, dangerColor])}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1500}
                arcStroke={0.5}

                ringsData={React.useMemo(() => [
                    { lat: 90, lng: 0, maxR: 10, propagationSpeed: 5, repeatPeriod: 1000 },
                    { lat: -90, lng: 0, maxR: 10, propagationSpeed: 5, repeatPeriod: 1000 }
                ], [])}
                ringColor={() => dangerColor}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
            />

            {/* Visual Overlay Warning */}
            {isDanger && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="font-bold text-2xl animate-pulse tracking-widest bg-black/60 px-4 py-2 rounded-lg border" style={{ color: dangerColor, borderColor: dangerColor }}>
                        {visSim.type === 'wind' || visSim.type === 'kp' ? 'GEOMAGNETIC STORM' :
                            visSim.type === 'proton' ? 'RADIATION STORM' :
                                'IONOSPHERE UNSTABLE'}
                        <br />
                        {visSim.type === 'wind' || visSim.type === 'kp' ? 'G4 EXTREME' :
                            visSim.type === 'proton' ? 'S3 STRONG' :
                                'CRITICAL'}
                    </div>
                </div>
            )}
        </div>
    );
};