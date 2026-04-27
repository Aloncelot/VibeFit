'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Longitud de cada segmento del túnel
const SEGMENT_LENGTH = 100;

function TunnelSegment({ positionZ, meshRef }: { positionZ: number, meshRef: React.RefObject<THREE.Mesh> }) {
    // Geometría perfectamente recta (sin vaivén)
    // Radio 10 (más estrecho para mayor sensación de velocidad)
    // Longitud SEGMENT_LENGTH
    const tunnelGeometry = useMemo(() => {
        return new THREE.CylinderGeometry(20, 20, SEGMENT_LENGTH, 32, 40, true);
    }, []);

    return (
        <mesh
            ref={meshRef}
            geometry={tunnelGeometry}
            rotation={[Math.PI / 2, 0, 0]} // Acostado sobre el eje Z
            position={[0, 0, positionZ]}
        >
            <meshBasicMaterial
                color="#FFD700" // Oro VIBEFIT
                wireframe
                transparent
                opacity={0.15}
                side={THREE.BackSide} // Renderizar solo el interior
                toneMapped={false} // Mantener brillo neón
            />
        </mesh>
    );
}

function InfiniteTunnel() {
    const seg1 = useRef<THREE.Mesh>(null);
    const seg2 = useRef<THREE.Mesh>(null);

    // Velocidad constante hacia la cámara
    const speed = 0.1;

    useFrame(() => {
        if (!seg1.current || !seg2.current) return;

        // 1. Mover ambos segmentos hacia la cámara (eje +Z)
        seg1.current.position.z += speed;
        seg2.current.position.z += speed;

        // 2. Lógica de teletransporte (Cinta transportadora)

        // Si el segmento 1 ya pasó detrás de la cámara (Camera pos.z = 0)
        if (seg1.current.position.z > SEGMENT_LENGTH / 2) {
            // Lo movemos al fondo, justo detrás del segmento 2
            seg1.current.position.z = seg2.current.position.z - SEGMENT_LENGTH;
        }

        // Si el segmento 2 ya pasó detrás de la cámara
        if (seg2.current.position.z > SEGMENT_LENGTH / 2) {
            // Lo movemos al fondo, justo detrás del segmento 1
            seg2.current.position.z = seg1.current.position.z - SEGMENT_LENGTH;
        }

        // Opcional: Una rotación muy lenta sobre el eje Z solo para dar dinamismo a las líneas
        seg1.current.rotation.y += 0.001;
        seg2.current.rotation.y += 0.001;
    });

    return (
        <group>
            {/* Segmento 1 empieza en el origen */}
            <TunnelSegment positionZ={0} meshRef={seg1} />
            {/* Segmento 2 empieza inmediatamente detrás (hacia el fondo -Z) */}
            <TunnelSegment positionZ={-SEGMENT_LENGTH} meshRef={seg2} />
        </group>
    );
}

function FloatingGlow() {
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 50; i++) {
            p.push(new THREE.Vector3(
                (Math.random() - 0.5) * 15, // Más cerca del centro
                (Math.random() - 0.5) * 15,
                Math.random() * -SEGMENT_LENGTH * 2 // Distribuidos en el fondo
            ));
        }
        return p;
    }, []);

    return (
        <group>
            {points.map((pos, i) => (
                <mesh key={i} position={pos}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshBasicMaterial color="#FFD700" transparent opacity={0.4} toneMapped={false} />
                </mesh>
            ))}
        </group>
    );
}

export default function LoginBackground() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: '#000' }}>
            {/* La cámara está fija en el centro mirando hacia -Z */}
            <Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
                {/* Neblina negra para ocultar el final del túnel en el fondo */}
                <fog attach="fog" args={['#000', 30, SEGMENT_LENGTH * 1.5]} />
                <InfiniteTunnel />
                <FloatingGlow />
            </Canvas>
            {/* Overlay de gradiente para oscurecer los bordes y enfocar al centro */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle, transparent 20%, #000 85%)',
                pointerEvents: 'none'
            }} />
        </div>
    );
}