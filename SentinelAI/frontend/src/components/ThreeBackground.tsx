import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

function AnimatedSpheres() {
  const result = useStore((state) => state.result);
  const color = result?.verdict === 'Fake' ? '#ff4444' : '#10b981';
  
  return (
    <group>
      <Float speed={1.05} rotationIntensity={0.5} floatIntensity={0.9}>
        <Sphere args={[1, 24, 24]} position={[-2, 1, -2]}>
          <MeshDistortMaterial
            color={color}
            speed={0.9}
            distort={0.2}
            radius={1}
            opacity={0.12}
            transparent
          />
        </Sphere>
      </Float>
      
      <Float speed={1.25} rotationIntensity={0.35} floatIntensity={0.7}>
        <Sphere args={[1.5, 24, 24]} position={[2, -1, -3]}>
          <MeshDistortMaterial
            color={color}
            speed={0.8}
            distort={0.18}
            radius={1}
            opacity={0.08}
            transparent
          />
        </Sphere>
      </Float>

      <Float speed={0.85} rotationIntensity={0.8} floatIntensity={0.45}>
        <Sphere args={[0.8, 24, 24]} position={[0, 2, -4]}>
          <MeshDistortMaterial
            color={color}
            speed={1.1}
            distort={0.22}
            radius={1}
            opacity={0.1}
            transparent
          />
        </Sphere>
      </Float>
    </group>
  );
}

function Grid() {
  const gridRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.x = -Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.06) * 0.05;
      gridRef.current.position.y = -2 + Math.cos(state.clock.elapsedTime * 0.08) * 0.05;
    }
  });

  return (
    <group ref={gridRef}>
      <gridHelper args={[100, 50, '#333', '#111']} />
    </group>
  );
}

export default function ThreeBackground() {
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    const smallViewport = window.innerWidth < 1024;
    setLowPowerMode(prefersReducedMotion || lowCpu || lowMemory || smallViewport);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-black">
      <Canvas
        dpr={lowPowerMode ? [0.8, 1] : [1, 1.25]}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 5], fov: 75 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <AnimatedSpheres />
        <Grid />
        <fog attach="fog" args={['#000', 5, 15]} />
      </Canvas>
    </div>
  );
}
