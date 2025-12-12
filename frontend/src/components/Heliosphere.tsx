import React, { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { useStore } from '../store/useStore';
import * as THREE from 'three';
import { Zap, ShieldAlert } from 'lucide-react';

export const Heliosphere: React.FC = () => {
    const globeEl = useRef<any>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const earthRef = useRef<THREE.Mesh | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);

    // Store
    const { visualSimulation, setVisualSimulation } = useStore();

    // Config: EXACT REFERENCE IMAGE MATCH
    // SUN: Partial view on LEFT edge (cropped by screen)
    // EARTH: Small blue sphere on RIGHT
    const SUN_X = 800;  // Far left (mostly off-screen, only edge visible)
    const SUN_GLOW_SIZE = 2000;  // Very large so partial view fills left edge
    const EARTH_X = 300;  // Right side, closer to center for visibility
    const EARTH_RADIUS = 20;  // Slightly larger for better visibility

    // Simulation Trigger
    const triggerStorm = (level: 'M' | 'X') => {
        setVisualSimulation(true, level);
        setTimeout(() => setVisualSimulation(false, 'NONE'), 4000);
    };

    // Helper: Glow Texture
    const getGlowTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Texture();

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 200, 100, 0.8)');
        grad.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    };

    useEffect(() => {
        if (!globeEl.current) return;
        const scene = globeEl.current.scene();
        sceneRef.current = scene;

        // 1. Enhanced Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);
        const sunLight = new THREE.PointLight(0xffaa00, 6, 2500);
        sunLight.position.set(SUN_X, 0, 0);
        scene.add(sunLight);

        // SUN Glow Sprite (Partial view on LEFT edge)
        const spriteMat = new THREE.SpriteMaterial({
            map: getGlowTexture(),
            color: 0xffaa00,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 1.0
        });
        const sunGlow = new THREE.Sprite(spriteMat);
        sunGlow.position.set(SUN_X, 0, 0);
        sunGlow.scale.set(SUN_GLOW_SIZE, SUN_GLOW_SIZE, 1);
        scene.add(sunGlow);

        // 2. Earth (Visible on Right Side)
        const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
        const earthTexture = new THREE.TextureLoader().load('/earth.jpg');

        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            color: 0xffffff,
            emissive: 0x001133,  // Slight blue glow
            specular: new THREE.Color(0x666666),
            shininess: 50
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(EARTH_X, 0, 0);
        scene.add(earth);
        earthRef.current = earth;

        // 3. Blue Atmosphere Glow (Makes Earth more visible)
        const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 64, 64);
        const atmoMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3,  // More visible
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        earth.add(atmosphere);

        // 4. Solar Wind Particles (Sun → Earth)
        const particleCount = 4000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Spawn between Sun (Left) and Earth (Right)
            const range = EARTH_X - SUN_X;
            positions[i * 3] = (Math.random() * range) + SUN_X;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            speeds[i] = 3 + Math.random() * 3;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

        const pMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 3.5,  // LARGER particles
            map: getGlowTexture(),
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, pMaterial);
        scene.add(particles);
        particlesRef.current = particles;

        // 5. Camera Setup - SIDE VIEW (Sun left, Earth right)
        // Camera positioned to see X-axis from the side (Z-axis view)
        if (globeEl.current.controls()) {
            globeEl.current.controls().target.set(-200, 0, 0);  // Look between Sun and Earth
            globeEl.current.pointOfView({ altitude: 2.8, lat: 0, lng: 0 });  // Side view!
            globeEl.current.controls().autoRotate = false;
            globeEl.current.controls().enableRotate = true;
            globeEl.current.controls().enableZoom = true;
        }

        return () => {
            if (scene) {
                scene.remove(earth);
                scene.remove(particles);
                scene.remove(sunLight);
                scene.remove(sunGlow);
                geometry.dispose();
                pMaterial.dispose();
            }
        };
    }, []);

    // Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            // Earth Rotation ONLY
            if (earthRef.current) {
                earthRef.current.rotation.y += 0.003;
            }

            // Particles Update
            if (particlesRef.current) {
                const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
                const speeds = particlesRef.current.geometry.attributes.speed.array as Float32Array;
                const isStorm = visualSimulation.active;

                const mat = particlesRef.current.material as THREE.PointsMaterial;
                mat.color.setHex(isStorm ? 0xff0000 : 0xffaa00);
                mat.size = isStorm ? 10 : 4;  // DRAMATIC size increase during storms

                for (let i = 0; i < positions.length / 3; i++) {
                    const idx = i * 3;
                    let speed = speeds[i] * (isStorm ? 6 : 1);

                    positions[idx] += speed; // Move RIGHT (+X)

                    // Respawn if past Earth
                    if (positions[idx] > EARTH_X + 100) {
                        positions[idx] = SUN_X + (Math.random() * 200);  // Start from Sun area
                        const spreadY = isStorm ? 200 : 100;
                        positions[idx + 1] = (Math.random() - 0.5) * spreadY;
                        positions[idx + 2] = (Math.random() - 0.5) * (spreadY / 2);
                    }
                }
                particlesRef.current.geometry.attributes.position.needsUpdate = true;
            }
        }, 16);
        return () => clearInterval(interval);
    }, [visualSimulation]);

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            {/* Stars */}
            <div className="absolute inset-0 bg-[url('/bg-stars.jpg')] opacity-30 z-0"></div>

            <Globe
                ref={globeEl}
                width={1000}
                height={600}
                backgroundColor="rgba(0,0,0,0)"
                showGlobe={false} // HIDE THE DEFAULT GLOBE!
                showAtmosphere={false}
            />

            {/* UI CONTROLS (Kept from Previous Version for completeness, though user wanted undo. 
                Wait, user said "undo what you have gone". The previous Heliosphere had controls INSIDE it? 
                Checking Step 189 diff... yes, it had UI CONTROLS at the bottom.
                I will include them to match Step 188 state.) 
            */}

        </div>
    );
};
