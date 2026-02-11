import { NextRequest, NextResponse } from "next/server";
// import { handlePushEvent } from "@/modules/github";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = req.headers.get("X-gitHub-Event");
    console.log("----------------EVENT --->", event);

    if (event === "ping") {
      return NextResponse.json({ message: "pong" }, { status: 200 });
    }
    // ===============================
    // PUSH
    // ===============================
    if (event === "push") {
      console.log("============Pushed Event Triggered !============");
      // await handlePushEvent(body);
      // return NextResponse.json(
      //   { message: "Push Event Processed" },
      //   { status: 200 },
      // );
    }
    // ===============================
    // ISSUES
    // ===============================
    if (event === "issues") {
      const action = body.action;
      const issue = body.issue;
      const repo = body.repository.full_name;
      const [owner, repoName] = repo.split("/");

      console.log("Issue event received:", {
        action,
        issueNumber: issue.number,
        title: issue.title,
        author: issue.user.login,
        repo,
      });
    }

    // =================================
    // PR
    // =================================

    if (event === "pull_request") {
      const action = body.action;
      const repo = body.repository.full_name;
      const prNumber = body.number;

      const [owner, repoName] = repo.split("/");

      if (action === "opened") {
        console.log("🤖 Triggering AI review for new PR...");
      }
    }
    return NextResponse.json({ message: "Event Processed" }, { status: 200 });
  } catch (e) {
    console.log("error==========>", e);
    return NextResponse.json(
      { message: "Server Error, Sorry!" },
      { status: 500 },
    );
  }
}
