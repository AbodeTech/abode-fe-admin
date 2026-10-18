"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { COURSE_AUDIENCE_LABELS, COURSE_STATUS_LABELS, type Course } from "../../schemas/course.schema";

/** The row itself is the navigation target (see `CoursesTable`) — this is just the label, not a link. */
function CourseName({ course }: { course: Course }) {
  return (
    <div className="min-w-0">
      <p className="font-medium wrap-break-word">{course.title}</p>
      <p className="truncate text-xs text-muted-foreground">{course.estimated_minutes} min</p>
    </div>
  );
}

/**
 * `is_first_sale_path` isn't a field on the course record (see
 * course.schema.ts) — the caller cross-references `academySettings` and
 * passes the winning id down, since there's no aggregate endpoint to ask.
 */
function RoleTag({ course, isFirstSalePath }: { course: Course; isFirstSalePath: boolean }) {
  if (isFirstSalePath) return <Badge>First sale path</Badge>;
  if (course.grants_credential) return <Badge variant="outline">Grants a credential</Badge>;
  return null;
}

interface CoursesTableProps {
  rows: Course[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  /** `academy-settings.first_sale_path_course_id`, so rows can badge the current holder. */
  firstSalePathCourseId?: string | null;
}

export function CoursesTable({ rows, isLoading, emptyState, firstSalePathCourseId }: CoursesTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <>{emptyState}</>;

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((course) => (
              <TableRow
                key={course.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/academy/courses/${course.id}`)}
              >
                <TableCell className="max-w-[22rem]">
                  <CourseName course={course} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{COURSE_AUDIENCE_LABELS[course.audience]}</Badge>
                </TableCell>
                <TableCell>
                  <RoleTag course={course} isFirstSalePath={course.id === firstSalePathCourseId} />
                </TableCell>
                <TableCell>
                  <Badge variant={course.status === "published" ? "default" : "secondary"}>
                    {COURSE_STATUS_LABELS[course.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((course) => (
          <AdminMobileCard
            key={course.id}
            title={<CourseName course={course} />}
            subtitle={<RoleTag course={course} isFirstSalePath={course.id === firstSalePathCourseId} />}
            onClick={() => router.push(`/academy/courses/${course.id}`)}
          >
            <AdminMobileField label="Audience" value={COURSE_AUDIENCE_LABELS[course.audience]} />
            <AdminMobileField
              label="Status"
              value={
                <Badge variant={course.status === "published" ? "default" : "secondary"}>
                  {COURSE_STATUS_LABELS[course.status]}
                </Badge>
              }
            />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
