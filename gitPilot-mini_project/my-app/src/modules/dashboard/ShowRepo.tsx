import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useRepositories } from "../actions";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LucideGitBranch, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Skeleton } from "@/components/ui/skeleton";

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

const ITEMS_PER_PAGE = 7;

const ShowRepo = ({
  searchQuery,
  selectedRepo,
  setSelectedRepo,
}: RepositoryListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: repositories,
    isLoading,
    isFetching,
    error,
  } = useRepositories(currentPage, ITEMS_PER_PAGE);

  const handleRepoClick = (repo: Repository) => {
    setSelectedRepo(repo.name);
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
                onClick={() => handleRepoClick(repo)}
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
                    <div className="min-w-0">
                      <p className="font-medium block capitalize text-sm truncate tracking-tight">
                        {repo.name}
                      </p>
                      {/* {repo.language && (
                        <span className="text-[10px] text-muted-foreground/60">{repo.language}</span>
                      )} */}
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
