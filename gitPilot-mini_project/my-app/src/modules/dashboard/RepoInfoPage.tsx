import React from "react";
import Lottie from "lottie-react";
import emptyGit from "@/animation/empty-git.json";

const RepoInfoPage = ({ownerName, repoName}: {ownerName?: string, repoName?: string}) => {
  return (
    <div className='h-full w-full flex-1'>
        {!ownerName && !repoName && (
        <div className="h-full w-full flex flex-col items-center justify-center gap-4">
          <div className="size-64 opacity-80">
            <Lottie animationData={emptyGit} loop={true} />
          </div>
          <p className="text-muted-foreground text-xl italic">
            Select a repository to view its details
          </p>
        </div>
        )}
    </div>
  )
}

export default RepoInfoPage