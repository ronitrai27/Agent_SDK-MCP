"use client";
import React from "react";
import { BarLoader } from "react-spinners";
import { useConvexAuth } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import { SignIn } from "@clerk/nextjs";
import { LucideGithub } from "lucide-react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

const HomePage = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {isLoading ? (
        <div className="absolute top-0 left-0 w-full">
          <BarLoader width={"100%"} color="#6c47ff" />
        </div>
      ) : isAuthenticated ? (
        <Authenticated>
          <Button>Continue to Dashboard</Button>
        </Authenticated>
      ) : (
        <Unauthenticated>
          <div className="flex flex-col space-y-5">
            <h2>
              Continue with Github <LucideGithub className="inline size-6" />
            </h2>
            <SignInButton mode="modal">
              <Button className="cursor-pointer px-8!">
                Github <LucideGithub className="inline size-6" />
              </Button>
            </SignInButton>
          </div>
        </Unauthenticated>
      )}
    </div>
  );
};

export default HomePage;
