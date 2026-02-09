import { useUser } from "@clerk/clerk-react";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { isLoaded: isClerkLoaded } = useUser();

  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const newUser = useMutation(api.users.createNewUser);

  useEffect(() => {
    if (!isAuthenticated || !isClerkLoaded) return;
    if (userId) return;

    let cancelled = false;

    async function createUser() {
      try {
        const id = await newUser();
        if (!cancelled) {
          setUserId(id);
        }
      } catch (err) {
        console.error("[useStoreUser] store failed", err);
      }
    }

    createUser();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isClerkLoaded, newUser, userId]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
