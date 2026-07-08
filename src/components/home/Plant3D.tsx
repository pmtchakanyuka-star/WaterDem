"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { computeCountdown, type WaterStatus } from "@/lib/countdown";
import type { Plant } from "@/lib/types";

/**
 * A potted plant in the 3D home: a glazed pot on a saucer with a cluster of
 * hand-curved leaf blades. Posture reflects watering status (upright and lush
 * when happy, drooping and desaturated when thirsty), leaves breathe with a
 * gentle per-leaf sway, and hover lifts + brightens it.
 */

const STATUS_RING: Record<WaterStatus, string> = {
  ok: "#4ade80",
  soon: "#fbbf24",
  overdue: "#f87171",
};

const FOLIAGE_OK = new THREE.Color("#43a35c");
const FOLIAGE_LUSH = new THREE.Color("#5ec47a");
const FOLIAGE_SAD = new THREE.Color("#8c9a63");

type Leaf = {
  angle: number;
  tilt: number;
  len: number;
  tier: number;
  shade: number;
  phase: number;
};

export default function Plant3D({
  plant,
  weatherFactor,
  position,
  hovered,
  selected,
  reduceMotion,
  onHover,
  onSelect,
}: {
  plant: Plant;
  weatherFactor: number;
  position: [number, number, number];
  hovered: boolean;
  selected: boolean;
  reduceMotion: boolean;
  onHover: (id: string | null) => void;
  onSelect: (plant: Plant) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const foliage = useRef<THREE.Group>(null);
  const leafRefs = useRef<(THREE.Group | null)[]>([]);

  const cd = useMemo(
    () => computeCountdown(plant.last_watered, plant.water_freq_days, weatherFactor),
    [plant.last_watered, plant.water_freq_days, weatherFactor],
  );

  const droop = cd.status === "overdue" ? 0.55 : cd.status === "soon" ? 0.24 : 0.06;
  const baseColor = useMemo(
    () =>
      FOLIAGE_OK.clone().lerp(
        cd.status === "overdue" ? FOLIAGE_SAD : FOLIAGE_LUSH,
        cd.status === "overdue" ? 0.75 : cd.status === "soon" ? 0.3 : 0.35,
      ),
    [cd.status],
  );

  // Deterministic per-plant phase so plants don't sway in lockstep.
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < plant.id.length; i++) h = (h * 31 + plant.id.charCodeAt(i)) % 997;
    return h / 997;
  }, [plant.id]);

  const leaves = useMemo<Leaf[]>(() => {
    const n = 9;
    return Array.from({ length: n }, (_, i) => {
      const tier = i < 5 ? 0 : 1; // outer skirt + inner spray
      const idx = tier === 0 ? i : i - 5;
      const count = tier === 0 ? 5 : 4;
      return {
        angle: (idx / count) * Math.PI * 2 + (tier === 0 ? 0 : 0.4) + seed * 6.28,
        tilt: tier === 0 ? 1.05 : 0.55, // outer more horizontal, inner upright
        len: (tier === 0 ? 0.44 : 0.5) + ((i * 7) % 5) * 0.03,
        tier,
        shade: 0.82 + ((i * 13) % 6) * 0.06,
        phase: (i / n) * Math.PI * 2 + seed * 6.28,
      };
    });
  }, [seed]);

  useFrame((state) => {
    if (!group.current) return;
    const active = hovered || selected;
    const targetLift = position[1] + (active ? 0.14 : 0);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetLift, 0.15);

    const settling = Math.abs(group.current.position.y - targetLift) > 0.001;
    const t = state.clock.elapsedTime;

    leafRefs.current.forEach((lr, i) => {
      if (!lr) return;
      const l = leaves[i];
      if (reduceMotion) {
        lr.rotation.x = l.tilt + droop;
        return;
      }
      // Gentle breathing sway, a touch stronger when the plant is active.
      const amp = (active ? 0.09 : 0.05) + l.tier * 0.01;
      lr.rotation.x = l.tilt + droop + Math.sin(t * 1.1 + l.phase) * amp;
      lr.rotation.z = Math.cos(t * 0.8 + l.phase) * amp * 0.6;
    });

    if (foliage.current && !reduceMotion) {
      foliage.current.rotation.y = Math.sin(t * 0.4 + seed * 6.28) * 0.05;
    }
    if (reduceMotion && settling) state.invalidate();
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(plant.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(plant);
      }}
      scale={hovered || selected ? 1.07 : 1}
    >
      {/* saucer */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.17, 0.16, 0.03, 20]} />
        <meshStandardMaterial color="#a06a48" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* glazed pot body */}
      <mesh castShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.155, 0.11, 0.28, 20]} />
        <meshStandardMaterial
          color="#c67a52"
          roughness={0.32}
          metalness={0.12}
          envMapIntensity={1.1}
        />
      </mesh>
      {/* pot rim / lip */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.17, 0.16, 0.05, 20]} />
        <meshStandardMaterial
          color="#b56b46"
          roughness={0.28}
          metalness={0.14}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* soil */}
      <mesh position={[0, 0.315, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 20]} />
        <meshStandardMaterial color="#40301f" roughness={1} />
      </mesh>

      {/* foliage — curved leaf blades */}
      <group ref={foliage} position={[0, 0.33, 0]}>
        {leaves.map((l, i) => (
          <group
            key={i}
            ref={(el) => {
              leafRefs.current[i] = el;
            }}
            rotation={[l.tilt + droop, l.angle, 0]}
          >
            {/* blade: a flattened, tapered cone arcing outward */}
            <mesh position={[0, l.len / 2, 0]} scale={[1, 1, 0.28]} castShadow>
              <coneGeometry args={[0.075, l.len, 5]} />
              <meshStandardMaterial
                color={baseColor.clone().multiplyScalar(l.shade)}
                roughness={0.45}
                metalness={0.04}
                envMapIntensity={0.7}
                flatShading
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
        {/* a tiny central sprout for fullness */}
        <mesh position={[0, 0.14, 0]} scale={[1, 1, 0.3]} castShadow>
          <coneGeometry args={[0.05, 0.28, 5]} />
          <meshStandardMaterial color={baseColor.clone().multiplyScalar(1.05)} roughness={0.45} flatShading />
        </mesh>
      </group>

      {/* soft status glow on the floor */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 28]} />
        <meshBasicMaterial color={STATUS_RING[cd.status]} transparent opacity={0.14} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.185, 0.215, 28]} />
        <meshBasicMaterial color={STATUS_RING[cd.status]} transparent opacity={0.8} />
      </mesh>

      {(hovered || selected) && (
        <Html position={[0, 1.0, 0]} center distanceFactor={8} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-glass-edge bg-[rgba(8,28,14,0.82)] px-2.5 py-1 text-center text-[11px] text-leaf-100 backdrop-blur-md">
            <span className="font-medium">{plant.name}</span>
            <span className="ml-1.5 text-leaf-mut">{cd.label}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
