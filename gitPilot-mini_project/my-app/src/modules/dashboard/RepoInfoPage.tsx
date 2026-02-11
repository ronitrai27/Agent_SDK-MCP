import React from "react";
import Lottie from "lottie-react";
import emptyGit from "@/animation/empty-git.json";
import { useRepoHealthData, useRepoLanguages } from "./queries";
import {
  GitPullRequest,
  MessageSquare,
  Clock,
  Activity,
  Globe,
  Code2,
  CheckCircle2,
  CircleDot,
  Code,
  LucideLoader,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const RepoInfoPage = ({
  ownerName,
  repoName,
}: {
  ownerName?: string;
  repoName?: string;
}) => {
  const repoDetails = useQuery(api.repo.getRepoByOwnerAndName, {
    owner: ownerName || "",
    name: repoName || "",
  });
  const repoId = repoDetails?._id;
  const { data: health, isLoading: loadingHealth } = useRepoHealthData(
    ownerName || "",
    repoName || "",
  );
  const { data: languages, isLoading: loadingLanguages } = useRepoLanguages(
    ownerName || "",
    repoName || "",
  );

  if (!ownerName && !repoName) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 -mt-16">
        <div className="size-64 opacity-80">
          <Lottie animationData={emptyGit} loop={true} />
        </div>
        <p className="text-muted-foreground text-xl italic font-medium">
          Select a repository to view its details
        </p>
      </div>
    );
  }

  const isLoading = loadingHealth || loadingLanguages;

  return (
    <div className="h-full w-full flex flex-col gap-6 p-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            <Globe className="size-8 text-primary" />
            {repoName}
            <span className="text-muted-foreground font-normal text-2xl">
              /
            </span>
            <span className="text-muted-foreground font-medium text-2xl">
              {ownerName}
            </span>
          </h1>

          <div className="flex items-center gap-6">
            {repoId ? (
              <Link href={`/dashboard/${repoId}/review`}>
                <Button size="sm" className="cursor-pointer">
                  Code Sentinel <Code />
                </Button>
              </Link>
            ) : (
              <Button size="sm" className="cursor-not-allowed">
                Loading <LucideLoader className="animate-spin" />
              </Button>
            )}
            <Button size="sm" className="cursor-pointer">PM agent</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-36">
        {/* Rapid Overview Cards */}
        <StatCard
          title="Open Issues"
          value={health?.openIssuesCount}
          icon={<CircleDot className="text-red-400" />}
          loading={isLoading}
        />
        <StatCard
          title="PR Merge Rate"
          value={`${health?.prMergeRate}%`}
          icon={<GitPullRequest className="text-purple-400" />}
          loading={isLoading}
          subtext={`${health?.mergedPRs} merged of ${health?.totalPRs}`}
        />
        <StatCard
          title="Commits (60d)"
          value={health?.commitsLast60Days}
          icon={<Activity className="text-emerald-400" />}
          loading={isLoading}
        />
        <Card className="h-36 w-full bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden">
          <Clock className="absolute top-3 right-3 text-amber-400 opacity-40" />

          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Last Active
            </CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-24 bg-white/5" />
            ) : (
              <div className="text-lg capitalize font-medium text-white leading-tight">
                {health?.lastCommitDate
                  ? formatDistanceToNow(new Date(health.lastCommitDate), {
                      addSuffix: true,
                    })
                  : "N/A"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language Distribution */}
        <Card className="lg:col-span-2 bg-white/[0.02] border-white/5 backdrop-blur-sm overflow-hidden group hover:border-white/10 transition-colors">
          <CardHeader className="border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-lg flex items-center gap-2">
              <Code2 className="size-5 text-primary" />
              Language Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex h-3 w-full rounded-full overflow-hidden bg-white/5">
                  {languages?.map((lang, idx) => (
                    <div
                      key={lang.name}
                      style={{
                        width: `${lang.percentage}%`,
                        backgroundColor: getLangColor(lang.name),
                      }}
                      className="h-full transition-all duration-1000 ease-out hover:opacity-80"
                      title={`${lang.name}: ${lang.percentage}%`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {languages?.map((lang) => (
                    <div
                      key={lang.name}
                      className="flex flex-col gap-1 group/item"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="size-2 rounded-full"
                            style={{ backgroundColor: getLangColor(lang.name) }}
                          />
                          <span className="font-medium text-white/80">
                            {lang.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground font-mono">
                          {lang.percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${lang.percentage}%`,
                            backgroundColor: getLangColor(lang.name),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Insights */}
        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
          <CardHeader className="border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="size-5 text-emerald-400" />
              Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <InsightItem
                  condition={(health?.prMergeRate || 0) > 70}
                  positive="High PR Merge Rate - Collaborative team"
                  negative="Low PR Merge Rate - PRs might be stalling"
                />
                <InsightItem
                  condition={(health?.commitsLast60Days || 0) > 20}
                  positive="Active development in the last 60 days"
                  negative="Stagnant development recently"
                />
                <InsightItem
                  condition={(health?.openIssuesCount || 0) < 50}
                  positive="Healthy backlog of issues"
                  negative="High volume of open issues"
                />

                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-white leading-relaxed italic">
                    "This repository shows{" "}
                    {(health?.prMergeRate || 0) > 60 ? "strong" : "improving"}{" "}
                    project health with {health?.commitsLast60Days} updates
                    recently."
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, loading, subtext }: any) => (
  <Card className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
    <div className="absolute top-0 right-0 p-2 opacity-40 group-hover:opacity-20 transition-opacity">
      {icon}
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-20 bg-white/5" />
      ) : (
        <>
          <div className="text-3xl font-semibold text-white tracking-tight">
            {value}
          </div>
          {subtext && (
            <p className="text-[10px] text-muted-foreground mt-1">{subtext}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const InsightItem = ({ condition, positive, negative }: any) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
    {condition ? (
      <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
    ) : (
      <Activity className="size-5 text-amber-400 shrink-0" />
    )}
    <p className="text-xs text-white/70 leading-normal">
      {condition ? positive : negative}
    </p>
  </div>
);

const getLangColor = (name: string) => {
  const colors: any = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C++": "#f34b7d",
    Ruby: "#701516",
    PHP: "#4F5D95",
  };
  return colors[name] || "#8b949e";
};

export default RepoInfoPage;
