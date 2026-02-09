import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen w-full dark bg-background relative flex items-center justify-center">
      <div className="z-10 relative">
        <SignIn forceRedirectUrl="/auth/callback" />
      </div>
      <div className="absolute top-0 right-40 w-full max-w-[840px] h-[400px] bg-indigo-500/30 blur-[200px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-full h-screen bg-[linear-gradient(to_right,#80808012_0.7px,transparent_0.5px),linear-gradient(to_bottom,#80808012_0.7px,transparent_0.5px)] bg-size-[36px_36px]" />
    </div>
  );
}
