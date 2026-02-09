GITPILOT - An AI agent that analyzes GitHub repos and distributes insights.A small agent platform where users connect GitHub → AI analyzes repos → runs tools → sends outputs to Notion / Docs / Search.

Feature 1: User login via github (github connected) , select repo from all his private/public repo -> we start indexing via inngest and save to pinecone, Agent work - to auto analyse language, detect frameworks(maybe via package.json or requirements.txt), and make live search after it (via firecrawl or tavily) to seach recent updates in that language / framework and update to user.
 Show progress bar (while indexing in inngest) !!!

Feature 2: Send Insights:(when user says in chat "send insights") --> selected repo - file count , language used , issues / pr / commits/ readme quality - analysis - send report to notion / google doc/ email.
button to toggle "Schedule weekly reports"

Feature 3: Smart PR Reviewer Agent: webhooks connected --> pr / commit tracked ---> agent analyze code diff, code chnages , detects good , bad , critical problems. on critical - send email/ alert to owner (user).

Feature 4: (Boss Feature) (Agentic chat with repo): get whole repo deatils (either from pinecone or other source), fetch other repo stats (if required) ---> understand code base --> USER sets budget + timeline for complition of the project ---> Ai agent now ---> suggest newer tasks , Guide user to whether add or remove new tasks according to budget and dealine, add issues on github. can live search for user query -- can create / edit tasks created (TO-DO on platform) - but with user confirmation, Task prioritization logic, Auto-suggest removals when over budget with Negotiation. Agent can also get repo details and warn users ( if user quiries).
UI PART : Visual Timeline Simulator (keep updated by agent).

Feature 5: (BONUS) Voice mode - voice agnets that perform and talk with ELEVENLABS UI. 