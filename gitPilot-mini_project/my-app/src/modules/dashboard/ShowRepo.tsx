import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useRepositories } from "../actions";
import { cn } from "@/lib/utils";
import { LucideGitBranch, LucidePlus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConnectRepo } from ".";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface RepositoryListProps {
  searchQuery: string;
  selectedRepo: string;
  setSelectedRepo: (data: { owner: string; repo: string }) => void;
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

const ITEMS_PER_PAGE = 7;

const ShowRepo = ({
  searchQuery,
  selectedRepo,
  setSelectedRepo,
}: RepositoryListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isConnecting, setIsConnecting] = useState<number | null>(null);
  const connectRepository = useMutation(api.repo.ConnectRepository);
  const {
    data: repositories,
    isLoading,
    isFetching,
    error,
  } = useRepositories(currentPage, ITEMS_PER_PAGE);

  const handleConnect = async (repo: Repository) => {
    const toastId = toast.loading(`Connecting ${repo.name}...`);
    try {
      setIsConnecting(repo.id);
      setSelectedRepo({ owner: repo.owner.login, repo: repo.name });

      // database using Convex mutation
      await connectRepository({
        githubId: BigInt(repo.id) as any,
        name: repo.name,
        owner: repo.owner.login,
        fullName: repo.full_name,
        url: repo.html_url,
      });

      // Trigger server-side indexing and fetch initial data
      const res = await ConnectRepo({
        owner: repo.owner.login,
        repo: repo.name,
        githubId: repo.id,
        fullName: repo.full_name,
        url: repo.html_url,
      });

      if (res.success) {
        toast.success(`Repository ${repo.name} connected successfully!`, {
          id: toastId,
        });
      }
    } catch (err) {
      toast.error("Failed to connect repository", { id: toastId });
      console.error(err);
    } finally {
      setIsConnecting(null);
    }
  };

  const filteredRepos =
    repositories?.filter((repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const handlePageChange = (page: number) => {
    if (page < 1) return;
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-full p-2.5 rounded-lg border border-white/5 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-md bg-white/5" />
                <Skeleton className="h-4 w-32 rounded bg-white/5" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        <p className="font-semibold mb-1">Error</p>
        Failed to load repositories. Please ensure your GitHub token is valid.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full  pb-10">
      {/* Scrollable Repo List */}
      <div className="flex-1">
        <div
          className={cn(
            "space-y-4 transition-opacity duration-200",
            isFetching ? "opacity-50 pointer-events-none" : "opacity-100",
          )}
        >
          {filteredRepos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LucideGitBranch className="size-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">
                No repositories found
              </p>
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={() =>
                  setSelectedRepo({ owner: repo.owner.login, repo: repo.name })
                }
                className={cn(
                  "w-full flex flex-col space-y-3 items-center justify-between p-2.5 rounded-lg border transition-all duration-300 group cursor-pointer",
                  selectedRepo === repo.name
                    ? "bg-white/10 text-white border-white/30 shadow-lg shadow-black/20"
                    : "bg-white/[0.03] text-white/70 border-white/5 hover:border-white/10 hover:bg-white/[0.05]",
                )}
              >
                <div className="flex w-full justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        selectedRepo === repo.name
                          ? "bg-white/10"
                          : "bg-white/5",
                      )}
                    >
                      <LucideGitBranch
                        className={cn(
                          "w-4 h-4",
                          selectedRepo === repo.name
                            ? "text-white"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <p className="font-medium block capitalize text-sm truncate tracking-tight">
                        {repo.name}
                      </p>
                      <Button
                        disabled={isConnecting === repo.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(repo);
                        }}
                        className="h-fit py-0.5 px-2 text-[10px] bg-primary/10 border border-primary/30 text-white flex items-center gap-1 shrink-0 hover:bg-primary/20"
                      >
                        <>
                          Connect <LucidePlus className="w-4 h-4" />
                        </>
                      </Button>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="h-fit py-0.5 px-2 text-[10px] bg-primary text-white flex items-center gap-1 shrink-0"
                  >
                    <Star className="w-3 h-3 text-white" />
                    {repo.stargazers_count}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {filteredRepos.length > 0 && (
        <div className="pt-6 border-t mt-auto">
          <Pagination>
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={cn(
                    "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer transition-all",
                    currentPage === 1 && "pointer-events-none opacity-30",
                  )}
                />
              </PaginationItem>

              <PaginationItem>
                <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-xs font-medium min-w-[32px] text-center">
                  {currentPage}
                </div>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={cn(
                    "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer transition-all",
                    filteredRepos.length < ITEMS_PER_PAGE &&
                      "pointer-events-none opacity-30",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-[10px] text-center text-muted-foreground/40 mt-3 italic">
            Displaying {filteredRepos.length} results
          </p>
        </div>
      )}
    </div>
  );
};

export default ShowRepo;
