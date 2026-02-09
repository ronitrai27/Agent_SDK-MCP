"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStoreUser } from "@/hooks/use-user-store";
import { Loader2 } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../convex/_generated/api";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoading: isStoreLoading } = useStoreUser();
  const user = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (isStoreLoading) return;

    if (user === undefined) return;
  }, [isStoreLoading, user, router]);

  return (
    <>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>

      <Authenticated>
        <header className="flex justify-between h-15 bg-muted py-1 shrink-0 items-center border-b px-4">
          <div className="flex items-center gap-2">
            {/* <DashboardBreadcrumbs /> */}
          </div>
          <div className="">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </Authenticated>
    </>
  );
}
