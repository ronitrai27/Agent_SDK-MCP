"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense } from "react";

function HumanModel() {
  const { scene } = useGLTF("/model/human.glb");
  return <primitive object={scene} scale={1.5} />;
}

export default function HumanViewer() {
  return (
    <div style={{ height: "90vh" }} className="cursor-move border bg-black">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={1} />

        <Suspense fallback={null}>
          <HumanModel />
          <Environment preset="studio" />
        </Suspense>

        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  );
}

