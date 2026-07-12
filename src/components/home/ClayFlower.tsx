"use client";

import { CLAY, CLAY_ROUGH } from "@/lib/clay";

/**
 * Stylised clay flowering houseplants, one component per look the user can
 * pick. Built only from inline primitive meshes (cylinders/spheres/cones) in
 * the same conventions as the clay pots, so they render everywhere the pots
 * do. Each variant's base sits at y=0 and stands ~0.55-0.75 tall over the pot.
 */

export type FlowerVariant = "daisy" | "lily" | "orchid" | "violet";

const DEG = Math.PI / 180;

function Clay({ color, rough = CLAY_ROUGH.waxy }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0} envMapIntensity={0.9} />;
}

/** A leaf: a flattened sphere angled out from the base. */
function Leaf({
  angle,
  tilt = 40,
  length = 0.16,
  y = 0.05,
  color = CLAY.leaf,
}: {
  angle: number;
  tilt?: number;
  length?: number;
  y?: number;
  color?: string;
}) {
  const r = length * 0.55;
  return (
    <group rotation={[0, angle * DEG, 0]}>
      <mesh
        castShadow
        position={[r, y, 0]}
        rotation={[0, 0, -tilt * DEG]}
        scale={[1.9, 0.35, 0.9]}
      >
        <sphereGeometry args={[length * 0.55, 12, 10]} />
        <Clay color={color} />
      </mesh>
    </group>
  );
}

/** A daisy/gerbera head: a ring of petal spheres around a pollen centre. */
function DaisyHead({ petal, size = 1 }: { petal: string; size?: number }) {
  return (
    <group scale={size}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1]}
            rotation={[0, -a, 0]}
            scale={[1.8, 0.4, 0.9]}
          >
            <sphereGeometry args={[0.055, 10, 8]} />
            <Clay color={petal} />
          </mesh>
        );
      })}
      <mesh castShadow>
        <sphereGeometry args={[0.06, 14, 12]} />
        <Clay color="#e8a93c" rough={CLAY_ROUGH.clay} />
      </mesh>
    </group>
  );
}

/** A stem with an optional lean, capped by whatever head is passed in. */
function Stem({
  h,
  lean = 0,
  angle = 0,
  children,
}: {
  h: number;
  lean?: number;
  angle?: number;
  children: React.ReactNode;
}) {
  return (
    <group rotation={[0, angle * DEG, lean * DEG]}>
      <mesh castShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.014, 0.02, h, 8]} />
        <Clay color={CLAY.stem} rough={CLAY_ROUGH.clay} />
      </mesh>
      <group position={[0, h, 0]}>{children}</group>
    </group>
  );
}

/** Gerbera daisies: coral, gold and white heads at staggered heights. */
function Daisies() {
  return (
    <group>
      <Stem h={0.52} lean={-4}>
        <DaisyHead petal="#e8798a" />
      </Stem>
      <group position={[-0.11, 0, -0.04]}>
        <Stem h={0.4} lean={-14}>
          <DaisyHead petal="#f2c14e" size={0.85} />
        </Stem>
      </group>
      <group position={[0.12, 0, 0.05]}>
        <Stem h={0.34} lean={16}>
          <DaisyHead petal="#f4efe2" size={0.75} />
        </Stem>
      </group>
      {[10, 130, 250].map((a) => (
        <Leaf key={a} angle={a} />
      ))}
    </group>
  );
}

/** Peace lily: broad dark leaves + white teardrop spathes on tall stems. */
function PeaceLily() {
  const spathe = (
    <group>
      {/* the white hood: a cone leaning off the stem tip */}
      <mesh castShadow position={[0.02, 0.07, 0]} rotation={[0, 0, -18 * DEG]} scale={[0.75, 1, 0.55]}>
        <coneGeometry args={[0.075, 0.2, 12]} />
        <Clay color="#f6f3e8" />
      </mesh>
      {/* the spadix */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.016, 0.02, 0.11, 8]} />
        <Clay color="#e8d27a" rough={CLAY_ROUGH.clay} />
      </mesh>
    </group>
  );
  return (
    <group>
      <Stem h={0.58} lean={-3}>{spathe}</Stem>
      <group position={[0.1, 0, -0.06]}>
        <Stem h={0.44} lean={12} angle={40}>{spathe}</Stem>
      </group>
      {/* lush broad leaves all around */}
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <Leaf key={a} angle={a} tilt={34} length={0.24} y={0.09} color={CLAY.leafDeep} />
      ))}
      {[30, 150, 270].map((a) => (
        <Leaf key={a} angle={a} tilt={55} length={0.18} y={0.05} color={CLAY.leaf} />
      ))}
    </group>
  );
}

