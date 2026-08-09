import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, RoundedBox, ContactShadows } from "@react-three/drei";

function DocumentPanel({ position, rotation, tint = "#ffffff", lines = 4 }) {
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
      <group position={position} rotation={rotation}>
        <RoundedBox args={[1.7, 2.2, 0.07]} radius={0.06}>
          <meshPhysicalMaterial color={tint} transmission={0.55} roughness={0.18} thickness={1.6} transparent opacity={0.92} />
        </RoundedBox>
        {Array.from({ length: lines }).map((_, i) => (
          <mesh key={i} position={[-0.15, 0.65 - i * 0.32, 0.06]}>
            <boxGeometry args={[i === 0 ? 0.9 : 1.15 - (i % 2) * 0.25, 0.07, 0.02]} />
            <meshStandardMaterial color={i === 0 ? "#1D4ED8" : "#CBD5E1"} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0.55, -0.75, 0.06]}>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 32]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function Shield({ position }) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.9);
    s.bezierCurveTo(0.55, 0.75, 0.7, 0.6, 0.7, 0.35);
    s.bezierCurveTo(0.7, -0.35, 0.35, -0.75, 0, -0.95);
    s.bezierCurveTo(-0.35, -0.75, -0.7, -0.35, -0.7, 0.35);
    s.bezierCurveTo(-0.7, 0.6, -0.55, 0.75, 0, 0.9);
    return new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
  }, []);
  return (
    <Float speed={1.1} rotationIntensity={0.4} floatIntensity={1.4}>
      <group position={position} rotation={[0, -0.4, 0]}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial color="#1D4ED8" roughness={0.25} metalness={0.15} clearcoat={0.6} />
        </mesh>
        <mesh position={[-0.02, -0.05, 0.28]} rotation={[0, 0, -0.78]}>
          <boxGeometry args={[0.14, 0.5, 0.06]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[-0.22, -0.28, 0.28]} rotation={[0, 0, 0.78]}>
          <boxGeometry args={[0.14, 0.28, 0.06]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function IdCard({ position, rotation }) {
  return (
    <Float speed={1.7} rotationIntensity={0.6} floatIntensity={1.0}>
      <group position={position} rotation={rotation}>
        <RoundedBox args={[1.9, 1.2, 0.06]} radius={0.08}>
          <meshPhysicalMaterial color="#EFF6FF" transmission={0.4} roughness={0.2} thickness={1.2} transparent opacity={0.95} />
        </RoundedBox>
        <mesh position={[-0.6, 0, 0.05]}>
          <circleGeometry args={[0.26, 32]} />
          <meshStandardMaterial color="#93C5FD" roughness={0.4} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.35, 0.28 - i * 0.28, 0.05]}>
            <boxGeometry args={[0.85 - i * 0.15, 0.08, 0.02]} />
            <meshStandardMaterial color={i === 0 ? "#1D4ED8" : "#CBD5E1"} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function CheckBadge({ position }) {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={1.6}>
      <group position={position}>
        <mesh>
          <torusGeometry args={[0.34, 0.09, 16, 48]} />
          <meshStandardMaterial color="#10B981" roughness={0.3} />
        </mesh>
        <mesh position={[0.03, -0.02, 0]} rotation={[0, 0, -0.78]}>
          <boxGeometry args={[0.09, 0.34, 0.09]} />
          <meshStandardMaterial color="#10B981" roughness={0.3} />
        </mesh>
        <mesh position={[-0.13, -0.14, 0]} rotation={[0, 0, 0.78]}>
          <boxGeometry args={[0.09, 0.2, 0.09]} />
          <meshStandardMaterial color="#10B981" roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function SceneRig({ pointer }) {
  const group = useRef();
  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.current.x * 0.22, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.current.y * 0.12, 0.05);
  });
  return (
    <group ref={group}>
      <DocumentPanel position={[-1.4, 0.4, 0]} rotation={[0.08, 0.35, -0.06]} />
      <DocumentPanel position={[1.5, -0.5, -1.2]} rotation={[-0.05, -0.4, 0.08]} tint="#F1F5F9" lines={3} />
      <IdCard position={[1.2, 1.1, -0.4]} rotation={[0.1, -0.3, 0.05]} />
      <Shield position={[0.1, -1.15, 0.6]} />
      <CheckBadge position={[-0.4, 1.55, 0.4]} />
    </group>
  );
}

export default function Hero3D() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="w-full h-full pointer-events-none" data-testid="hero-3d-canvas">
      <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <SceneRig pointer={pointer} />
        <ContactShadows position={[0, -2.4, 0]} opacity={0.18} scale={12} blur={2.6} far={4} color="#0A192F" />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
