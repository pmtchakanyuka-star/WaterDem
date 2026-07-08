"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { skyTexture, tileTexture, woodTexture } from "@/lib/proceduralTextures";
import type { RoomKey } from "@/lib/home";

/**
 * The open-wall "doll-house cutaway" shell for one room: a textured floor plus
 * a back (-z) and left (-x) wall with skirting, no ceiling and no front/right
 * walls so the camera sees inside. A daylight window glows on the back wall.
 * Floors use procedural wood/tile so surfaces read as real materials.
 */

type Tint = {
  floor: string;
  grout?: string;
  surface: "wood" | "tile";
  floorRough: number;
  wallBack: string;
  wallLeft: string;
  skirting: string;
};

const TINTS: Record<RoomKey, Tint> = {
  living_room: { floor: "#a67f57", surface: "wood", floorRough: 0.4, wallBack: "#e7dcc6", wallLeft: "#d8cbb2", skirting: "#f2ead8" },
  kitchen: { floor: "#d7cdbb", grout: "#b7ad99", surface: "tile", floorRough: 0.2, wallBack: "#e9e3d6", wallLeft: "#dcd4c2", skirting: "#f2ecdd" },
  bedroom: { floor: "#9c7a5e", surface: "wood", floorRough: 0.44, wallBack: "#d9d3e2", wallLeft: "#cbc4d6", skirting: "#ece7f1" },
  bathroom: { floor: "#d3dedd", grout: "#a9b6b5", surface: "tile", floorRough: 0.14, wallBack: "#d3e4e6", wallLeft: "#c3d8da", skirting: "#e6f0f0" },
  balcony: { floor: "#9c8663", surface: "wood", floorRough: 0.6, wallBack: "#a9d6c6", wallLeft: "#98c9b8", skirting: "#8a7a5f" },
};

const W = 3.2; // room footprint (x and z)
const WALL_H = 2.0;
const WALL_T = 0.12;

export default function RoomShell({ room }: { room: RoomKey }) {
  const t = TINTS[room];
  const half = W / 2;
  const isBalcony = room === "balcony";

  const floorTex = useMemo(
    () =>
      t.surface === "wood"
        ? woodTexture(t.floor, isBalcony ? 3 : 2.5)
        : tileTexture(t.floor, t.grout, 3),
    [t.surface, t.floor, t.grout, isBalcony],
  );
  const sky = useMemo(() => skyTexture(), []);

  return (
    <group>
      {/* textured floor — wood planks or ceramic tile */}
      <RoundedBox
        args={[W, 0.14, W]}
        radius={0.04}
        smoothness={2}
        position={[0, -0.07, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={floorTex ?? undefined}
          color={floorTex ? "#ffffff" : t.floor}
          roughness={t.floorRough}
          metalness={0.08}
          envMapIntensity={1.1}
        />
      </RoundedBox>

      {/* soft rug accent (indoor rooms only) */}
      {!isBalcony && (
        <mesh position={[0, 0.006, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 48]} />
          <meshStandardMaterial color="#6ee7a8" roughness={1} transparent opacity={0.12} />
        </mesh>
      )}

      {/* back wall (-z). Balcony gets a low railing instead of a full wall. */}
      {isBalcony ? (
        <group position={[0, 0, -half]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[W, 0.08, WALL_T]} />
            <meshStandardMaterial color="#8a7a5f" roughness={0.7} metalness={0.1} />
          </mesh>
          {[-1.3, -0.65, 0, 0.65, 1.3].map((x) => (
            <mesh key={x} position={[x, 0.27, 0]} castShadow>
              <boxGeometry args={[0.06, 0.55, 0.06]} />
              <meshStandardMaterial color="#8a7a5f" roughness={0.7} metalness={0.1} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, WALL_H / 2 - 0.07, -half]} receiveShadow>
          <boxGeometry args={[W, WALL_H, WALL_T]} />
          <meshStandardMaterial color={t.wallBack} roughness={0.92} envMapIntensity={0.3} />
        </mesh>
      )}

      {/* left wall (-x) */}
      <mesh position={[-half, WALL_H / 2 - 0.07, 0]} receiveShadow>
        <boxGeometry args={[WALL_T, WALL_H, W]} />
        <meshStandardMaterial color={t.wallLeft} roughness={0.92} envMapIntensity={0.3} />
      </mesh>

      {/* skirting boards where walls meet the floor (grounds the room) */}
      {!isBalcony && (
        <>
          <mesh position={[0, 0.06, -half + WALL_T / 2 + 0.02]}>
            <boxGeometry args={[W, 0.12, 0.03]} />
            <meshStandardMaterial color={t.skirting} roughness={0.6} metalness={0.05} />
          </mesh>
          <mesh position={[-half + WALL_T / 2 + 0.02, 0.06, 0]}>
            <boxGeometry args={[0.03, 0.12, W]} />
            <meshStandardMaterial color={t.skirting} roughness={0.6} metalness={0.05} />
          </mesh>
        </>
      )}

      {/* window on the back wall (skip balcony — it's open air) */}
      {!isBalcony && (
        <group position={[0.55, 1.15, -half + WALL_T / 2 + 0.015]}>
          {/* recessed frame */}
          <mesh position={[0, 0, -0.01]} castShadow>
            <boxGeometry args={[1.24, 1.04, 0.05]} />
            <meshStandardMaterial color="#f3ecdb" roughness={0.6} metalness={0.05} />
          </mesh>
          {/* daylight glass */}
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[1.05, 0.85]} />
            <meshStandardMaterial
              map={sky ?? undefined}
              emissive="#ffffff"
              emissiveMap={sky ?? undefined}
              emissiveIntensity={0.75}
              color={sky ? "#ffffff" : "#cfe8ee"}
              roughness={0.12}
              metalness={0.1}
              envMapIntensity={1.2}
            />
          </mesh>
          {/* muntin bars */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.028, 0.85, 0.012]} />
            <meshStandardMaterial color="#f3ecdb" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.05, 0.028, 0.012]} />
            <meshStandardMaterial color="#f3ecdb" roughness={0.6} />
          </mesh>
          {/* sill */}
          <mesh position={[0, -0.56, 0.05]} castShadow>
            <boxGeometry args={[1.34, 0.06, 0.14]} />
            <meshStandardMaterial color="#f3ecdb" roughness={0.55} metalness={0.05} />
          </mesh>
        </group>
      )}
    </group>
  );
}
