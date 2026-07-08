"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { MODEL_PATH } from "@/lib/plantModels";
import { normalizeModel } from "@/lib/modelUtils";

/**
 * The signature splash: a lush plant grows out of a pot while a watering can
 * tilts and pours, the WaterDem wordmark fades in over it, and a tap makes the
 * plant wiggle. Built on react-three-fiber with the real Tropical Plants Pack
 * model + textures (MozzarellaARC, CC-BY). Plays once per session.
 */

const SPLASH_NODE = "tree.006SM_MZRa_Monstera_B071"; // the fullest monstera
const PLANT_HEIGHT = 1.4;
const POT_TOP = 0.6;
const DROPS = 14;

const EMIT = new THREE.Vector3(-0.46, 1.4, 0.1);
const LAND = new THREE.Vector3(0, POT_TOP + 0.02, 0);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth01 = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function SplashContent({
  onReveal,
  onDone,
}: {
  onReveal: () => void;
  onDone: () => void;
}) {
  const { nodes } = useGLTF(MODEL_PATH) as unknown as {
    nodes: Record<string, THREE.Object3D>;
  };
  const model = useMemo(() => {
    const src = nodes[SPLASH_NODE];
    return src ? normalizeModel(src, PLANT_HEIGHT) : null;
  }, [nodes]);

  const plant = useRef<THREE.Group>(null);
  const can = useRef<THREE.Group>(null);
  const drops = useRef<THREE.Mesh[]>([]);
  const start = useRef<number | null>(null);
  const wiggle = useRef(0);
  const revealed = useRef(false);
  const done = useRef(false);

  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    // The plant grows out of the soil with a soft overshoot.
    const g = Math.max(0.0001, easeOutBack(clamp01((t - 0.3) / 1.7)));
    if (plant.current) {
      wiggle.current *= 0.9;
      const settled = Math.min(1, g);
      plant.current.scale.setScalar(g);
      plant.current.rotation.z =
        Math.sin(t * 1.3) * 0.025 * settled + Math.sin(t * 24) * wiggle.current;
      plant.current.rotation.x = Math.sin(t * 0.9 + 1) * 0.02 * settled;
    }

    // The can tilts to pour, holds, then rights itself.
    const pour = smooth01((t - 0.15) / 0.4) * (1 - smooth01((t - 2.2) / 0.35));
    if (can.current) can.current.rotation.z = -0.12 - pour * 0.9;

    // Water arcs from the spout down onto the soil.
    const watering = pour > 0.04;
    for (let i = 0; i < DROPS; i++) {
      const m = drops.current[i];
      if (!m) continue;
      if (!watering) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      const prog = (t * 1.7 + i / DROPS) % 1;
      m.position.lerpVectors(EMIT, LAND, prog);
      m.position.y -= 0.22 * prog * prog;
      m.position.x += Math.sin(i * 3.1) * 0.018;
      m.position.z += Math.cos(i * 2.3) * 0.015;
      m.scale.set(0.8, 1 + prog * 1.3, 0.8).multiplyScalar(pour);
    }

    if (!revealed.current && t > 1.45) {
      revealed.current = true;
      onReveal();
    }
    if (!done.current && t > 3.5) {
      done.current = true;
      onDone();
    }
    state.invalidate();
  });

  return (
    <group>
      {/* saucer + glazed pot */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.52, 0.48, 0.06, 32]} />
        <meshStandardMaterial color="#9a6440" roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.44, 0.32, 0.52, 32]} />
        <meshStandardMaterial color="#c67a52" roughness={0.28} metalness={0.14} envMapIntensity={1.2} />
      </mesh>
      <mesh castShadow position={[0, 0.585, 0]}>
        <cylinderGeometry args={[0.47, 0.44, 0.06, 32]} />
        <meshStandardMaterial color="#b56b46" roughness={0.26} metalness={0.16} envMapIntensity={1.3} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.03, 32]} />
        <meshStandardMaterial color="#3a2b1b" roughness={1} />
      </mesh>

      {/* the real plant, growing out of the soil; tap to wiggle */}
      <group
        ref={plant}
        position={[0, POT_TOP, 0]}
        scale={0.0001}
        onPointerDown={(e) => {
          e.stopPropagation();
          wiggle.current = 0.28;
        }}
      >
        {model && <primitive object={model} />}
      </group>

      {/* watering can (procedural, galvanized metal) */}
      <group ref={can} position={[-1.05, 1.5, 0.1]} rotation={[0, 0.3, -0.12]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.28, 0.4, 24]} />
          <meshStandardMaterial color="#c2cace" roughness={0.32} metalness={0.85} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <torusGeometry args={[0.24, 0.025, 12, 24]} />
          <meshStandardMaterial color="#aeb6ba" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* spout reaching toward the plant */}
        <mesh position={[0.34, 0.12, 0]} rotation={[0, 0, -0.9]} castShadow>
          <cylinderGeometry args={[0.045, 0.09, 0.6, 16]} />
          <meshStandardMaterial color="#b7bfc3" roughness={0.3} metalness={0.88} envMapIntensity={1.4} />
        </mesh>
        {/* handle arcing over the top */}
        <mesh position={[-0.05, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.022, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#aeb6ba" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>

      {/* falling water */}
      {Array.from({ length: DROPS }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) drops.current[i] = m;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color="#d3efff"
            transparent
            opacity={0.85}
            roughness={0.1}
            metalness={0}
            emissive="#3aa0ff"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={5} blur={2.4} far={3} />
    </group>
  );
}

export default function Splash3DScene({
  onReveal,
  onDone,
  onSkip,
}: {
  onReveal: () => void;
  onDone: () => void;
  onSkip: () => void;
}) {
  return (
    <Canvas
      shadows
      frameloop="always"
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ position: [0, 1.2, 4.3], fov: 32 }}
      onCreated={({ camera }) => camera.lookAt(0, 1.0, 0)}
      onPointerMissed={onSkip}
    >
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff4e0", "#14210f", 0.6]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} color="#cfe8ff" />

      <Environment resolution={128}>
        <Lightformer intensity={2.4} position={[0, 5, 2]} scale={[8, 8, 1]} color="#fff3dd" />
        <Lightformer intensity={1} position={[-4, 2, 3]} scale={[3, 6, 1]} color="#eaf6ff" />
        <Lightformer intensity={0.8} position={[4, 1, -3]} scale={[4, 4, 1]} color="#dff5e6" />
      </Environment>

      <Suspense fallback={null}>
        <SplashContent onReveal={onReveal} onDone={onDone} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);
