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

export interface HistoryPoint {
    timestamp: string;
    value: number;
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

    // Multi-Metric History (Accumulated on Frontend)
    windHistory: { timestamp: string; value: number }[];
    kpHistory: { timestamp: string; value: number }[];
    protonHistory: HistoryPoint[];

    // Real History (Backup to restore after simulation)
    realWindHistory: { timestamp: string; value: number }[];
    realKpHistory: { timestamp: string; value: number }[];
    realProtonHistory: HistoryPoint[];

    activeGraphTab: 'flux' | 'wind' | 'kp' | 'proton'; // Remote Control for Graph

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
    setSpaceWeather: (data: SpaceWeather, isSimulation?: boolean) => void;
    setRegions: (regions: ActiveRegion[]) => void;
    setCalculus: (data: CalculusData) => void;
    setTelemetryHistory: (history: { wind: any[], kp: any[], proton: any[] }) => void;
    setActiveGraphTab: (tab: 'flux' | 'wind' | 'kp' | 'proton') => void;
    revertToRealData: () => void;
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
    windHistory: [],
    kpHistory: [],
    protonHistory: [],
    realWindHistory: [],
    realKpHistory: [],
    realProtonHistory: [],
    activeGraphTab: 'flux', // Default Tab
    visualSimulation: { active: false, level: 'NONE' },
    user: null,

    setUser: (user) => set({ user }),
    setVisualSimulation: () => { }, // No-op for now as we reverted sim features

    setHistory: (points) => set({
        realHistory: points,
        // Initialize graph with this history (or a subset)
        dataPoints: points.slice(-4500), // Show last 3 days (4500 mins)
        currentFlux: points.length > 0 ? points[points.length - 1].flux : 0
    }),

    addDataPoint: (point) => set((state) => {
        const isSim = point.source === 'simulation';

        // 1. Simulation Data: Update Graph & Flux ONLY (Visuals)
        // deliberately EXCLUDE from realHistory to keep live data pure.
        if (isSim) {
            const newDataPoints = [...state.dataPoints, point].slice(-4500);
            return {
                dataPoints: newDataPoints,
                currentFlux: point.flux,
                simulationActive: true
            };
        }

        // 2. Real Data: Update History & Display
        const newRealHistory = [...state.realHistory, point].slice(-4500); // Keep 3 days

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
    setSpaceWeather: (data, isSimulation = false) => set((state) => {
        const now = new Date().toISOString();

        // Map Backend (snake_case) OR Frontend (camelCase) to Store State
        const incoming = data as any;
        const mappedData: SpaceWeather = {
            windSpeed: incoming.windSpeed ?? incoming.wind_speed ?? state.spaceWeather.windSpeed,
            temp: incoming.temp ?? state.spaceWeather.temp,
            density: incoming.density ?? state.spaceWeather.density,
            kpIndex: incoming.kpIndex ?? incoming.kp_index ?? state.spaceWeather.kpIndex,
            protonFlux: incoming.protonFlux ?? incoming.proton_flux ?? state.spaceWeather.protonFlux
        };

        const newWindPoint = { timestamp: now, value: mappedData.windSpeed };
        const newKpPoint = { timestamp: now, value: mappedData.kpIndex };
        const newProtonPoint = { timestamp: now, value: mappedData.protonFlux };

        if (!isSimulation) {
            // REAL DATA: Update Real + Display
            const nextRealWind = [...state.realWindHistory, newWindPoint].slice(-1440);
            const nextRealKp = [...state.realKpHistory, newKpPoint].slice(-1440);
            const nextRealProton = [...state.realProtonHistory, newProtonPoint].slice(-1440);

            return {
                spaceWeather: mappedData,
                realWindHistory: nextRealWind,
                realKpHistory: nextRealKp,
                realProtonHistory: nextRealProton,
                // On Real Data, we force Reset Display to Real (clears any old sim data)
                windHistory: nextRealWind,
                kpHistory: nextRealKp,
                protonHistory: nextRealProton
            };
        } else {
            // SIMULATION: Update Display ONLY
            return {
                spaceWeather: mappedData, // Update current values for dashboard
                windHistory: [...state.windHistory, newWindPoint].slice(-1440),
                kpHistory: [...state.kpHistory, newKpPoint].slice(-1440),
                protonHistory: [...state.protonHistory, newProtonPoint].slice(-1440)
            };
        }
    }),

    revertToRealData: () => set((state) => ({
        windHistory: state.realWindHistory,
        kpHistory: state.realKpHistory,
        protonHistory: state.realProtonHistory
    })),

    // Set Initial Telemetry History
    // Set Initial Telemetry History
    setTelemetryHistory: (history: { wind: any[], kp: any[], proton: any[] }) => set({
        windHistory: history.wind,
        kpHistory: history.kp,
        protonHistory: history.proton,
        realWindHistory: history.wind,
        realKpHistory: history.kp,
        realProtonHistory: history.proton
    }),

    setRegions: (regions) => set({ activeRegions: regions }),
    setCalculus: (data) => set({ calculus: data }),
    setActiveGraphTab: (tab) => set({ activeGraphTab: tab })
}));