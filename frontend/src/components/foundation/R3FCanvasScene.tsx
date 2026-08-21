'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

function LabModel() {
  const groupRef = useRef<THREE.Group>(null);
  const screenGlowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.12;
    }
    if (screenGlowRef.current) {
      const t = state.clock.getElapsedTime();
      screenGlowRef.current.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Floor */}
      <mesh position={[0, -1.02, 0]} receiveShadow>
        <cylinderGeometry args={[2.8, 2.8, 0.04, 64]} />
        <meshStandardMaterial color="#e6e2d8" roughness={0.7} />
      </mesh>

      {/* Main deep navy workbench top */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.16, 1.8]} />
        <meshStandardMaterial color="#112840" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Emerald workbench legs */}
      {[
        [-1.4, -0.5, -0.7],
        [1.4, -0.5, -0.7],
        [-1.4, -0.5, 0.7],
        [1.4, -0.5, 0.7],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.88, 16]} />
          <meshStandardMaterial color="#097965" roughness={0.4} metalness={0.1} />
        </mesh>
      ))}

      {/* Central Desktop Monitor */}
      <mesh position={[0, 0.2, -0.4]} castShadow>
        <boxGeometry args={[0.2, 0.24, 0.15]} />
        <meshStandardMaterial color="#112840" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, -0.4]} castShadow>
        <boxGeometry args={[1.5, 0.9, 0.08]} />
        <meshStandardMaterial color="#112840" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.7, -0.35]}>
        <planeGeometry args={[1.38, 0.78]} />
        <meshStandardMaterial
          ref={screenGlowRef}
          color="#097965"
          emissive="#097965"
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.7, -0.34]}>
        <planeGeometry args={[1.1, 0.06]} />
        <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
      </mesh>
      <mesh position={[-0.2, 0.6, -0.34]}>
        <planeGeometry args={[0.7, 0.04]} />
        <meshBasicMaterial color="#f5b544" opacity={0.8} transparent />
      </mesh>

      {/* Two Saffron Cylindrical Learning Tools */}
      <group position={[-0.9, 0.26, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.36, 0.55]} />
          <meshStandardMaterial color="#f5b544" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
          <meshStandardMaterial color="#112840" />
        </mesh>
        <mesh position={[0.15, 0.04, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color="#097965" />
        </mesh>
      </group>

      <group position={[0.9, 0.24, 0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.32, 24]} />
          <meshStandardMaterial color="#f5b544" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#112840" />
        </mesh>
      </group>

      {/* Micro-controller board */}
      <mesh position={[0.05, 0.1, 0.3]} castShadow>
        <boxGeometry args={[0.7, 0.04, 0.45]} />
        <meshStandardMaterial color="#fbfaf5" roughness={0.5} />
      </mesh>
      <mesh position={[0.05, 0.13, 0.3]}>
        <boxGeometry args={[0.2, 0.03, 0.15]} />
        <meshStandardMaterial color="#097965" />
      </mesh>

      {/* Floating Geometric Pieces */}
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.2}>
        <mesh position={[-1.6, 1.2, 0.4]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#097965" roughness={0.2} />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={2} floatIntensity={1.5}>
        <mesh position={[1.5, 1.1, -0.2]} castShadow>
          <torusGeometry args={[0.16, 0.05, 16, 32]} />
          <meshStandardMaterial color="#f5b544" roughness={0.3} />
        </mesh>
      </Float>

      <Float speed={2.4} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[1.1, 1.4, 0.5]} castShadow>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial color="#097965" roughness={0.1} metalness={0.2} />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1.8} floatIntensity={0.8}>
        <mesh position={[-0.8, 1.5, -0.6]} castShadow>
          <tetrahedronGeometry args={[0.15]} />
          <meshStandardMaterial color="#f5b544" roughness={0.2} />
        </mesh>
      </Float>

      <Sparkles count={30} scale={4.5} size={2.5} speed={0.4} color="#f5b544" />
    </group>
  );
}

export default function R3FCanvasScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [3.5, 2.4, 4.2], fov: 42 }}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[6, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color="#fffcf5"
      />
      <pointLight position={[-3, 4, -2]} intensity={0.6} color="#f5b544" />
      <pointLight position={[0, 1.5, 2]} intensity={0.8} color="#097965" />

      <LabModel />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 4}
      />
    </Canvas>
  );
}
