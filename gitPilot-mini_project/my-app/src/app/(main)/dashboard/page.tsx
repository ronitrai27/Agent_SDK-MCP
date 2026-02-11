"use client";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import {
  LucideGitBranch,
  LucidePaintbrush,
  LucideUser,
  Search,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import RepoInfoPage from "@/modules/dashboard/RepoInfoPage";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser,
  );

  const connectedRepos = useQuery(api.repo.getAllConnectedRepo);
  const [selectedRepo, setSelectedRepo] = useState<{
    owner: string;
    repo: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div className="min-h-screen w-full relative">
      {/* PARENT CONTAINER */}
      <ResizablePanelGroup orientation="horizontal" className="w-full h-full">
        <ResizablePanel
          defaultSize={500}
          minSize={350}
          maxSize={600}
          className="bg-card"
        >
          <div className="h-full p-6">
            <div>
              <div className="relative flex items-center mb-6">
                <Search className="absolute left-3 top-2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  className="bg-white/5 border-white/10 pl-10 mb-4 focus:ring-1 focus:ring-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ShowRepo
              searchQuery={searchQuery}
              selectedRepo={selectedRepo?.repo || ""}
              setSelectedRepo={(repoData: any) => setSelectedRepo(repoData)}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} className="min-h-screen">
          {/* Top bar to show all connected repo names */}
          <div className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center px-6 gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-4">
              <LucideGitBranch className="size-4 text-primary" />
              <span className="text-sm font-medium text-white/50 capitalize ">
                Connected
              </span>
            </div>
            {connectedRepos === undefined ? (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-24 rounded-full bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              connectedRepos?.map((repo) => (
                <button
                  key={repo._id}
                  onClick={() =>
                    setSelectedRepo({
                      owner: repo.repoOwner,
                      repo: repo.repoName,
                    })
                  }
                  className={cn(
                    "px-4 py-1 rounded text-xs font-medium transition-all duration-300 whitespace-nowrap border flex items-center gap-2",
                    selectedRepo?.repo === repo.repoName
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/60 border-white/5 hover:border-white/20 hover:bg-white/10",
                  )}
                >
                  {repo.status === "indexing" && (
                    <div className="size-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  {repo.repoName}
                </button>
              ))
            )}
          </div>
          <div className="p-6 h-full w-full">
            <RepoInfoPage
              ownerName={selectedRepo?.owner}
              repoName={selectedRepo?.repo}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;
