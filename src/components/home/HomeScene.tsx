"use client";

import { Suspense, useEffect } from "react";
import { Canvas, invalidate } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import RoomShell from "@/components/home/RoomShell";
import RoomFurniture from "@/components/home/rooms";
import Plant3D from "@/components/home/Plant3D";
import { SLOTS, SLOTS_PER_ROOM, type RoomKey } from "@/lib/home";
import type { Plant } from "@/lib/types";

/**
 * The WebGL scene: warm lighting, soft contact shadow, orbit + pinch camera,
 * and one or two rooms side by side with their plants placed on slots.
 */

function offsetsFor(count: number): number[] {
  if (count <= 1) return [0];
  return [-1.85, 1.85];
}

export default function HomeScene({
  rooms,
  plants,
  weatherFactor,
  hoveredId,
  selectedId,
  reduceMotion,
  onHover,
  onSelect,
}: {
  rooms: RoomKey[];
  plants: Plant[];
  weatherFactor: number;
  hoveredId: string | null;
  selectedId: string | null;
  reduceMotion: boolean;
  onHover: (id: string | null) => void;
  onSelect: (plant: Plant) => void;
}) {
  const offsets = offsetsFor(rooms.length);

  // Motion users get a continuous loop so plants breathe; reduced-motion users
  // get on-demand rendering (kicked when state changes) with static plants.
  useEffect(() => {
    invalidate();
  }, [hoveredId, selectedId, plants, rooms, weatherFactor]);

  return (
    <Canvas
      shadows
      frameloop={reduceMotion ? "demand" : "always"}
      dpr={[1, 1.75]}
      camera={{ position: [7, 5.5, 7], fov: 32 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={["#081c0e"]} />
      <fog attach="fog" args={["#081c0e", 15, 28]} />

      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#fff4e0", "#1c2a1b", 0.55]} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* a soft cool fill from the opposite side to round out the forms */}
      <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#cfe8ff" />

      {/* Procedural environment (no external HDR) — gives surfaces real
          reflections so glazed pots and floors read as glossy, not flat. */}
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 5, 2]} scale={[8, 8, 1]} color="#fff3dd" />
        <Lightformer intensity={0.9} position={[-4, 2, 3]} scale={[3, 6, 1]} color="#eaf6ff" />
        <Lightformer intensity={0.7} position={[4, 1, -3]} scale={[4, 4, 1]} color="#dff5e6" />
      </Environment>

      {rooms.map((room, i) => (
        <group key={room} position={[offsets[i], 0, 0]}>
          <RoomShell room={room} />
          <RoomFurniture room={room} />
        </group>
      ))}

      {/* Plants load a shared GLB — suspend just this part so the rooms and
          lighting show immediately while the models stream in. */}
      <Suspense fallback={null}>
        {rooms.map((room, i) => {
          const roomPlants = plants
            .filter((p) => p.room === room)
            .slice(0, SLOTS_PER_ROOM);
          return (
            <group key={room} position={[offsets[i], 0, 0]}>
              {roomPlants.map((plant, slot) => (
                <Plant3D
                  key={plant.id}
                  plant={plant}
                  weatherFactor={weatherFactor}
                  position={SLOTS[room][slot]}
                  hovered={hoveredId === plant.id}
                  selected={selectedId === plant.id}
                  reduceMotion={reduceMotion}
                  onHover={onHover}
                  onSelect={onSelect}
                />
              ))}
            </group>
          );
        })}
      </Suspense>

      <ContactShadows
        position={[0, -0.02, 0]}
        opacity={0.35}
        scale={16}
        blur={2.6}
        far={4}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={16}
        minPolarAngle={0.15}
        maxPolarAngle={1.35}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}
