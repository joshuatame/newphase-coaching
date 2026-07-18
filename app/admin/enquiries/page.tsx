import { redirect } from "next/navigation";

/** Legacy path — applications live at /admin/applications/ */
export default function AdminEnquiriesRedirect() {
  redirect("/admin/applications/");
}
