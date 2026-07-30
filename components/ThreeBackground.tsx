"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PARTICIPANT_COLORS } from "@/lib/colors";

/* ============================================================
 * Floating calendar shards drifting through concentric timezone
 * dials. Cursor magnetism, click ripples, and — on the landing
 * page — a scroll-driven arc that mirrors the copy beside it:
 *
 *   scattered shards  →  a week grid forms  →  one column of
 *   overlap lights up terracotta while the dials lock together
 *
 * which is the product's whole story told without words. On the
 * event page (`scrollScene={false}`) only the ambient behaviour
 * runs — a page you're working inside shouldn't restage itself
 * every time you scroll.
 * ============================================================ */

/* ---------- shared input state ---------- */

// Set once on window mousemove, read by every consumer.
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
  window.addEventListener("mousemove", handler, { passive: true });
  return () => window.removeEventListener("mousemove", handler);
}

// Raw scroll progress through the document, 0 → 1.
const scrollRef = { current: { raw: 0, smooth: 0 } };
function bindScroll() {
  if (typeof window === "undefined") return () => {};
  const read = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    scrollRef.current.raw = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  read();
  window.addEventListener("scroll", read, { passive: true });
  window.addEventListener("resize", read, { passive: true });
  return () => {
    window.removeEventListener("scroll", read);
    window.removeEventListener("resize", read);
  };
}

/* ---------- easing helpers ---------- */

/** Remap `x` from [a, b] onto [0, 1], clamped — one stage of the scroll arc. */
const seg = (x: number, a: number, b: number) => THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
/** Smoothstep, so stages ease in and out instead of tracking scroll linearly. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Smooths raw scroll into `scrollRef.current.smooth` once per frame, before any
 * consumer reads it. Mounted first inside <Scene> so it wins registration order.
 */
function ScrollDriver({ enabled }: { enabled: boolean }) {
  useFrame((_, delta) => {
    const target = enabled ? scrollRef.current.raw : 0;
    const s = scrollRef.current;
    s.smooth += (target - s.smooth) * Math.min(1, delta * 4.5);
  });
  return null;
}

/* ---------- camera ---------- */

/** Eases the camera in as the page scrolls, so the grid fills more of the frame. */
function ScrollCamera({ enabled }: { enabled: boolean }) {
  const camera = useThree(state => state.camera);
  useFrame((_, delta) => {
    if (!enabled) return;
    const p = scrollRef.current.smooth;
    const targetZ = 5 - 1.6 * smooth(seg(p, 0, 0.85));
    const targetY = -0.35 * smooth(seg(p, 0.2, 1));
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, delta * 3);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, delta * 3);
  });
  return null;
}

/**
 * Scales the dials + shards to the viewport.
 *
 * The assembled week grid is ~5.3 world units across. At the scrolled-in camera
 * distance that fits a landscape frustum comfortably, but on a phone (aspect
 * ~0.5) it would run off both edges and the "week" would never read as a week.
 */
function FitToViewport({ group }: { group: React.RefObject<THREE.Group> }) {
  const size = useThree(state => state.size);
  useEffect(() => {
    if (!group.current) return;
    const aspect = size.width / size.height;
    group.current.scale.setScalar(THREE.MathUtils.clamp(aspect / 1.55, 0.48, 1));
  }, [size, group]);
  return null;
}

/* ---------- cursor-tilt parallax for the whole scene ---------- */

function CursorParallax({
  group,
  intensity,
  scrollScene
}: {
  group: React.RefObject<THREE.Group>;
  intensity: number;
  scrollScene: boolean;
}) {
  useFrame((_, delta) => {
    if (!group.current) return;
    /* The tilt relaxes toward face-on as the grid forms — a week grid viewed
       off-axis is just noise. */
    const settle = scrollScene ? 1 - smooth(seg(scrollRef.current.smooth, 0.2, 0.6)) * 0.8 : 1;
    const tx = mouseRef.current.x * intensity * 0.55 * settle;
    const ty = mouseRef.current.y * intensity * 0.45 * settle;
    group.current.rotation.y += (tx - group.current.rotation.y) * delta * 1.2;
    group.current.rotation.x += (-ty - group.current.rotation.x) * delta * 1.2;
  });
  return null;
}

