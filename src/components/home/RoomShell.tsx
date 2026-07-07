"use client";

import { RoundedBox } from "@react-three/drei";
import type { RoomKey } from "@/lib/home";

/**
 * The open-wall "doll-house cutaway" shell for one room: a floor plus a back
 * (-z) and left (-x) wall, no ceiling and no front/right walls so the camera
 * sees inside. Themed per room with a warm palette.
 */

type Tint = { floor: string; wallBack: string; wallLeft: string; window: string };

const TINTS: Record<RoomKey, Tint> = {
  living_room: { floor: "#b08863", wallBack: "#e7dcc6", wallLeft: "#d8cbb2", window: "#bfe3ec" },
  kitchen: { floor: "#c8b79a", wallBack: "#e9e3d6", wallLeft: "#dcd4c2", window: "#c7e6ee" },
  bedroom: { floor: "#a9846a", wallBack: "#d9d3e2", wallLeft: "#cbc4d6", window: "#c3dbe8" },
  bathroom: { floor: "#cdd6d6", wallBack: "#d3e4e6", wallLeft: "#c3d8da", window: "#cfeaf1" },
  balcony: { floor: "#b8a789", wallBack: "#a9d6c6", wallLeft: "#98c9b8", window: "#bfe6ef" },
};

const W = 3.2; // room footprint (x and z)
const WALL_H = 2.0;
const WALL_T = 0.12;

export default function RoomShell({ room }: { room: RoomKey }) {
  const t = TINTS[room];
  const half = W / 2;
  const isBalcony = room === "balcony";

  return (
    <group>
      {/* floor */}
      <RoundedBox
        args={[W, 0.14, W]}
        radius={0.04}
        smoothness={2}
        position={[0, -0.07, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={t.floor} roughness={0.85} />
      </RoundedBox>

      {/* rug — a soft accent circle */}
      <mesh position={[0, 0.005, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 32]} />
        <meshStandardMaterial color={isBalcony ? "#8fbfae" : "#6ee7a8"} transparent opacity={0.16} />
      </mesh>

      {/* back wall (-z). Balcony gets a low railing instead of a full wall. */}
      {isBalcony ? (
        <group position={[0, 0, -half]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[W, 0.08, WALL_T]} />
            <meshStandardMaterial color="#8a7a5f" roughness={0.8} />
          </mesh>
          {[-1.3, -0.65, 0, 0.65, 1.3].map((x) => (
            <mesh key={x} position={[x, 0.27, 0]}>
              <boxGeometry args={[0.06, 0.55, 0.06]} />
              <meshStandardMaterial color="#8a7a5f" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, WALL_H / 2 - 0.07, -half]} receiveShadow>
          <boxGeometry args={[W, WALL_H, WALL_T]} />
          <meshStandardMaterial color={t.wallBack} roughness={0.95} />
        </mesh>
      )}

      {/* left wall (-x) */}
      <mesh position={[-half, WALL_H / 2 - 0.07, 0]} receiveShadow>
        <boxGeometry args={[WALL_T, WALL_H, W]} />
        <meshStandardMaterial color={t.wallLeft} roughness={0.95} />
      </mesh>

      {/* window on the back wall (skip balcony — it's open air) */}
      {!isBalcony && (
        <mesh position={[0.55, 1.15, -half + WALL_T / 2 + 0.01]}>
          <planeGeometry args={[1.05, 0.85]} />
          <meshStandardMaterial
            color={t.window}
            emissive={t.window}
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
      )}
    </group>
  );
}
