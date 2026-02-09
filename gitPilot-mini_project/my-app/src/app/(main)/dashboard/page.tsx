"use client";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { LucidePaintbrush } from "lucide-react";
import Link from "next/link";
import { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

const Dashboard = () => {
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser,
  );
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      <div>
        <h1>Visit Agentic canvas...</h1>
        <Link href={`dashboard/${user?._id}/canvas`}>
          <Button variant={"default"}>
            Visit Agentic canvas <LucidePaintbrush />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