/* ---------- concentric timezone dials ---------- */

const RADII = [1.85, 2.25, 2.65] as const;
const ROT_SPEEDS = [0.04, -0.028, 0.018] as const; // opposed directions read as "out of sync"
const PHASES = [0, Math.PI / 6, Math.PI / 3] as const;

function TimezoneDials({ scrollScene }: { scrollScene: boolean }) {
  const outerRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Group | null)[]>([]);
  const circleMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const tickMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  // Pre-build circle line geometry + tick segments for each ring
  const rings = useMemo(() => {
    return RADII.map(radius => {
      const segs = 96;
      const circlePts = new Float32Array((segs + 1) * 3);
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        circlePts.set([Math.cos(a) * radius, Math.sin(a) * radius, 0], i * 3);
      }
      const circle = new THREE.BufferGeometry();
      circle.setAttribute("position", new THREE.BufferAttribute(circlePts, 3));

      // 24 tick marks — one per hour
      const tickPts = new Float32Array(24 * 6);
      for (let h = 0; h < 24; h++) {
        const a = (h / 24) * Math.PI * 2;
        const isMajor = h % 6 === 0;
        const inner = radius - (isMajor ? 0.1 : 0.05);
        const outer = radius + (isMajor ? 0.1 : 0.05);
        tickPts.set(
          [Math.cos(a) * inner, Math.sin(a) * inner, 0, Math.cos(a) * outer, Math.sin(a) * outer, 0],
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
    const p = scrollScene ? scrollRef.current.smooth : 0;

    /* Past the halfway mark the three dials stop drifting against each other and
       settle onto a shared phase — the "everyone's clocks agree" beat. */
    const align = smooth(seg(p, 0.5, 0.95));
    const emphasis = smooth(seg(p, 0.15, 0.8));

    if (outerRef.current) {
      const s = 1 + 0.22 * emphasis;
      outerRef.current.scale.setScalar(s);
      outerRef.current.position.z = -2.2 + 0.9 * emphasis;
    }

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const drifting = t * ROT_SPEEDS[i] + PHASES[i];
      ring.rotation.z = THREE.MathUtils.lerp(drifting, 0, align);
    });

    circleMats.current.forEach((m, i) => {
      if (m) m.opacity = (0.13 - i * 0.02) * (1 + 2.2 * emphasis);
    });
    tickMats.current.forEach((m, i) => {
      if (m) m.opacity = (0.22 - i * 0.04) * (1 + 1.6 * emphasis);
    });

    if (markerRef.current) {
      const mat = markerRef.current.material as THREE.LineBasicMaterial;
      // Heartbeat every ~3s, holding brighter once the rings have locked
      const pulse = 0.18 + 0.35 * Math.max(0, Math.sin(t * (Math.PI / 3)));
      mat.opacity = THREE.MathUtils.lerp(pulse, 0.85, align);
    }
  });

  return (
    <group ref={outerRef} position={[0, 0, -2.2]}>
      {rings.map((r, i) => (
        <group
          key={i}
          ref={el => {
            ringRefs.current[i] = el;
          }}
          rotation={[0, 0, PHASES[i]]}
        >
          <line>
            <primitive object={r.circle} attach="geometry" />
            <lineBasicMaterial
              ref={el => {
                circleMats.current[i] = el;
              }}
              color={0xd9876d}
              transparent
              opacity={0.13 - i * 0.02}
            />
          </line>
          <lineSegments>
            <primitive object={r.ticks} attach="geometry" />
            <lineBasicMaterial
              ref={el => {
                tickMats.current[i] = el;
              }}
              color={0xd8d0bf}
              transparent
              opacity={0.22 - i * 0.04}
            />
          </lineSegments>
        </group>
      ))}
      {/* Terracotta is reserved for moments of overlap, per the brand — so the
          alignment marker is the one place it appears in the dials. */}
      <lineSegments ref={markerRef}>
        <primitive object={markerGeom} attach="geometry" />
        <lineBasicMaterial color={0xd9876d} transparent opacity={0.35} />
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
}

/* The grid the shards resolve into: 7 columns (a week) by 4 rows. */
const GRID_COLS = 7;
const GRID_COL_GAP = 0.82;
const GRID_ROW_GAP = 0.66;
const GRID_CELL_W = 0.62;
const GRID_CELL_H = 0.42;
/** Column index that becomes the overlap column — the middle day of the week. */
const OVERLAP_COL = 3;

const ACCENT_COLOR = new THREE.Color(0xd9876d);

function Shard({
  data,
  groupRef,
  fillMat,
  edgeMat
}: {
  data: ShardData;
  groupRef: (g: THREE.Group | null) => void;
  fillMat: THREE.MeshBasicMaterial;
  edgeMat: THREE.LineBasicMaterial;
}) {
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(data.size[0], data.size[1]), [data.size]);
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(planeGeom), [planeGeom]);

  return (
    /* Initial transform matches frame one, so a single static render (reduced
       motion) shows a composed scene rather than every shard piled at origin. */
    <group ref={groupRef} position={data.basePos} rotation={data.baseRot}>
      <mesh geometry={planeGeom} material={fillMat} />
      <lineSegments geometry={edgesGeom} material={edgeMat} />
    </group>
  );
}

