import { create } from 'zustand';

// 1. Define the Data Shape (Matches Python schemas.py)
export interface SolarPoint {
    timestamp: string;
    flux: number;
    class_type: string;
    source: 'noaa' | 'simulation';
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
    user: User | null;

    // Actions
    addDataPoint: (point: SolarPoint) => void;
    setSystemStatus: (status: 'ONLINE' | 'OFFLINE' | 'CONNECTING') => void;
    setHistory: (points: SolarPoint[]) => void;
    setUser: (user: User | null) => void;
}

// 2. Create the Store
export const useStore = create<SystemState>((set) => ({
    dataPoints: [],
    realHistory: [],
    currentFlux: 0,
    systemStatus: 'OFFLINE',
    simulationActive: false,
    user: null,

    setUser: (user) => set({ user }),

    setHistory: (points) => set({
        realHistory: points,
        dataPoints: points,
        currentFlux: points.length > 0 ? points[points.length - 1].flux : 0
    }),

    addDataPoint: (point) => set((state) => {
        const isSim = point.source === 'simulation';

        // 1. Update Real History (Background)
        let newRealHistory = state.realHistory;
        if (!isSim) {
            newRealHistory = [...state.realHistory, point].slice(-360); // Keep 6 hours
        }

        // 2. Update Display Data
        let newDataPoints = state.dataPoints;

        if (isSim) {
            // In Simulation: Just add to display
            newDataPoints = [...state.dataPoints, point].slice(-360);
            return {
                dataPoints: newDataPoints,
                currentFlux: point.flux,
                realHistory: newRealHistory,
                simulationActive: true
            };
        } else {
            // In Real Mode:
            // If we were simulating, SNAP BACK to real history
            if (state.simulationActive) {
                return {
                    dataPoints: newRealHistory, // Restore clean history
                    currentFlux: point.flux,
                    realHistory: newRealHistory,
                    simulationActive: false
                };
            } else {
                // Normal update
                return {
                    dataPoints: newRealHistory,
                    currentFlux: point.flux,
                    realHistory: newRealHistory,
                    simulationActive: false
                };
            }
        }
    }),

    setSystemStatus: (status) => set({ systemStatus: status })
}));