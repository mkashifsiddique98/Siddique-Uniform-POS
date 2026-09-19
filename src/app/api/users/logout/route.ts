import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Path to backup script in project root
    const backupScript = path.join(process.cwd(), "backup.bat");

    // Run backup script
    await execAsync(`bash "${backupScript}"`);

    console.log("MongoDB backup completed successfully");

    // Logout
    const response = NextResponse.json({
      message: "Backup created and logged out",
    });

    response.cookies.set("token", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Backup/Logout error:", error);

    return NextResponse.json(
      {
        message: "Backup failed",
        error: "Could not create MongoDB backup",
      },
      { status: 500 }
    );
  }
}