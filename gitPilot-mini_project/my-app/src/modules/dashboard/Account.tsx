// "use client"
import { Doc } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LucideGitBranch, LucideUser } from "lucide-react";

const Account = () => {
  const user: Doc<"users"> | undefined | null = useQuery(
    api.users.getCurrentUser,
  );
  return (
    <div>
      <div className="flex items-center gap-2 bg-accent py-1 px-6 rounded-md w-fit">
        <Avatar>
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback>{user?.userName}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm">
            <LucideUser className="size-4 inline" /> {user?.userName}
          </p>
          <p className="italic text-muted-foreground text-xs">
            Account synced <LucideGitBranch className="inline size-3" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default Account;
