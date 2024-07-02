import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const res = await request.json();
  const {data} = res
  console.log(data);
  try {
    await fs.writeFile(
      path.join(process.cwd(), "public", "size-catgory-template.json"),
      JSON.stringify(data)
    );
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving data:", error);
    return Response.json({ success: false, error: "Error saving data" });
  }
}
