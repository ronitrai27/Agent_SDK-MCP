import { NextRequest, NextResponse } from "next/server";
import { handlePushEvent } from "@/modules/github";
import { HandlePrEvent } from "@/modules/dashboard";

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
      console.log(
        "============Pushed Event Triggered for COMMIT !============",
      );
      // console.log("============FOR PUSH COMMIT DETAILS : ===================", body)
      const commits = body.commits || [];
      const repo = body.repository.full_name;
      const [owner, repoName] = repo.split("/");
      const branch = body.ref.replace("refs/heads/", "");
      const pusher = body.pusher;
      console.log("owner", owner);
      console.log("repoName", repoName);
      console.log("branch", branch);
      console.log("pusher", pusher);

      handlePushEvent(body)
        .then(() => console.log(`✅ Push Event Processed`))
        .catch((err: any) => console.error(`❌ Error:`, err));

      return NextResponse.json(
        { message: "Webhook received" },
        { status: 202 },
      );
    }
    // ===============================
    // ISSUES
    // ===============================

    if (event === "issues") {
      const action = body.action;

      const issue = body.issue;
      const repo = body.repository.full_name;
      const sender = body.sender; // ✅ Person who triggered the action
      const [owner, repoName] = repo.split("/");

      //     Issue event received: {
      // action: 'closed',
      // action is open and close !
      // important actions - opened and reopened !

      console.log("Issue event received:", {
        // Basic info
        action, // opened, closed, reopened, edited, etc.
        issueNumber: issue.number,
        title: issue.title,
        body: issue.body, // Issue description/content
        state: issue.state, // open or closed

        // Author (who created the issue)
        author: issue.user.login,
        authorAvatar: issue.user.avatar_url, // ✅ Avatar
        authorId: issue.user.id,

        // Action trigger (who just did something)
        actionBy: sender.login, // ✅ Who triggered this event
        actionByAvatar: sender.avatar_url, // ✅ Their avatar

        // Timestamps
        createdAt: issue.created_at, // ✅ When issue was created
        updatedAt: issue.updated_at, // ✅ Last updated
        closedAt: issue.closed_at, // ✅ When closed (null if open)

        // Labels
        labels: issue.labels.map((l: any) => ({
          name: l.name, // ✅ Label name
          color: l.color, // ✅ Label color (hex)
          description: l.description,
        })),

        // Assignment
        assignees: issue.assignees.map((a: any) => ({
          login: a.login, // ✅ Assigned users
          avatar: a.avatar_url,
        })),
        assignee: issue.assignee?.login, // Primary assignee (if any)

        // Other useful fields
        milestone: issue.milestone?.title, // ✅ Milestone if set
        comments: issue.comments, // ✅ Comment count
        locked: issue.locked,
        url: issue.html_url, // ✅ GitHub URL
        apiUrl: issue.url, // API endpoint

        // Repo context
        repo,
      });
    }
    // =================================
    // PR
    // =================================

    if (event === "pull_request") {
      console.log(
        "=================================PR REQUEST===================",
      );
      const action = body.action;
      const repo = body.repository.full_name;
      const prNumber = body.number;
      const prTitle = body.pull_request.title;
      const prUrl = body.pull_request.html_url;
      const author = body.pull_request.user.login;
      console.log("PR event received:", {
        action,
        prNumber,
        title: prTitle,
        author,
        prUrl,
        repo,
      });
      const [owner, repoName] = repo.split("/");

      if (action === "opened") {
        console.log("Triggering AI review for new PR...");
        // HandlePrEvent({ owner, repoName, prNumber, prTitle, prUrl, author })
        //   .then(() =>
        //     console.log(`✅ Reviewed pull request #${prNumber} in ${repo}`),
        //   )
        //   .catch((err: any) =>
        //     console.error(
        //       `❌ Error reviewing PR #${prNumber} and repo ${repo}:`,
        //       err,
        //     ),
        //   );
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
