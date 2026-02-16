import { Arcade } from "@arcadeai/arcadejs";
 
export async function POST(req: Request) {
  const { toolName } = await req.json();
 
  if (!toolName) {
    return Response.json({ error: "toolName required" }, { status: 400 });
  }
 
  const arcade = new Arcade();
  const userId = process.env.ARCADE_USER_ID || "default-user";
 
  try {
    const authResponse = await arcade.tools.authorize({
      tool_name: toolName,
      user_id: userId,
    });
    return Response.json({ status: authResponse.status });
  } catch (error) {
    console.error("Auth status check error:", error);
    return Response.json(
      { status: "error", error: String(error) },
      { status: 500 }
    );
  }
}