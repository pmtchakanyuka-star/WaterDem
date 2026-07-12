"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { computeCountdown, type WaterStatus } from "@/lib/countdown";
import { MODEL_PATH, modelNodeForLook, isCannabis } from "@/lib/plantModels";
import { normalizeModel } from "@/lib/modelUtils";
import { CLAY, CLAY_ROUGH, RASTA } from "@/lib/clay";
import ClayCannabis from "@/components/home/ClayCannabis";
import ClayFlower from "@/components/home/ClayFlower";
import type { GrowthStage, Plant, PlantLook, PotLook } from "@/lib/types";

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

/** Foliage scale per life stage ("seed" swaps to a SeedSprout at full scale). */
const STAGE_SCALE: Record<GrowthStage, number> = {
  seed: 1,
  seedling: 0.35,
  young: 0.7,
  mature: 1,
};

/** A germinating seed: a soil mound with one tiny sprout — replaces foliage. */
function SeedSprout() {
  return (
    <group>
      {/* soil mound */}
      <mesh castShadow position={[0, 0.015, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.09, 20, 16]} />
        <meshStandardMaterial color={CLAY.soil} roughness={1} />
      </mesh>
      {/* thin stem */}
      <mesh castShadow position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.006, 0.009, 0.06, 10]} />
        <meshStandardMaterial color={CLAY.stem} roughness={CLAY_ROUGH.waxy} metalness={0} envMapIntensity={0.85} />
      </mesh>
      {/* one tiny leaf */}
      <mesh castShadow position={[0.022, 0.1, 0]} rotation={[0, 0, -0.5]} scale={[1, 0.35, 0.6]}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshStandardMaterial color={CLAY.leaf} roughness={CLAY_ROUGH.waxy} metalness={0} envMapIntensity={0.85} />
      </mesh>
    </group>
  );
}

/** A two-band clay pot with a saucer and soil, coloured by look. */
function ClayPot({
  bottom,
  top,
  rim,
  saucer,
}: {
  bottom: string;
  top: string;
  rim: string;
  saucer: string;
}) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.2, 0.185, 0.035, 28]} />
        <meshStandardMaterial color={saucer} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.172, 0.16, 0.19, 28]} />
        <meshStandardMaterial color={bottom} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.178, 0.172, 0.14, 28]} />
        <meshStandardMaterial color={top} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.378, 0]}>
        <cylinderGeometry args={[0.186, 0.178, 0.03, 28]} />
        <meshStandardMaterial color={rim} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.378, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 28]} />
        <meshStandardMaterial color={CLAY.soil} roughness={1} />
      </mesh>
    </group>
  );
}

/** The pot for a given look. */
function PotByLook({ pot }: { pot: PotLook }) {
  switch (pot) {
    case "rasta":
      return <RastaPot />;
    case "terracotta":
      return <ClayPot bottom={CLAY.potTerracotta} top={CLAY.terracotta} rim={CLAY.terracottaSoft} saucer={CLAY.saucer} />;
    case "teal":
      return <ClayPot bottom={CLAY.teal} top={CLAY.tealSoft} rim={CLAY.potTealRim} saucer={CLAY.teal} />;
    case "sand":
      return <ClayPot bottom={CLAY.rugSand} top={CLAY.cream} rim={CLAY.creamSoft} saucer={CLAY.rugSand} />;
    case "twotone":
    default:
      return <ClayPot bottom={CLAY.potTerracotta} top={CLAY.potTeal} rim={CLAY.potTealRim} saucer={CLAY.saucer} />;
  }
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

  // The user's chosen look wins; otherwise auto (species, with cannabis-named
  // plants defaulting to the cannabis look). Pot defaults to Rasta for cannabis.
  const look = useMemo<PlantLook | null>(
    () => plant.plant_look ?? (isCannabis(plant) ? "cannabis" : null),
    [plant],
  );
  const cannabis = look === "cannabis";
  const flower = look === "flower";
  const procedural = cannabis || flower;
  const potLook: PotLook = plant.pot_look ?? (cannabis ? "rasta" : "twotone");
  const nodeName = useMemo(() => modelNodeForLook(plant, look), [plant, look]);
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
      {/* pot: the chosen look (Rasta by default for cannabis) */}
      <PotByLook pot={potLook} />

      {/* foliage: a seed sprout at the "seed" stage, else procedural clay
          cannabis/flowers or the model on the soil — scaled by life stage */}
      <group
        ref={sway}
        position={[0, procedural ? 0.41 : 0.39, 0]}
        scale={STAGE_SCALE[plant.growth_stage]}
      >
        {plant.growth_stage === "seed" ? (
          <SeedSprout />
        ) : cannabis ? (
          <ClayCannabis />
        ) : flower ? (
          <ClayFlower />
        ) : (
          model && <primitive object={model} />
        )}
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
