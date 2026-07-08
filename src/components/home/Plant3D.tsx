"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { computeCountdown, type WaterStatus } from "@/lib/countdown";
import { MODEL_PATH, modelNodeFor, isCannabis } from "@/lib/plantModels";
import { normalizeModel } from "@/lib/modelUtils";
import { CLAY, CLAY_ROUGH, RASTA } from "@/lib/clay";
import ClayCannabis from "@/components/home/ClayCannabis";
import type { Plant } from "@/lib/types";

/**
 * A potted plant in the 3D home: a two-tone clay pot on a saucer holding a real
 * textured plant model (Tropical Plants Pack M02P by MozzarellaARC, CC-BY),
 * re-materialled to the soft-clay look. Cannabis-named plants get a procedural
 * clay cannabis plant in a red/gold/green Rasta pot instead. Foliage sways,
 * tilts when thirsty, and lifts on hover; status shows via a floor ring + label.
 */

const STATUS_RING: Record<WaterStatus, string> = {
  ok: "#4ade80",
  soon: "#fbbf24",
  overdue: "#f87171",
};

const TARGET_HEIGHT = 0.86;

/** Two-tone teal/terracotta clay pot (default). */
function TwoTonePot() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.185, 0.035, 28]} />
        <meshStandardMaterial color={CLAY.saucer} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.172, 0.16, 0.19, 28]} />
        <meshStandardMaterial color={CLAY.potTerracotta} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.178, 0.172, 0.14, 28]} />
        <meshStandardMaterial color={CLAY.potTeal} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.378, 0]}>
        <cylinderGeometry args={[0.186, 0.178, 0.03, 28]} />
        <meshStandardMaterial color={CLAY.potTealRim} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.378, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 28]} />
        <meshStandardMaterial color={CLAY.soil} roughness={1} />
      </mesh>
    </group>
  );
}

/** Red/gold/green Rasta clay pot for the cannabis plant. */
function RastaPot() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.185, 0.035, 28]} />
        <meshStandardMaterial color={RASTA.green} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.168, 0.16, 0.14, 28]} />
        <meshStandardMaterial color={RASTA.red} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.225, 0]}>
        <cylinderGeometry args={[0.176, 0.168, 0.12, 28]} />
        <meshStandardMaterial color={RASTA.gold} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.184, 0.176, 0.11, 28]} />
        <meshStandardMaterial color={RASTA.green} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.393, 0]}>
        <cylinderGeometry args={[0.19, 0.184, 0.03, 28]} />
        <meshStandardMaterial color={RASTA.green} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.393, 0]}>
        <cylinderGeometry args={[0.176, 0.176, 0.03, 28]} />
        <meshStandardMaterial color={CLAY.soil} roughness={1} />
      </mesh>
    </group>
  );
}

function useNormalizedModel(nodeName: string) {
  const { nodes } = useGLTF(MODEL_PATH) as unknown as {
    nodes: Record<string, THREE.Object3D>;
  };
  return useMemo(() => {
    const src = nodes[nodeName];
    if (!src) return null;
    const group = normalizeModel(src, TARGET_HEIGHT);
    // Soft-clay look: keep the model's own green (tinting muddied it), just add a
    // gentle waxy sheen and a faint emissive lift so leaves read fresh, not dark.
    group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mesh.isMesh && mat && "roughness" in mat) {
        mat.roughness = CLAY_ROUGH.waxy;
        mat.metalness = 0;
        mat.envMapIntensity = 1;
        mat.emissive = new THREE.Color(CLAY.leafDeep);
        mat.emissiveIntensity = 0.12;
        mat.needsUpdate = true;
      }
    });
    return group;
  }, [nodes, nodeName]);
}

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
  const sway = useRef<THREE.Group>(null);

  const cannabis = useMemo(() => isCannabis(plant), [plant]);
  const nodeName = useMemo(() => modelNodeFor(plant), [plant]);
  const model = useNormalizedModel(nodeName);

  const cd = useMemo(
    () => computeCountdown(plant.last_watered, plant.water_freq_days, weatherFactor),
    [plant.last_watered, plant.water_freq_days, weatherFactor],
  );
  const droop = cd.status === "overdue" ? 0.28 : cd.status === "soon" ? 0.12 : 0.02;

  const phase = useMemo(() => {
    let h = 0;
    for (let i = 0; i < plant.id.length; i++) h = (h * 31 + plant.id.charCodeAt(i)) % 997;
    return (h / 997) * Math.PI * 2;
  }, [plant.id]);

  useFrame((state) => {
    if (!group.current || !sway.current) return;
    const active = hovered || selected;
    const targetLift = position[1] + (active ? 0.14 : 0);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, targetLift, 0.15);
    const settling = Math.abs(group.current.position.y - targetLift) > 0.001;

    if (reduceMotion) {
      sway.current.rotation.set(droop, 0, 0);
      if (settling) state.invalidate();
      return;
    }
    const t = state.clock.elapsedTime;
    const amp = active ? 0.05 : 0.03;
    sway.current.rotation.x = droop + Math.sin(t * 0.9 + phase) * amp;
    sway.current.rotation.z = Math.cos(t * 0.7 + phase) * amp * 0.7;
    sway.current.rotation.y = Math.sin(t * 0.35 + phase) * 0.05;
    state.invalidate();
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
      scale={hovered || selected ? 1.06 : 1}
    >
      {/* pot: Rasta for cannabis, two-tone clay otherwise */}
      {cannabis ? <RastaPot /> : <TwoTonePot />}

      {/* foliage: procedural clay cannabis, or the model on the soil */}
      <group ref={sway} position={[0, cannabis ? 0.41 : 0.39, 0]}>
        {cannabis ? <ClayCannabis /> : model && <primitive object={model} />}
      </group>

      {/* soft status ring on the floor */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.185, 0.215, 28]} />
        <meshBasicMaterial color={STATUS_RING[cd.status]} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 28]} />
        <meshBasicMaterial color={STATUS_RING[cd.status]} transparent opacity={0.12} />
      </mesh>

      {(hovered || selected) && (
        <Html position={[0, 1.05, 0]} center distanceFactor={8} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-glass-edge bg-[rgba(8,28,14,0.82)] px-2.5 py-1 text-center text-[11px] text-leaf-100 backdrop-blur-md">
            <span className="font-medium">{plant.name}</span>
            <span className="ml-1.5 text-leaf-mut">{cd.label}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
