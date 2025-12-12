import { create } from 'zustand';

// 1. Define the Data Shape (Matches Python schemas.py)
export interface SolarPoint {
    timestamp: string;
    flux: number;
    class_type: string;
    source: 'noaa' | 'simulation';
}

export interface SpaceWeather {
    windSpeed: number;
    temp: number;
    density: number;
    kpIndex: number;
    protonFlux: number;
}

export interface ActiveRegion {
    region_number: number;
    latitude: number;
    longitude: number;
    class_type: string;
}

export interface CalculusData {
    slope: number;       // Rate of Change (W/m²/min)
    is_warning: boolean; // Early Warning Trigger
    threshold: number;
    status: string;      // Hybrid Status (e.g., RAPID_INTENSIFICATION)
    details: string;     // Context
    engine_type: string; // "HYBRID"
}

export interface User {
    id: number;
    email: string;
}

export interface SystemState {
    dataPoints: SolarPoint[];
    currentFlux: number;
    systemStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
    realHistory: SolarPoint[];
    simulationActive: boolean;
    spaceWeather: SpaceWeather;
    activeRegions: ActiveRegion[]; // New State
    calculus: CalculusData;        // New State
    user: User | null;

    // Simulation State (Visual Only, does not affect Data/Graphs)
    visualSimulation: {
        active: boolean;
        level: 'NONE' | 'M' | 'X';
    };
    setVisualSimulation: (active: boolean, level?: 'NONE' | 'M' | 'X') => void;

    // Actions
    addDataPoint: (point: SolarPoint) => void;
    setSystemStatus: (status: 'ONLINE' | 'OFFLINE' | 'CONNECTING') => void;
    setHistory: (points: SolarPoint[]) => void;
    setSpaceWeather: (data: SpaceWeather) => void;
    setRegions: (regions: ActiveRegion[]) => void;
    setCalculus: (data: CalculusData) => void;
    setUser: (user: User | null) => void;
}

// 2. Create the Store
export const useStore = create<SystemState>((set) => ({
    dataPoints: [],
    realHistory: [],
    currentFlux: 0,
    systemStatus: 'CONNECTING',
    simulationActive: false, // Legacy fallback
    spaceWeather: {
        windSpeed: 0,
        density: 0,
        temp: 0,
        kpIndex: 0,
        protonFlux: 0
    },
    activeRegions: [],
    calculus: { slope: 0, is_warning: false, threshold: 1e-7, status: 'STABLE', details: 'System Normal', engine_type: 'Loading...' },
    visualSimulation: { active: false, level: 'NONE' },
    user: null,
    
    setUser: (user) => set({ user }),
    setVisualSimulation: () => { }, // No-op for now as we reverted sim features

    setHistory: (points) => set({
        realHistory: points,
        // Initialize graph with this history (or a subset)
        dataPoints: points.slice(-360), // Show last 6 hours (360 mins)
        currentFlux: points.length > 0 ? points[points.length - 1].flux : 0
    }),

    addDataPoint: (point) => set((state) => {
        const isSim = point.source === 'simulation';

        // 1. Simulation Data: Update Graph & Flux ONLY (Visuals)
        // deliberately EXCLUDE from realHistory to keep live data pure.
        if (isSim) {
            const newDataPoints = [...state.dataPoints, point].slice(-360);
            return {
                dataPoints: newDataPoints,
                currentFlux: point.flux,
                simulationActive: true
            };
        }

        // 2. Real Data: Update History & Display
        const newRealHistory = [...state.realHistory, point].slice(-360); // Keep 6 hours

        // SAFETY: When real data arrives, we strictly reset the view to the Real History.
        // This ensures that any previous simulation data is immediately wiped from the graph,
        // fulfilling the requirement to "not affect live data after simulation".
        const newDataPoints = newRealHistory;

        return {
            dataPoints: newDataPoints,
            realHistory: newRealHistory,
            currentFlux: point.flux,
            simulationActive: false, // Turn off sim mode when real data arrives
            // Ensure system marks as connected if we get data
            systemStatus: 'ONLINE'
        };
    }),

    setSystemStatus: (status) => set({ systemStatus: status }),
    setSpaceWeather: (data) => set({ spaceWeather: data }),
    setRegions: (regions) => set({ activeRegions: regions }),
    setCalculus: (data) => set({ calculus: data })
}));