function CalendarShards({ count = 26, scrollScene }: { count?: number; scrollScene: boolean }) {
  // Convert palette CSS strings to numeric hex once
  const palette = useMemo(
    () =>
      PARTICIPANT_COLORS.map(c => parseInt(c.startsWith("#") ? c.slice(1) : c, 16)),
    []
  );

  const shards: ShardData[] = useMemo(() => {
    return Array.from({ length: count }, () => ({
      basePos: [
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 5.5,
        (Math.random() - 0.5) * 3.5 - 0.5
      ] as [number, number, number],
      baseRot: [
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.6
      ] as [number, number, number],
      size: [0.35 + Math.random() * 0.6, 0.22 + Math.random() * 0.35] as [number, number],
      color: palette[Math.floor(Math.random() * palette.length)],
      driftSpeed: 0.08 + Math.random() * 0.14,
      phase: Math.random() * Math.PI * 2
    }));
  }, [count, palette]);

  /* Materials are owned here rather than inside <Shard> so the frame loop can
     drive colour and opacity across the whole set in one pass. */
  const materials = useMemo(
    () =>
      shards.map(s => ({
        base: new THREE.Color(s.color),
        fill: new THREE.MeshBasicMaterial({
          color: s.color,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          depthWrite: false
        }),
        edge: new THREE.LineBasicMaterial({ color: s.color, transparent: true, opacity: 0.5 })
      })),
    [shards]
  );

  useEffect(() => {
    return () => {
      materials.forEach(m => {
        m.fill.dispose();
        m.edge.dispose();
      });
    };
  }, [materials]);

  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Ambient alignment cycle (no-scroll pages): ~14s, 4 shards stack, then part.
  const ALIGN_CYCLE = 14;
  const ALIGN_HOLD = 3.5;
  const ALIGN_SIZE = 4;

  useFrame((_, delta) => {
    const t = performance.now() * 0.001;
    const p = scrollScene ? scrollRef.current.smooth : 0;

    /* Two scroll stages: the grid assembling, then one column resolving into
       the overlap block. */
    const gridAmount = smooth(seg(p, 0.16, 0.55));
    const overlapAmount = smooth(seg(p, 0.6, 0.92));

    // --- ambient cycle, faded out once the scroll narrative takes over ---
    const cycleNum = Math.floor(t / ALIGN_CYCLE);
    const cyclePos = (t % ALIGN_CYCLE) / ALIGN_CYCLE;
    let ambientAlign = 0;
    const start = 0.35;
    const end = 0.35 + ALIGN_HOLD / ALIGN_CYCLE;
    if (cyclePos > start && cyclePos < end) {
      ambientAlign = Math.sin(((cyclePos - start) / (end - start)) * Math.PI); // 0 → 1 → 0
    }
    ambientAlign *= 1 - gridAmount;

    const startIdx = (cycleNum * 7) % count;
    const slotIndex = (i: number) => (i - startIdx + count) % count;
    const isAmbientAligning = (i: number) => slotIndex(i) < ALIGN_SIZE;

    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;

    // Row offsets for the overlap column, tightened as the block resolves
    let overlapRow = 0;

    groupRefs.current.forEach((g, i) => {
      if (!g) return;
      const s = shards[i];
      const mat = materials[i];

      /* ---- free-drift target ---- */
      let x = s.basePos[0] + Math.sin(t * s.driftSpeed + s.phase) * 0.35;
      let y = s.basePos[1] + Math.cos(t * s.driftSpeed * 0.7 + s.phase) * 0.25;
      let z = s.basePos[2];

      // Cursor magnetism — released as the grid takes shape
      const cdx = mouseX * 4.5 - x;
      const cdy = mouseY * 3.0 - y;
      const dist = Math.sqrt(cdx * cdx + cdy * cdy);
      const magnet = Math.max(0, 1 - dist / 2.4) * 0.55 * (1 - gridAmount);
      x += cdx * magnet;
      y += cdy * magnet;

      if (ambientAlign > 0 && isAmbientAligning(i)) {
        const slot = slotIndex(i);
        x = THREE.MathUtils.lerp(x, 0.6, ambientAlign * 0.75);
        y = THREE.MathUtils.lerp(y, (slot - (ALIGN_SIZE - 1) / 2) * 0.55, ambientAlign * 0.75);
      }

      /* ---- week-grid target ---- */
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const inOverlapCol = col === OVERLAP_COL;

      let gx = (col - (GRID_COLS - 1) / 2) * GRID_COL_GAP;
      let gy = (1.5 - row) * GRID_ROW_GAP;

      if (inOverlapCol) {
        // Condense the column into a single contiguous block of agreement
        gy = THREE.MathUtils.lerp(gy, (1.5 - overlapRow) * (GRID_CELL_H + 0.04), overlapAmount);
        overlapRow += 1;
      } else {
        // Everything else eases back and apart so the block reads as the subject
        gx = THREE.MathUtils.lerp(gx, gx * 1.18, overlapAmount);
      }

      x = THREE.MathUtils.lerp(x, gx, gridAmount);
      y = THREE.MathUtils.lerp(y, gy, gridAmount);
      z = THREE.MathUtils.lerp(z, inOverlapCol ? 0.25 * overlapAmount : -0.3 * overlapAmount, gridAmount);

      // Lerp position so cursor flicks and scroll jumps don't snap
      const k = Math.min(1, delta * 6);
      g.position.x += (x - g.position.x) * k;
      g.position.y += (y - g.position.y) * k;
      g.position.z += (z - g.position.z) * k;

      /* ---- rotation: drifting tilt flattening to face-on in the grid ---- */
      const driftRotX = s.baseRot[0] + Math.sin(t * 0.12 + s.phase) * 0.06;
      const driftRotY = s.baseRot[1] + Math.cos(t * 0.1 + s.phase) * 0.12;
      const driftRotZ =
        s.baseRot[2] + (isAmbientAligning(i) ? ambientAlign * 0.15 * (s.phase > Math.PI ? -1 : 1) : 0);
      g.rotation.x = THREE.MathUtils.lerp(driftRotX, 0, gridAmount);
      g.rotation.y = THREE.MathUtils.lerp(driftRotY, 0, gridAmount);
      g.rotation.z = THREE.MathUtils.lerp(driftRotZ, 0, gridAmount);

      /* ---- scale: random shard sizes normalise into uniform grid cells ---- */
      g.scale.x = THREE.MathUtils.lerp(1, GRID_CELL_W / s.size[0], gridAmount);
      g.scale.y = THREE.MathUtils.lerp(1, GRID_CELL_H / s.size[1], gridAmount);

      /* ---- colour + opacity ---- */
      if (inOverlapCol) {
        mat.fill.color.copy(mat.base).lerp(ACCENT_COLOR, overlapAmount);
        mat.edge.color.copy(mat.base).lerp(ACCENT_COLOR, overlapAmount);
        mat.fill.opacity = 0.16 + 0.06 * gridAmount + 0.26 * overlapAmount;
        mat.edge.opacity = 0.5 + 0.45 * overlapAmount;
      } else {
        mat.fill.color.copy(mat.base);
        mat.edge.color.copy(mat.base);
        mat.fill.opacity = 0.16 + 0.06 * gridAmount - 0.09 * overlapAmount;
        mat.edge.opacity = 0.5 - 0.3 * overlapAmount;
      }
    });
  });

  return (
    <group>
      {shards.map((s, i) => (
        <Shard
          key={i}
          data={s}
          fillMat={materials[i].fill}
          edgeMat={materials[i].edge}
          groupRef={el => {
            groupRefs.current[i] = el;
          }}
        />
      ))}
    </group>
  );
}

