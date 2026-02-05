import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const client = await clerkClient()
  const users = await client.users.getUserList({ limit: 100 });

  return Response.json(users);
}
