import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureDocxAndGetUrl, DocxNotReadyError } from "@/lib/docx/export";

/**
 * One-click download shortcut used by the dashboard's report list — builds
 * the .docx if needed and redirects straight to a signed URL, so a student
 * never has to open the editor just to grab the file.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const url = await ensureDocxAndGetUrl(reportId, user.id);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof DocxNotReadyError ? error.message : "download_failed";
    return NextResponse.redirect(
      new URL(`/report/${reportId}?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
