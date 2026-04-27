'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleSwarm({ count = 800 }) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generamos datos iniciales aleatorios para cada partícula
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.005 + Math.random() / 200;
            const xFactor = -40 + Math.random() * 80;
            const yFactor = -20 + Math.random() * 40;
            const zFactor = -20 + Math.random() * 40;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    // Paleta Quasar: Turquesa y Azul 
    const colorArray = useMemo(() => {
        const colors = new Float32Array(count * 3);
        const color = new THREE.Color();
        for (let i = 0; i < count; i++) {
            Math.random() > 0.5 ? color.set('#00e5ff') : color.set('#0055ff');
            color.toArray(colors, i * 3);
        }
        return colors;
    }, [count]);

    useFrame(() => {
        if (!mesh.current) return;
        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.max(0.1, Math.cos(t));

            // Movimiento fluido tipo enjambre/nube de datos
            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.15, 0]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0.6}>
                <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
            </meshBasicMaterial>
        </instancedMesh>
    );
}

export default function FooterBackground() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
            <Canvas camera={{ fov: 75, position: [0, 0, 30] }}>
                <fog attach="fog" args={['#050505', 10, 40]} />
                <ParticleSwarm />
            </Canvas>
        </div>
    );
}