import { redirect } from "next/navigation";

/**
 * Suspended users are a filter on All Users now (Account Status), with its own
 * export preset. This route stays so old links and bookmarks still land somewhere.
 */
export default function SuspendedUsersRedirect() {
  redirect("/users?isSuspended=true");
}
