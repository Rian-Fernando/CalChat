"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PARTICIPANT_COLORS } from "@/lib/colors";

/* ============================================================
 * Theme: A + B — floating calendar shards drifting through
 * concentric timezone dials. Cursor magnetism, click ripples,
 * and a slow "alignment" cycle where a few shards stack into
 * a column (a wordless metaphor for "schedules locking in").
 * ============================================================ */

// Shared mouse state across components — set once on window mousemove.
const mouseRef = { current: { x: 0, y: 0, vx: 0, vy: 0, lastSet: 0 } };
function bindGlobalMouse() {
  if (typeof window === "undefined") return () => {};
  const handler = (e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    mouseRef.current.vx = x - mouseRef.current.x;
    mouseRef.current.vy = y - mouseRef.current.y;
    mouseRef.current.x = x;
    mouseRef.current.y = y;
    mouseRef.current.lastSet = performance.now();
  };
  window.addEventListener("mousemove", handler);
  return () => window.removeEventListener("mousemove", handler);
}

/* ---------- cursor-tilt parallax for the whole scene ---------- */

function CursorParallax({ group, intensity }: { group: React.RefObject<THREE.Group>; intensity: number }) {
  useFrame((_, delta) => {
    if (!group.current) return;
    const tx = mouseRef.current.x * intensity * 0.55;
    const ty = mouseRef.current.y * intensity * 0.45;
    group.current.rotation.y += (tx - group.current.rotation.y) * delta * 1.2;
    group.current.rotation.x += (-ty - group.current.rotation.x) * delta * 1.2;
  });
  return null;
}

/* ---------- concentric timezone dials ---------- */

function TimezoneDials() {
  const RADII = [1.85, 2.25, 2.65] as const;
  const ROT_SPEEDS = [0.04, -0.028, 0.018] as const; // alternate directions for the "against each other" feel
  const PHASES = [0, Math.PI / 6, Math.PI / 3] as const;

  const ringRefs = useRef<(THREE.Group | null)[]>([]);

  // Pre-build circle line geometry + tick segments for each ring
  const rings = useMemo(() => {
    return RADII.map(radius => {
      // Circle (line)
      const segs = 96;
      const circlePts = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        circlePts.set([Math.cos(a) * radius, Math.sin(a) * radius, 0], i * 3);
      }
      const circle = new THREE.BufferGeometry();
      circle.setAttribute("position", new THREE.BufferAttribute(circlePts, 3));

      // 24 tick marks
      const tickPts = new Float32Array(24 * 6);
      for (let h = 0; h < 24; h++) {
        const a = (h / 24) * Math.PI * 2;
        const isMajor = h % 6 === 0;
        const inner = radius - (isMajor ? 0.1 : 0.05);
        const outer = radius + (isMajor ? 0.1 : 0.05);
        tickPts.set(
          [
            Math.cos(a) * inner,
            Math.sin(a) * inner,
            0,
            Math.cos(a) * outer,
            Math.sin(a) * outer,
            0
          ],
          h * 6
        );
      }
      const ticks = new THREE.BufferGeometry();
      ticks.setAttribute("position", new THREE.BufferAttribute(tickPts, 3));

      return { radius, circle, ticks };
    });
  }, []);

  // Alignment marker — a vertical glowing line at the top that softly pulses
  const markerRef = useRef<THREE.LineSegments>(null);
  const markerGeom = useMemo(() => {
    const arr = new Float32Array([0, RADII[0] - 0.15, 0, 0, RADII[2] + 0.15, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame(() => {
    const t = performance.now() * 0.001;
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.z = t * ROT_SPEEDS[i] + PHASES[i];
    });
    if (markerRef.current) {
      const mat = markerRef.current.material as THREE.LineBasicMaterial;
      // pulses every ~3 seconds — a heartbeat-like "moment of alignment"
      mat.opacity = 0.18 + 0.35 * Math.max(0, Math.sin(t * (Math.PI / 3)));
    }
  });

  return (
    <group position={[0, 0, -2.2]}>
      {rings.map((r, i) => (
        <group key={i} ref={el => { ringRefs.current[i] = el; }}>
          <line>
            <primitive object={r.circle} attach="geometry" />
            <lineBasicMaterial color={0x9ae6b4} transparent opacity={0.13 - i * 0.02} />
          </line>
          <lineSegments>
            <primitive object={r.ticks} attach="geometry" />
            <lineBasicMaterial color={0xbac2d3} transparent opacity={0.22 - i * 0.04} />
          </lineSegments>
        </group>
      ))}
      {/* Alignment heartbeat at the top of the dials */}
      <lineSegments ref={markerRef}>
        <primitive object={markerGeom} attach="geometry" />
        <lineBasicMaterial color={0x9ae6b4} transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

/* ---------- floating calendar shards ---------- */

interface ShardData {
  basePos: [number, number, number];
  baseRot: [number, number, number];
  size: [number, number];
  color: number;
  driftSpeed: number;
  phase: number;
  hueIdx: number;
}

function Shard({ data, refSetter }: { data: ShardData; refSetter: (g: THREE.Group | null) => void }) {
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(data.size[0], data.size[1]), [data.size]);
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(planeGeom), [planeGeom]);

  const fillMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false
      }),
    [data.color]
  );
  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.5
      }),
    [data.color]
  );

  return (
    <group ref={refSetter}>
      <mesh geometry={planeGeom} material={fillMat} />
      <lineSegments geometry={edgesGeom} material={edgeMat} />
    </group>
  );
}

