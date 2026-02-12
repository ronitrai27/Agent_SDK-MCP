"use client";

import React from "react";
import { useQuery } from "convex/react";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { AlertCircle, LucideCross, LucideUser2 } from "lucide-react";

type Review = Doc<"reviews">;
type Issue = Doc<"issues">;

const ReviewPage = () => {
  const params = useParams();

  const repoId = params.repoId as Id<"repositories">;

  // Fetch reviews and issues
  const reviews = useQuery(api.repo.getReviewsByRepoId, { repoId });
  const issues = useQuery(api.repo.getIssuesByRepoId, { repoId });

  // Loading state
  if (reviews === undefined || issues === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Repository Reviews & Issues
          </h1>
          <p className="text-gray-600">Loading data...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-accent rounded"></div>
          <div className="h-32 bg-accent rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Repository Reviews & Issues</h1>
        <p className="text-gray-600">
          Status: {reviews.length} reviews, {issues.length} issues found
        </p>
      </div>

      {/* Reviews Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Reviews 
        </h2>
        {reviews.length === 0 ? (
          <div className="bg-accent  rounded-lg p-8 text-center">
            <p className="text-foreground text-lg">
              No reviews found for this repository
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Reviews will appear here once commits or PRs are analyzed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-base">
                    {review.prOrCommitTitle}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      review.reviewStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : review.reviewStatus === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {review.reviewStatus || "pending"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {review.reviewType}
                  </p>
                  {review.authorUserName && (
                    <p>
                      <span className="font-medium">Commit By:</span>{" "}
                      {review.authorUserName}
                    </p>
                  )}
                
                  {review.prOrCommitUrl && (
                    <p>
                      <a
                        href={review.prOrCommitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      > 
                        View on GitHub →
                      </a>
                    </p>
                  )}
                </div>

                {review.ctiticalIssueFound && (
                  <div>
                    <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-800 font-medium text-sm">
                         Critical issues found <AlertCircle className="inline size-5" />
                      </p>
                    </div>

                    <div className="flex items-center gap-8 justify-start my-4">
                      <Button size="sm">
                        Assign <LucideUser2 />
                      </Button>
                      <Button size="sm">
                        Ignore <LucideCross />
                      </Button>
                    </div>
                  </div>
                )}

                {review.review && (
                  <Message from="assistant" className="mb-4">
                    <MessageContent>
                      <MessageResponse>{review.review}</MessageResponse>
                    </MessageContent>
                  </Message>
                )}

                <div className="mt-3 text-xs text-gray-400">
                  Created: {new Date(review.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issues Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
          Issues ({issues.length})
        </h2>
        {issues.length === 0 ? (
          <div className="bg-accent  rounded-lg p-8 text-center">
            <p className="text-foreground text-lg">
              No issues found for this repository
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Issues will appear here once code analysis detects problems
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue._id}
                className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{issue.issueTitle}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      issue.issueStatus === "resolved"
                        ? "bg-green-100 text-green-800"
                        : issue.issueStatus === "assigned"
                          ? "bg-blue-100 text-blue-800"
                          : issue.issueStatus === "ignored"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {issue.issueStatus || "pending"}
                  </span>
                </div>

                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {issue.issueDescription}
                  </p>
                </div>

                {issue.issueCreatedBy && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Created by:</span>{" "}
                    {issue.issueCreatedBy}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-400">
                  Created: {new Date(issue.issueCreatedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
