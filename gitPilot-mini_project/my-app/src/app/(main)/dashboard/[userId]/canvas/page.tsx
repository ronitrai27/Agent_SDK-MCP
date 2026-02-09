"use client";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@clerk/clerk-react";
import TlCanvas from "@/modules/canvas/canvas";
const CanvasPage = () => {
  const { user, isLoaded } = useUser();
  const params = useParams();

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <Spinner className="size-10" />
        <p className="text-sm text-muted-foreground mt-2">Loading User...</p>
      </div>
    );
  }
  return (
    <div className="h-full w-full">
      <TlCanvas />
    </div>
  );
};

export default CanvasPage;