/* ---------- floating motes (ambient particles) ---------- */

function FloatingMotes({ scrollScene }: { scrollScene: boolean }) {
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
        color: 0xd8d0bf,
        size: 0.016,
        transparent: true,
        opacity: 0.28,
        sizeAttenuation: true
      }),
    []
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.018;
    // Drift the mote field past the camera as you scroll — cheap depth parallax
    if (scrollScene) ref.current.position.z = scrollRef.current.smooth * 2.2;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

/* ---------- click ripples (2D overlay) ----------
 * Soft expanding rings on click anywhere the user isn't interacting with UI.
 */
function ClickRipples() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Skip clicks inside interactive UI — the ripple is a "blank space" thing
      if (
        target?.closest('button, input, select, textarea, a, label, [role="button"], [role="dialog"]')
      ) {
        return;
      }
      const id = nextId++;
      setRipples(r => [...r, { id, x: e.clientX, y: e.clientY }]);
      timers.push(
        setTimeout(() => {
          setRipples(r => r.filter(rp => rp.id !== id));
        }, 1300)
      );
    };
    window.addEventListener("click", handler);
    return () => {
      window.removeEventListener("click", handler);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 2 }}>
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute block animate-ripple rounded-full border"
          style={{ left: r.x, top: r.y, borderColor: "rgba(217, 135, 109, 0.6)" }}
        />
      ))}
    </div>
  );
}

