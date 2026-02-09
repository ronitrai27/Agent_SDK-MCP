"use client";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function TlCanvas() {
  // AI agents — Give language models direct access to read and manipulate the canvas through the editor APIs
  return (
    <div className="h-screen overflow-hidden p-4 bg-black/20     relative">
      <Tldraw />
    </div>
  );
}
