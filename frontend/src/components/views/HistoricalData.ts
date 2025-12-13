export interface HistoricalEventProfile {
    id: string;
    title: string;
    date: string;
    description: string;
    stats: {
        flux: string;
        wind: string;
        kp: string;
    };
    // Reconstructed Time Series Data (Approximate)
    data: {
        time: string;
        flux: number;
        wind: number;
        kp: number;
        proton: number;
    }[];
}

const generateProfile = (
    baseFlux: number, peakFlux: number,
    baseWind: number, peakWind: number,
    baseKp: number, peakKp: number,
    durationPoints: number = 60
) => {
    const data = [];
    const peakIndex = Math.floor(durationPoints / 2);

    for (let i = 0; i < durationPoints; i++) {
        // Gaussian Curve for Flux
        const x = (i - peakIndex) / (durationPoints / 6);
        const bellCurve = Math.exp(-0.5 * x * x);

        // Random Noise
        const noise = 1 + (Math.random() * 0.1 - 0.05);

        data.push({
            time: `T+${i}h`,
            flux: baseFlux + (peakFlux - baseFlux) * bellCurve * noise,
            wind: baseWind + (peakWind - baseWind) * bellCurve * noise,
            kp: Math.min(9, baseKp + (peakKp - baseKp) * bellCurve), // Cap at 9
            proton: Math.max(10, peakFlux * 1000 * bellCurve * noise) // Rough correlation
        });
    }
    return data;
};

// 1. Carrington Event (1859) - The Monster
// Flux: Est X45 (4.5e-3)
// Wind: ~2400 km/s
const CARRINGTON_DATA = generateProfile(1e-6, 4.5e-3, 400, 2400, 2, 9);

// 2. Quebec Blackout (1989)
// Flux: X15 (1.5e-3)
// Wind: 985 km/s
const QUEBEC_DATA = generateProfile(1e-6, 1.5e-3, 400, 985, 3, 9);

// 3. Bastille Day (2000)
// Flux: X5.7 (5.7e-4)
// Wind: ~1100 km/s
const BASTILLE_DATA = generateProfile(1e-6, 5.7e-4, 450, 1100, 4, 9);

// 4. Halloween Storms (2003)
// Flux: X28 (2.8e-3)
// Wind: ~2000 km/s
const HALLOWEEN_DATA = generateProfile(2e-6, 2.8e-3, 500, 2000, 4, 9);

// 5. May 2024 (Modern G5)
// Flux: X8.7 (8.7e-4) -> X5.8
// Wind: ~950 km/s
const MAY2024_DATA = generateProfile(5e-7, 8.7e-4, 350, 950, 2, 9);


export const REAL_HISTORICAL_EVENTS: HistoricalEventProfile[] = [
    {
        id: 'carrington',
        title: 'The Carrington Event',
        date: 'Sept 1-2, 1859',
        description: 'The most intense geomagnetic storm in recorded history. Telegraph systems failed across Europe and North America, shockingly sparking fires. Auroras were visible as far south as the Caribbean.',
        stats: { flux: 'X45 (Est)', wind: '2400 km/s', kp: '9.0' },
        data: CARRINGTON_DATA
    },
    {
        id: 'halloween',
        title: 'Halloween Storms of 2003',
        date: 'Oct-Nov 2003',
        description: 'A series of massive solar flares and CMEs that caused satellite failures, power outages in Sweden, and forced ISS astronauts to take shelter. Featured an X28+ flare, one of the strongest ever measured.',
        stats: { flux: 'X28+', wind: '2000+ km/s', kp: '9.0' },
        data: HALLOWEEN_DATA
    },
    {
        id: 'quebec',
        title: 'Quebec Blackout',
        date: 'March 13, 1989',
        description: 'A powerful X15 precursor flare followed by a CME collapsed the Hydro-Québec power grid in seconds, leaving 6 million people without electricity for 9 hours. Proved the vulnerability of modern grids.',
        stats: { flux: 'X15', wind: '985 km/s', kp: '9.0' },
        data: QUEBEC_DATA
    },
    {
        id: 'may2024',
        title: 'G5 Storm of May 2024',
        date: 'May 10-13, 2024',
        description: 'The strongest geomagnetic storm in 20 years. Triggered by a massive sunspot cluster AR3664 (15x Earth diameter). Produced stunning auroras globally and disrupted GPS/Starlink satellites.',
        stats: { flux: 'X8.7', wind: '950 km/s', kp: '9.0' },
        data: MAY2024_DATA
    },
    {
        id: 'bastille',
        title: 'Bastille Day Event',
        date: 'July 14, 2000',
        description: 'A major X5.7 solar flare on the French National Day. Caused an S3 radiation storm and short-circuiting in some satellites. A classic example of a "textbook" major solar storm.',
        stats: { flux: 'X5.7', wind: '1100 km/s', kp: '9.0' },
        data: BASTILLE_DATA
    }
];
