"use client";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { LucidePaintbrush } from "lucide-react";
import Link from "next/link";
import { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ShowRepo from "@/modules/dashboard/ShowRepo";
import { useState } from "react";
import { Empty } from "@/components/ui/empty";

const Dashboard = () => {
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser,
  );

  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div className="min-h-screen w-full relative">
      {/* PARENT CONTAINER */}
      <ResizablePanelGroup orientation="horizontal" className="w-full h-full">
        <ResizablePanel defaultSize={500} minSize={350} maxSize={600} className="bg-card">
          <div className="h-full p-6">
            <ShowRepo
              searchQuery={searchQuery}
              selectedRepo={selectedRepo!}
              setSelectedRepo={setSelectedRepo}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} className="min-h-screen">
          <div className="h-full p-6">
           <h1>hello</h1>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;
