"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { CLAY, CLAY_ROUGH } from "@/lib/clay";

/**
 * A stylised clay flower cluster: three daisy-like blooms on curved stems with
 * a few leaves, in the soft-clay palette (coral / gold / white petals around a
 * pollen centre). Cheap shared geometries; base sits at y=0.
 */

const DEG = Math.PI / 180;

const BLOOMS = [
  { x: 0, z: 0.02, h: 0.52, lean: 0, petal: "#e8798a", size: 1 },
  { x: -0.12, z: -0.05, h: 0.38, lean: -16, petal: "#f2c14e", size: 0.8 },
  { x: 0.13, z: 0.05, h: 0.33, lean: 18, petal: "#f4efe2", size: 0.72 },
];

function Bloom({
  h,
  lean,
  petal,
  size,
  petalGeo,
  stemMat,
  leafMat,
}: {
  h: number;
  lean: number;
  petal: string;
  size: number;
  petalGeo: THREE.SphereGeometry;
  stemMat: THREE.MeshStandardMaterial;
  leafMat: THREE.MeshStandardMaterial;
}) {
  const petalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(petal),
        roughness: CLAY_ROUGH.waxy,
        metalness: 0,
        envMapIntensity: 0.9,
      }),
    [petal],
  );
  return (
    <group rotation={[0, 0, lean * DEG]}>
      {/* stem */}
      <mesh position={[0, h / 2, 0]} material={stemMat} castShadow>
        <cylinderGeometry args={[0.012, 0.018, h, 8]} />
      </mesh>
      {/* one leaf partway up (flattened sphere reads as a clay blade) */}
      <mesh
        position={[0.05, h * 0.45, 0]}
        rotation={[0, 0, -50 * DEG]}
        scale={[1.6, 0.35, 0.7]}
        material={leafMat}
        castShadow
      >
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>
      {/* flower head: 8 petals + pollen centre */}
      <group position={[0, h, 0]} scale={size}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={i}
            geometry={petalGeo}
            material={petalMat}
            position={[
              Math.cos((i / 8) * Math.PI * 2) * 0.085,
              0,
              Math.sin((i / 8) * Math.PI * 2) * 0.085,
            ]}
            rotation={[0, -(i / 8) * Math.PI * 2, 0]}
            castShadow
          />
        ))}
        <mesh castShadow>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial color="#f2c14e" roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export default function ClayFlower() {
  // A petal: a flattened, stretched sphere pointing outward on x.
  const petalGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.06, 10, 8);
    g.scale(1.5, 0.38, 0.85);
    return g;
  }, []);
  const stemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(CLAY.stem),
        roughness: CLAY_ROUGH.clay,
        metalness: 0,
      }),
    [],
  );
  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(CLAY.leaf),
        roughness: CLAY_ROUGH.waxy,
        metalness: 0,
        envMapIntensity: 0.9,
      }),
    [],
  );
  return (
    <group>
      {BLOOMS.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <Bloom
            h={b.h}
            lean={b.lean}
            petal={b.petal}
            size={b.size}
            petalGeo={petalGeo}
            stemMat={stemMat}
            leafMat={leafMat}
          />
        </group>
      ))}
      {/* low tuft of leaves at the soil */}
      {[0, 120, 240].map((a) => (
        <mesh
          key={a}
          position={[Math.cos(a * DEG) * 0.07, 0.05, Math.sin(a * DEG) * 0.07]}
          rotation={[35 * DEG, a * DEG, 0]}
          scale={[1.5, 0.4, 0.8]}
          material={leafMat}
          castShadow
        >
          <sphereGeometry args={[0.07, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}
