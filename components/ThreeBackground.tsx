"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/* ---------- helpers ---------- */

function sphericalRandom(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2 * Math.PI;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
}

/* ---------- cursor parallax (interactivity) ----------
 * Smoothly drifts the whole scene group based on cursor position so the
 * scene feels reactive without the user "controlling" anything explicitly.
 */
function CursorParallax({ group }: { group: React.RefObject<THREE.Group> }) {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  useFrame((_, delta) => {
    if (!group.current) return;
    // ease toward target
    const tx = mouse.current.x * 0.22;
    const ty = mouse.current.y * 0.18;
    group.current.rotation.y += (tx - group.current.rotation.y * 0.5) * delta * 0.8;
    group.current.rotation.x += (-ty * 0.4 - group.current.rotation.x) * delta * 1.4;
  });
  return null;
}

/* ---------- globe (wireframe icosphere + city dots) ---------- */

function Globe() {
  const group = useRef<THREE.Group>(null);

  const wireGeom = useMemo(() => new THREE.IcosahedronGeometry(1.6, 2), []);
  const wireMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x9ae6b4,
        wireframe: true,
        transparent: true,
        opacity: 0.18
      }),
    []
  );

  // Sparse "city dots" on the sphere surface, fibonacci-distributed
  const dotGeom = useMemo(() => {
    const N = 220;
    const positions = new Float32Array(N * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      positions.set([x * 1.62, y * 1.62, z * 1.62], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  const dotMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: 0xbac2d3,
        size: 0.028,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
      }),
    []
  );

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={wireGeom} material={wireMat} />
      <points geometry={dotGeom} material={dotMat} />
    </group>
  );
}

/* ---------- arc network ----------
 * Several great-circle arcs across the globe, each one pulsing its opacity
 * out of phase. Reads as "connections across the world" — fits the timezone theme.
 */
function ArcNetwork() {
  const ARCS = 11;

  const arcs = useMemo(() => {
    const result: { points: Float32Array; phase: number; speed: number }[] = [];
    const sphereRadius = 1.62;
    for (let i = 0; i < ARCS; i++) {
      const a = sphericalRandom(sphereRadius);
      const b = sphericalRandom(sphereRadius);
      const angle = a.angleTo(b);
      const axis = new THREE.Vector3().crossVectors(a, b).normalize();
      const N = 48;
      const arr = new Float32Array((N + 1) * 3);
      for (let j = 0; j <= N; j++) {
        const t = j / N;
        const v = a.clone().applyAxisAngle(axis, angle * t);
        // bulge arc outward off the surface slightly
        const lift = Math.sin(t * Math.PI) * 0.18;
        v.normalize().multiplyScalar(sphereRadius + lift);
        arr.set([v.x, v.y, v.z], j * 3);
      }
      result.push({
        points: arr,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.4
      });
    }
    return result;
  }, []);

  const materials = useRef<THREE.LineBasicMaterial[]>([]);

  useFrame(() => {
    const t = performance.now() * 0.001;
    materials.current.forEach((mat, i) => {
      if (!mat) return;
      const { phase, speed } = arcs[i];
      mat.opacity = 0.06 + 0.32 * (Math.sin(t * speed + phase) * 0.5 + 0.5);
    });
  });

  return (
    <group>
      {arcs.map((arc, i) => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(arc.points, 3));
        return (
          <line key={i}>
            <primitive object={geom} attach="geometry" />
            <lineBasicMaterial
              ref={(m: THREE.LineBasicMaterial | null) => {
                if (m) materials.current[i] = m;
              }}
              attach="material"
              color={i % 3 === 0 ? 0x90cdf4 : 0x9ae6b4}
              transparent
              opacity={0.2}
            />
          </line>
        );
      })}
    </group>
  );
}

/* ---------- torus knot ----------
 * A wireframe (3,2)-torus knot floating off to the side — abstract math shape
 * for a slightly "demo-scene" feel. Slowly tumbles on two axes.
 */
function FloatingKnot() {
  const ref = useRef<THREE.Mesh>(null);

  const geom = useMemo(() => new THREE.TorusKnotGeometry(0.55, 0.04, 180, 12, 3, 2), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xfbd38d,
        wireframe: true,
        transparent: true,
        opacity: 0.22
      }),
    []
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.18;
    ref.current.rotation.y += delta * 0.12;
    // gentle bob
    const t = performance.now() * 0.0005;
    ref.current.position.y = Math.sin(t) * 0.06;
  });

  return <mesh ref={ref} position={[2.6, 1.2, -1.5]} geometry={geom} material={mat} />;
}

/* ---------- floating motes (ambient particles) ---------- */

function FloatingMotes() {
  const ref = useRef<THREE.Points>(null);

  const geom = useMemo(() => {
    const N = 180;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
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
        size: 0.018,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true
      }),
    []
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

/* ---------- swarm ----------
 * Particles that orbit a Lissajous-like 3D curve, creating a flowing ribbon
 * effect distinct from the static floating motes.
 */
function LissajousSwarm() {
  const ref = useRef<THREE.Points>(null);
  const N = 360;

  const geom = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: 0xd6bcfa,
        size: 0.022,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
      }),
    []
  );

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.0003;
    const attr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const u = (i / N) * Math.PI * 2 + t;
      // Lissajous parametric curve in 3D space, drifting
      arr[i * 3 + 0] = Math.sin(3 * u + t * 0.7) * 2.6;
      arr[i * 3 + 1] = Math.sin(2 * u + t * 1.1) * 1.4;
      arr[i * 3 + 2] = Math.cos(5 * u) * 1.1 - 0.5;
    }
    attr.needsUpdate = true;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

/* ---------- root ---------- */

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  return (
    <>
      <CursorParallax group={groupRef} />
      <group ref={groupRef}>
        <Globe />
        <ArcNetwork />
        <FloatingKnot />
        <LissajousSwarm />
      </group>
      <FloatingMotes />
    </>
  );
}

export default function ThreeBackground() {
  return (
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
  );
}