function CalendarShards({ count = 26 }: { count?: number }) {
  // Convert palette CSS strings to numeric hex once
  const palette = useMemo(
    () =>
      PARTICIPANT_COLORS.map(c => {
        const n = c.startsWith("#") ? c.slice(1) : c;
        return parseInt(n, 16);
      }),
    []
  );

  const shards: ShardData[] = useMemo(() => {
    return Array.from({ length: count }, () => {
      const hueIdx = Math.floor(Math.random() * palette.length);
      return {
        basePos: [
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 3.5 - 0.5
        ],
        baseRot: [
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.6
        ],
        size: [
          0.35 + Math.random() * 0.6,
          0.22 + Math.random() * 0.35
        ],
        color: palette[hueIdx],
        driftSpeed: 0.08 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
        hueIdx
      };
    });
  }, [count, palette]);

  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Pick which shards take part in each alignment cycle. Cycle is ~14s; 4 shards drift
  // toward a column, hold briefly, then drift back.
  const ALIGN_CYCLE = 14;
  const ALIGN_HOLD = 3.5;
  const ALIGN_SIZE = 4;

  useFrame((_, delta) => {
    const t = performance.now() * 0.001;
    const cycleNum = Math.floor(t / ALIGN_CYCLE);
    const cyclePos = (t % ALIGN_CYCLE) / ALIGN_CYCLE;

    // Smooth ease-in-out for the alignment window (centered in the cycle)
    let alignAmount = 0;
    const start = 0.35;
    const end = 0.35 + ALIGN_HOLD / ALIGN_CYCLE;
    if (cyclePos > start && cyclePos < end) {
      const local = (cyclePos - start) / (end - start);
      alignAmount = Math.sin(local * Math.PI); // 0 → 1 → 0
    }

    // Deterministic group of 4 shards picked per cycle
    const startIdx = (cycleNum * 7) % count;
    const isAligning = (i: number) => ((i - startIdx + count) % count) < ALIGN_SIZE;
    const slotIndex = (i: number) => (i - startIdx + count) % count;

    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;

    groupRefs.current.forEach((g, i) => {
      if (!g) return;
      const s = shards[i];

      // Gentle drift around base position
      const dx = Math.sin(t * s.driftSpeed + s.phase) * 0.35;
      const dy = Math.cos(t * s.driftSpeed * 0.7 + s.phase) * 0.25;
      let x = s.basePos[0] + dx;
      let y = s.basePos[1] + dy;
      const z = s.basePos[2];

      // Cursor magnetism — gentle pull when cursor is near in screen-space
      const cursorWorldX = mouseX * 4.5;
      const cursorWorldY = mouseY * 3.0;
      const cdx = cursorWorldX - x;
      const cdy = cursorWorldY - y;
      const dist = Math.sqrt(cdx * cdx + cdy * cdy);
      const magnet = Math.max(0, 1 - dist / 2.4) * 0.55;
      x += cdx * magnet;
      y += cdy * magnet;

      // Alignment: pull select shards into a column slot near center
      if (alignAmount > 0 && isAligning(i)) {
        const slot = slotIndex(i);
        const columnX = 0.6;
        const columnY = (slot - (ALIGN_SIZE - 1) / 2) * 0.55;
        x = THREE.MathUtils.lerp(x, columnX, alignAmount * 0.75);
        y = THREE.MathUtils.lerp(y, columnY, alignAmount * 0.75);
      }

      // Lerp position smoothly so cursor flicks don't snap
      g.position.x += (x - g.position.x) * Math.min(1, delta * 6);
      g.position.y += (y - g.position.y) * Math.min(1, delta * 6);
      g.position.z = z;

      // Subtle rotation drift
      g.rotation.x = s.baseRot[0] + Math.sin(t * 0.12 + s.phase) * 0.06;
      g.rotation.y = s.baseRot[1] + Math.cos(t * 0.1 + s.phase) * 0.12;
      g.rotation.z =
        s.baseRot[2] +
        (isAligning(i) ? alignAmount * 0.15 * (s.phase > Math.PI ? -1 : 1) : 0);
    });
  });

  return (
    <group>
      {shards.map((s, i) => (
        <Shard
          key={i}
          data={s}
          refSetter={el => {
            groupRefs.current[i] = el;
          }}
        />
      ))}
    </group>
  );
}

/* ---------- floating motes (ambient particles) ---------- */

function FloatingMotes() {
  const ref = useRef<THREE.Points>(null);

  const geom = useMemo(() => {
    const N = 140;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: 0x90cdf4,
        size: 0.016,
        transparent: true,
        opacity: 0.32,
        sizeAttenuation: true
      }),
    []
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.018;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

/* ---------- click ripples (2D overlay) ----------
 * Soft expanding rings on click anywhere the user isn't interacting with UI.
 * Lives in a sibling div over the canvas (z above canvas, still pointer-events-none).
 */
function ClickRipples() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    let nextId = 0;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Skip clicks inside interactive UI — let the ripple be a "blank space" thing
      if (
        target?.closest(
          'button, input, select, textarea, a, label, [role="button"], [role="dialog"]'
        )
      ) {
        return;
      }
      const id = nextId++;
      setRipples(r => [...r, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples(r => r.filter(rp => rp.id !== id));
      }, 1300);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 2 }}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute block animate-ripple rounded-full border"
          style={{
            left: r.x,
            top: r.y,
            borderColor: "rgba(154, 230, 180, 0.6)"
          }}
        />
      ))}
    </div>
  );
}

/* ---------- root ---------- */

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  return (
    <>
      <CursorParallax group={groupRef} intensity={0.55} />
      <group ref={groupRef}>
        <TimezoneDials />
        <CalendarShards />
      </group>
      <FloatingMotes />
    </>
  );
}

export default function ThreeBackground() {
  useEffect(() => bindGlobalMouse(), []);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ contain: "strict", zIndex: 1 }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <Scene />
        </Canvas>
      </div>
      <ClickRipples />
    </>
  );
}