/** Orchid: one arching cane with a run of pink blooms and strappy leaves. */
function OrchidBloom({ size = 1 }: { size?: number }) {
  return (
    <group scale={size}>
      {[0, 72, 144, 216, 288].map((a) => (
        <mesh
          key={a}
          castShadow
          position={[Math.cos(a * DEG) * 0.05, 0, Math.sin(a * DEG) * 0.05]}
          rotation={[0, -a * DEG, 0]}
          scale={[1.6, 0.35, 0.9]}
        >
          <sphereGeometry args={[0.036, 10, 8]} />
          <Clay color="#e07bb2" />
        </mesh>
      ))}
      <mesh castShadow>
        <sphereGeometry args={[0.028, 10, 8]} />
        <Clay color="#8a3d6b" rough={CLAY_ROUGH.clay} />
      </mesh>
    </group>
  );
}

function Orchid() {
  // Blooms staggered along the top arc of a leaning cane.
  const blooms = [
    { y: 0.42, x: 0.03, s: 0.85 },
    { y: 0.52, x: 0.08, s: 1 },
    { y: 0.6, x: 0.15, s: 1 },
    { y: 0.65, x: 0.23, s: 0.9 },
  ];
  return (
    <group>
      {/* the cane: two straight segments reading as an arch */}
      <mesh castShadow position={[0.015, 0.24, 0]} rotation={[0, 0, -8 * DEG]}>
        <cylinderGeometry args={[0.012, 0.016, 0.48, 8]} />
        <Clay color={CLAY.stem} rough={CLAY_ROUGH.clay} />
      </mesh>
      <mesh castShadow position={[0.12, 0.55, 0]} rotation={[0, 0, -38 * DEG]}>
        <cylinderGeometry args={[0.009, 0.012, 0.3, 8]} />
        <Clay color={CLAY.stem} rough={CLAY_ROUGH.clay} />
      </mesh>
      {blooms.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          <OrchidBloom size={b.s} />
        </group>
      ))}
      {/* strappy basal leaves */}
      {[70, 200, 320].map((a) => (
        <Leaf key={a} angle={a} tilt={28} length={0.22} y={0.06} color={CLAY.leafDeep} />
      ))}
    </group>
  );
}

/** African violet: a low rosette of round leaves under purple blooms. */
function Violet() {
  return (
    <group>
      {/* rosette of rounded leaves */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Leaf key={a} angle={a} tilt={22} length={0.17} y={0.045} color={CLAY.leafDeep} />
      ))}
      {/* cluster of violet blooms just above the rosette */}
      {[
        [0, 0.19, 0, 1],
        [-0.08, 0.16, 0.04, 0.85],
        [0.08, 0.17, -0.03, 0.9],
        [0.02, 0.15, 0.08, 0.8],
        [-0.05, 0.15, -0.07, 0.8],
      ].map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]} scale={s}>
          {[0, 72, 144, 216, 288].map((a) => (
            <mesh
              key={a}
              castShadow
              position={[Math.cos(a * DEG) * 0.035, 0, Math.sin(a * DEG) * 0.035]}
              rotation={[0, -a * DEG, 0]}
              scale={[1.5, 0.4, 0.9]}
            >
              <sphereGeometry args={[0.028, 10, 8]} />
              <Clay color="#9a6fd0" />
            </mesh>
          ))}
          <mesh castShadow>
            <sphereGeometry args={[0.02, 8, 8]} />
            <Clay color="#f2c14e" rough={CLAY_ROUGH.clay} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const VARIANTS: Record<FlowerVariant, () => React.ReactElement> = {
  daisy: Daisies,
  lily: PeaceLily,
  orchid: Orchid,
  violet: Violet,
};

export default function ClayFlower({ variant = "daisy" }: { variant?: FlowerVariant }) {
  const Variant = VARIANTS[variant];
  return <Variant />;
}
