"use client";

import { Spinner } from "@/components/ui/spinner";
import { useRepositories } from "../actions";
import { cn } from "@/lib/utils";
import { LucideGitBranch, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RepositoryListProps {
  searchQuery: string;
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  owner: {
    login: string;
  };
}

const ShowRepo = ({
  searchQuery,
  selectedRepo,
  setSelectedRepo,
}: RepositoryListProps) => {
  const { data: repositories, isLoading, error } = useRepositories(1, 10);

  const handleRepoClick = (repo: Repository) => {
    setSelectedRepo(repo.name);
  };

  const filteredRepos =
    repositories?.filter((repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner className="size-7 mr-3" />
        <h2>Loading repositories...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg">
        Failed to load repositories. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-5 h-full  no-scrollbar">
      {filteredRepos.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No repositories found
        </p>
      ) : (
        filteredRepos.map((repo) => {
        //   const isConnected = storedRepo?.githubId === BigInt(repo.id);
        //   const isOtherConnected = !!storedRepo && !isConnected;

          return (
            <div
              key={repo.id}
              onClick={() => handleRepoClick(repo)}
              className={cn(
                "w-full flex flex-col space-y-2 items-center justify-between p-2.5 rounded-md border transition-all duration-200 group",
                selectedRepo === repo.name
                  ? "bg-white/20 text-white border-white"
                  : "bg-white/5 text-white border-white/5 hover:border-white/20 hover:bg-white/[0.07]",
                // isConnected && "border-green-500/50 bg-green-500/10",
              )}
            >
              <div className="flex w-full justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <LucideGitBranch
                    className={cn(
                      "w-5 h-5 shrink-0",
                      selectedRepo === repo.name
                        ? "text-white"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-medium block capitalize text-sm truncate">
                      {repo.name}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="default"
                  className="text-xs border-accent-foreground/10 shrink-0"
                >
                  <Star className="w-4 h-4" />
                  {repo.stargazers_count}
                </Badge>
              </div>

              {/* {isConnected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit text-[10px] mr-auto ml-5 text-green-400 hover:text-green-300 pointer-events-none gap-1"
                >
                  <Check className="w-3 h-3" /> Connected
                </Button>
              ) : (
                <Button
                  disabled={isOtherConnected || isConnecting}
                  variant={selectedRepo === repo.name ? "default" : "outline"}
                  size="sm"
                  className="w-fit cursor-pointer text-[10px] mr-auto ml-5"
                  onClick={(e) => handleConnect(e, repo)}
                >
                  {isConnecting && selectedRepo === repo.name ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {isOtherConnected ? "Connect " : "Connect"}
                </Button>
              )} */}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ShowRepo;
