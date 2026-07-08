"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { CLAY, CLAY_ROUGH } from "@/lib/clay";

/**
 * A stylised clay cannabis plant: palmate leaves (7 serrated leaflets each) in
 * fresh clay green, radiating from a central stalk in whorls. Built from a
 * single shared extruded leaflet geometry so it stays cheap. Base sits at y=0.
 */

const DEG = Math.PI / 180;

// A serrated hemp leaflet, tip pointing +Y, base at the origin (~1 unit long).
let LEAFLET_GEO: THREE.ExtrudeGeometry | null = null;
function leafletGeo() {
  if (LEAFLET_GEO) return LEAFLET_GEO;
  const pts: [number, number][] = [
    [6, 14], [3, 18], [10, 34], [5, 39], [9, 58], [4, 63], [3, 84], [0, 100],
    [-3, 84], [-4, 63], [-9, 58], [-5, 39], [-10, 34], [-3, 18], [-6, 14],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (const [x, y] of pts) shape.lineTo(x * 0.01, y * 0.01);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 2,
    steps: 1,
  });
  geo.computeVertexNormals();
  LEAFLET_GEO = geo;
  return geo;
}

// 7 leaflets fanned around the leaf base (centre longest, outer shortest).
const LEAFLETS = [
  { a: 0, s: 1 },
  { a: 26, s: 0.86 }, { a: -26, s: 0.86 },
  { a: 52, s: 0.64 }, { a: -52, s: 0.64 },
  { a: 78, s: 0.44 }, { a: -78, s: 0.44 },
];

// Whorls of leaves up the stalk: lower = bigger and more outstretched.
const WHORLS = [
  { y: 0.24, count: 3, az0: 20, tilt: 1.45, scale: 0.9 },
  { y: 0.4, count: 5, az0: 0, tilt: 1.05, scale: 0.66 },
  { y: 0.54, count: 3, az0: 40, tilt: 0.55, scale: 0.44 },
];

export default function ClayCannabis() {
  const geo = leafletGeo();
  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(CLAY.leaf),
        roughness: CLAY_ROUGH.waxy,
        metalness: 0,
        side: THREE.DoubleSide,
        envMapIntensity: 1,
      }),
    [],
  );
  const stemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(CLAY.stem),
        roughness: CLAY_ROUGH.clay,
        metalness: 0,
      }),
    [],
  );

  const leaves = useMemo(() => {
    const arr: { key: string; y: number; az: number; tilt: number; scale: number }[] = [];
    for (const w of WHORLS) {
      for (let i = 0; i < w.count; i++) {
        arr.push({
          key: `${w.y}-${i}`,
          y: w.y,
          az: (w.az0 + (i * 360) / w.count) * DEG,
          tilt: w.tilt,
          scale: w.scale,
        });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {/* central stalk */}
      <mesh position={[0, 0.28, 0]} material={stemMat} castShadow>
        <cylinderGeometry args={[0.013, 0.024, 0.56, 8]} />
      </mesh>

      {leaves.map((l) => (
        <group key={l.key} rotation={[0, l.az, 0]}>
          <group position={[0, l.y, 0.03]} rotation={[l.tilt, 0, 0]} scale={l.scale}>
            {LEAFLETS.map((lf, i) => (
              <mesh
                key={i}
                geometry={geo}
                material={leafMat}
                rotation={[0, 0, lf.a * DEG]}
                scale={[lf.s, lf.s, 1]}
                castShadow
              />
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}
