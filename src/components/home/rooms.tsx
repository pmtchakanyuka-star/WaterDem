"use client";

import { RoundedBox } from "@react-three/drei";
import { CLAY, CLAY_ROUGH } from "@/lib/clay";
import type { RoomKey } from "@/lib/home";

/**
 * Low-poly furniture per room in the approved soft-clay style — rounded forms,
 * a warm rustic palette (terracotta, honey wood, teal accents on cream) and a
 * gentle matte-clay sheen. Positioned so the plant SLOTS in lib/home.ts land on
 * the surfaces (shelf, counter, nightstand, tub edge).
 */

function clay(color: string, rough: number = CLAY_ROUGH.clay) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} envMapIntensity={0.7} />;
}

function Shelf({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <RoundedBox args={[1.6, 0.08, 0.34]} radius={0.02} smoothness={2} position={[x, y, z]} castShadow>
      {clay(CLAY.wood)}
    </RoundedBox>
  );
}

function LivingRoom() {
  return (
    <group>
      {/* sofa */}
      <group position={[0.55, 0, 0.75]}>
        <RoundedBox args={[1.5, 0.4, 0.7]} radius={0.12} smoothness={4} position={[0, 0.24, 0]} castShadow>
          {clay(CLAY.terracotta)}
        </RoundedBox>
        <RoundedBox args={[1.5, 0.5, 0.18]} radius={0.12} smoothness={4} position={[0, 0.42, -0.28]} castShadow>
          {clay(CLAY.terracottaSoft)}
        </RoundedBox>
        {/* teal accent cushion */}
        <RoundedBox args={[0.34, 0.26, 0.28]} radius={0.08} smoothness={4} position={[-0.42, 0.5, -0.12]} castShadow>
          {clay(CLAY.teal)}
        </RoundedBox>
      </group>
      {/* coffee table — honey wood, on the rug beside the sofa's left arm */}
      <RoundedBox args={[0.7, 0.06, 0.5]} radius={0.03} smoothness={3} position={[-0.7, 0.36, 0.3]} castShadow>
        {clay(CLAY.wood, CLAY_ROUGH.waxy)}
      </RoundedBox>
      <Shelf x={-0.8} y={0.86} z={-0.95} />
    </group>
  );
}

function Kitchen() {
  return (
    <group>
      {/* base counter along the back wall */}
      <RoundedBox args={[2.6, 0.9, 0.5]} radius={0.05} smoothness={3} position={[-0.15, 0.45, -0.95]} castShadow>
        {clay(CLAY.creamSoft)}
      </RoundedBox>
      {/* counter top — honey wood */}
      <RoundedBox args={[2.7, 0.06, 0.54]} radius={0.02} smoothness={3} position={[-0.15, 0.94, -0.94]} castShadow>
        {clay(CLAY.woodDeep, CLAY_ROUGH.waxy)}
      </RoundedBox>
      {/* upper cabinets — snug against the back wall, left of the window, so
          counter plants have headroom and the daylight stays visible */}
      <RoundedBox args={[1.3, 0.5, 0.3]} radius={0.05} smoothness={3} position={[-0.8, 1.6, -1.36]} castShadow>
        {clay(CLAY.teal)}
      </RoundedBox>
    </group>
  );
}

function Bedroom() {
  return (
    <group>
      {/* bed */}
      <group position={[0.5, 0, 0.55]}>
        <RoundedBox args={[1.7, 0.32, 1.5]} radius={0.08} smoothness={4} position={[0, 0.2, 0]} castShadow>
          {clay(CLAY.creamSoft, CLAY_ROUGH.matte)}
        </RoundedBox>
        {/* pillows */}
        <RoundedBox args={[0.7, 0.14, 0.4]} radius={0.07} smoothness={4} position={[0, 0.42, -0.5]} castShadow>
          {clay(CLAY.cream, CLAY_ROUGH.matte)}
        </RoundedBox>
        {/* headboard */}
        <RoundedBox args={[1.7, 0.5, 0.12]} radius={0.06} smoothness={3} position={[0, 0.42, -0.76]} castShadow>
          {clay(CLAY.terracottaSoft)}
        </RoundedBox>
      </group>
      {/* nightstand */}
      <RoundedBox args={[0.5, 0.5, 0.4]} radius={0.04} smoothness={3} position={[-1.2, 0.25, -0.85]} castShadow>
        {clay(CLAY.wood)}
      </RoundedBox>
    </group>
  );
}

function Bathroom() {
  return (
    <group>
      {/* tub */}
      <group position={[0.55, 0, -0.75]}>
        <RoundedBox args={[1.7, 0.55, 0.85]} radius={0.16} smoothness={4} position={[0, 0.3, 0]} castShadow>
          {clay(CLAY.creamSoft, CLAY_ROUGH.waxy)}
        </RoundedBox>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[1.4, 0.06, 0.6]} />
          <meshStandardMaterial color={CLAY.tealSoft} transparent opacity={0.7} roughness={0.25} metalness={0} envMapIntensity={1} />
        </mesh>
      </group>
      {/* bath mat */}
      <mesh position={[-0.6, 0.01, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.6]} />
        <meshStandardMaterial color={CLAY.teal} roughness={0.9} />
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
          <meshStandardMaterial color={CLAY.wood} roughness={CLAY_ROUGH.clay} metalness={0} envMapIntensity={0.6} />
        </mesh>
      ))}
      {/* planter box along the back rail */}
      <RoundedBox args={[2.6, 0.4, 0.35]} radius={0.04} smoothness={3} position={[0, 0.35, -0.9]} castShadow>
        {clay(CLAY.terracotta)}
      </RoundedBox>
      {/* a couple of outdoor chairs */}
      <RoundedBox args={[0.5, 0.4, 0.5]} radius={0.08} smoothness={3} position={[1.0, 0.22, 0.7]} castShadow>
        {clay(CLAY.teal)}
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
