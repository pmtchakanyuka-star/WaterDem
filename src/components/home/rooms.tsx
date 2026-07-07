"use client";

import { RoundedBox } from "@react-three/drei";
import type { RoomKey } from "@/lib/home";

/**
 * Low-poly furniture per room — a few charming meshes each, enough to read as
 * the space without taxing mobile GPUs. Positioned so the plant SLOTS in
 * lib/home.ts land on the surfaces (shelf, counter, nightstand, tub edge).
 */

function Shelf({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <RoundedBox args={[1.6, 0.08, 0.34]} radius={0.02} smoothness={2} position={[x, y, z]} castShadow>
      <meshStandardMaterial color="#9c7a55" roughness={0.7} />
    </RoundedBox>
  );
}

function LivingRoom() {
  return (
    <group>
      {/* sofa */}
      <group position={[0.55, 0, 0.75]}>
        <RoundedBox args={[1.5, 0.4, 0.7]} radius={0.08} smoothness={3} position={[0, 0.24, 0]} castShadow>
          <meshStandardMaterial color="#6f8f86" roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[1.5, 0.5, 0.18]} radius={0.08} smoothness={3} position={[0, 0.42, -0.28]} castShadow>
          <meshStandardMaterial color="#7d9c93" roughness={0.9} />
        </RoundedBox>
      </group>
      {/* coffee table */}
      <RoundedBox args={[0.7, 0.06, 0.5]} radius={0.02} smoothness={2} position={[0.95, 0.36, 0.45]} castShadow>
        <meshStandardMaterial color="#a9835c" roughness={0.6} />
      </RoundedBox>
      <Shelf x={-0.8} y={0.86} z={-0.95} />
    </group>
  );
}

function Kitchen() {
  return (
    <group>
      {/* base counter along the back wall */}
      <RoundedBox args={[2.6, 0.9, 0.5]} radius={0.03} smoothness={2} position={[-0.15, 0.45, -0.95]} castShadow>
        <meshStandardMaterial color="#dcd3c2" roughness={0.8} />
      </RoundedBox>
      {/* counter top */}
      <RoundedBox args={[2.7, 0.06, 0.54]} radius={0.02} smoothness={2} position={[-0.15, 0.94, -0.94]} castShadow>
        <meshStandardMaterial color="#8a7f6c" roughness={0.5} />
      </RoundedBox>
      {/* upper cabinets */}
      <RoundedBox args={[2.6, 0.5, 0.3]} radius={0.03} smoothness={2} position={[-0.15, 1.6, -1.05]} castShadow>
        <meshStandardMaterial color="#c8bda6" roughness={0.8} />
      </RoundedBox>
    </group>
  );
}

function Bedroom() {
  return (
    <group>
      {/* bed */}
      <group position={[0.5, 0, 0.55]}>
        <RoundedBox args={[1.7, 0.32, 1.5]} radius={0.05} smoothness={3} position={[0, 0.2, 0]} castShadow>
          <meshStandardMaterial color="#c6bcd6" roughness={0.95} />
        </RoundedBox>
        {/* pillows */}
        <RoundedBox args={[0.7, 0.14, 0.4]} radius={0.06} smoothness={3} position={[0, 0.42, -0.5]} castShadow>
          <meshStandardMaterial color="#eae6f2" roughness={1} />
        </RoundedBox>
        {/* headboard */}
        <RoundedBox args={[1.7, 0.5, 0.12]} radius={0.04} smoothness={2} position={[0, 0.42, -0.76]} castShadow>
          <meshStandardMaterial color="#8f83a6" roughness={0.9} />
        </RoundedBox>
      </group>
      {/* nightstand */}
      <RoundedBox args={[0.5, 0.5, 0.4]} radius={0.03} smoothness={2} position={[-1.2, 0.25, -0.85]} castShadow>
        <meshStandardMaterial color="#9c8aa8" roughness={0.85} />
      </RoundedBox>
    </group>
  );
}

function Bathroom() {
  return (
    <group>
      {/* tub */}
      <group position={[0.55, 0, -0.75]}>
        <RoundedBox args={[1.7, 0.55, 0.85]} radius={0.12} smoothness={4} position={[0, 0.3, 0]} castShadow>
          <meshStandardMaterial color="#eef4f4" roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[1.4, 0.06, 0.6]} />
          <meshStandardMaterial color="#bfe0e6" transparent opacity={0.7} roughness={0.2} />
        </mesh>
      </group>
      {/* bath mat */}
      <mesh position={[-0.6, 0.01, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial color="#9fd6c8" roughness={1} />
      </mesh>
    </group>
  );
}

function Balcony() {
  return (
    <group>
      {/* decking planks */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((z) => (
        <mesh key={z} position={[0, 0.01, z]}>
          <boxGeometry args={[3.0, 0.02, 0.5]} />
          <meshStandardMaterial color="#9c8663" roughness={0.9} />
        </mesh>
      ))}
      {/* planter box along the back rail */}
      <RoundedBox args={[2.6, 0.4, 0.35]} radius={0.03} smoothness={2} position={[0, 0.35, -0.9]} castShadow>
        <meshStandardMaterial color="#7d6a4c" roughness={0.9} />
      </RoundedBox>
      {/* a couple of outdoor chairs */}
      <RoundedBox args={[0.5, 0.4, 0.5]} radius={0.05} smoothness={2} position={[1.0, 0.22, 0.7]} castShadow>
        <meshStandardMaterial color="#c9b79a" roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

const FURNITURE: Record<RoomKey, () => React.ReactElement> = {
  living_room: LivingRoom,
  kitchen: Kitchen,
  bedroom: Bedroom,
  bathroom: Bathroom,
  balcony: Balcony,
};

export default function RoomFurniture({ room }: { room: RoomKey }) {
  const Furniture = FURNITURE[room];
  return <Furniture />;
}
