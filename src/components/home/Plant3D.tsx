"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { computeCountdown, type WaterStatus } from "@/lib/countdown";
import type { Plant } from "@/lib/types";

/**
 * A potted plant in the 3D home: a tapered pot plus a cluster of leaf blades.
 * Its posture reflects watering status — upright and green when happy, drooping
 * and desaturated when overdue — and it sways gently at idle. Hover lifts it;
 * tap selects it (opens the detail sheet in the parent).
 */

const STATUS_RING: Record<WaterStatus, string> = {
  ok: "#4ade80",
  soon: "#fbbf24",
  overdue: "#f87171",
};

const FOLIAGE_OK = new THREE.Color("#3f9e5a");
const FOLIAGE_SAD = new THREE.Color("#8a9a6a");

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

  const cd = useMemo(
    () => computeCountdown(plant.last_watered, plant.water_freq_days, weatherFactor),
    [plant.last_watered, plant.water_freq_days, weatherFactor],
  );

  // Droop amount grows as the plant gets thirsty (0 = upright, ~0.5rad overdue).
  const droop = cd.status === "overdue" ? 0.5 : cd.status === "soon" ? 0.22 : 0.05;
  const foliageColor = useMemo(
    () => FOLIAGE_OK.clone().lerp(FOLIAGE_SAD, cd.status === "overdue" ? 0.7 : cd.status === "soon" ? 0.35 : 0),
    [cd.status],
  );

  // Deterministic per-plant phase so plants don't sway in lockstep.
  const phase = useMemo(() => {
    let h = 0;
    for (let i = 0; i < plant.id.length; i++) h = (h * 31 + plant.id.charCodeAt(i)) % 1000;
    return (h / 1000) * Math.PI * 2;
  }, [plant.id]);

  // frameloop is "demand": we only render when something moves. This callback
  // animates the lift + a gentle sway for the active plant, and calls
  // invalidate() to request the next frame until it settles — so at rest the
  // scene is fully idle (kind to mobile batteries).
  useFrame((state) => {
    if (!foliage.current || !group.current) return;
    const active = hovered || selected;
    const targetLift = position[1] + (active ? 0.12 : 0);
    const cur = group.current.position.y;
    group.current.position.y = THREE.MathUtils.lerp(cur, targetLift, 0.15);
    const settling = Math.abs(group.current.position.y - targetLift) > 0.001;

    if (reduceMotion || !active) {
      foliage.current.rotation.z = -droop;
      foliage.current.rotation.x = droop * 0.4;
      if (settling) state.invalidate();
      return;
    }

    const t = state.clock.elapsedTime;
    foliage.current.rotation.z = -droop + Math.sin(t * 0.9 + phase) * 0.04;
    foliage.current.rotation.x = droop * 0.4 + Math.cos(t * 0.7 + phase) * 0.02;
    state.invalidate(); // keep animating while hovered/selected
  });

  // Leaf blades arranged radially, each a flattened cone.
  const leaves = useMemo(() => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return {
        rot: a,
        tilt: 0.5 + (i % 2) * 0.25,
        h: 0.42 + (i % 3) * 0.08,
      };
    });
  }, []);

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
      scale={hovered || selected ? 1.08 : 1}
    >
      {/* pot */}
      <mesh castShadow position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.15, 0.11, 0.28, 16]} />
        <meshStandardMaterial color="#c07a54" roughness={0.7} />
      </mesh>
      {/* soil */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.145, 0.145, 0.03, 16]} />
        <meshStandardMaterial color="#4a3728" roughness={1} />
      </mesh>

      {/* foliage */}
      <group ref={foliage} position={[0, 0.3, 0]}>
        {leaves.map((l, i) => (
          <mesh key={i} rotation={[l.tilt, l.rot, 0]} position={[0, l.h / 2, 0]} castShadow>
            <coneGeometry args={[0.09, l.h, 5]} />
            <meshStandardMaterial color={foliageColor} roughness={0.6} flatShading />
          </mesh>
        ))}
      </group>

      {/* status ring on the floor under the pot */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.19, 0.23, 24]} />
        <meshBasicMaterial color={STATUS_RING[cd.status]} transparent opacity={0.85} />
      </mesh>

      {(hovered || selected) && (
        <Html position={[0, 0.95, 0]} center distanceFactor={8} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-glass-edge bg-[rgba(8,28,14,0.82)] px-2.5 py-1 text-center text-[11px] text-leaf-100 backdrop-blur-md">
            <span className="font-medium">{plant.name}</span>
            <span className="ml-1.5 text-leaf-mut">{cd.label}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