/* ---------- motion + visibility preferences ---------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

/* ---------- root ---------- */

function Scene({ scrollScene }: { scrollScene: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  return (
    <>
      {/* First, so the smoothed scroll value is fresh before anything reads it */}
      <ScrollDriver enabled={scrollScene} />
      <ScrollCamera enabled={scrollScene} />
      <CursorParallax group={groupRef} intensity={0.55} scrollScene={scrollScene} />
      <FitToViewport group={groupRef} />
      <group ref={groupRef}>
        <TimezoneDials scrollScene={scrollScene} />
        <CalendarShards scrollScene={scrollScene} />
      </group>
      <FloatingMotes scrollScene={scrollScene} />
    </>
  );
}

export default function ThreeBackground({ scrollScene = false }: { scrollScene?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const animate = !reducedMotion && pageVisible;

  useEffect(() => {
    if (reducedMotion) return;
    const unbindMouse = bindGlobalMouse();
    const unbindScroll = scrollScene ? bindScroll() : () => {};
    return () => {
      unbindMouse();
      unbindScroll();
    };
  }, [reducedMotion, scrollScene]);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ contain: "strict", zIndex: 1 }}>
        {/* "demand" renders a single composed frame and then stops — that's the
            reduced-motion presentation, and it's also what a backgrounded tab
            gets so an idle page isn't spinning the GPU. */}
        <Canvas
          frameloop={animate ? "always" : "demand"}
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.6} />
          <Scene scrollScene={scrollScene && !reducedMotion} />
        </Canvas>
      </div>
      {!reducedMotion && <ClickRipples />}
    </>
  );
}
