"use client";

import Link from "next/link";

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

import { COURSE_AUDIENCE_LABELS, type Course } from "../../schemas/course.schema";

function CourseName({ course }: { course: Course }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/academy/courses/${course.id}`}
        className="font-medium wrap-break-word hover:underline"
      >
        {course.title}
      </Link>
      <p className="truncate text-xs text-muted-foreground">
        {course.estate_name ?? "No estate"} · {course.estimated_minutes} min
      </p>
    </div>
  );
}

function RoleTag({ course }: { course: Course }) {
  if (course.is_first_sale_path) return <Badge>First sale path</Badge>;
  if (course.grants_credential) return <Badge variant="outline">Grants a credential</Badge>;
  return null;
}

function Completed({ course }: { course: Course }) {
  if (course.learners_count === 0) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round((course.completed_count / course.learners_count) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{course.completed_count}</span>
    </div>
  );
}

interface CoursesTableProps {
  rows: Course[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function CoursesTable({ rows, isLoading, emptyState }: CoursesTableProps) {
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
              <TableHead>Modules</TableHead>
              <TableHead>Learners</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="max-w-[22rem]">
                  <CourseName course={course} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{COURSE_AUDIENCE_LABELS[course.audience]}</Badge>
                </TableCell>
                <TableCell>
                  <RoleTag course={course} />
                </TableCell>
                <TableCell className="tabular-nums">{course.modules_count}</TableCell>
                <TableCell className="tabular-nums">{course.learners_count}</TableCell>
                <TableCell>
                  <Completed course={course} />
                </TableCell>
                <TableCell>
                  <Badge variant={course.status === "published" ? "default" : "secondary"}>
                    {course.status === "published" ? "Published" : "Draft"}
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
            subtitle={<RoleTag course={course} />}
          >
            <AdminMobileField label="Audience" value={COURSE_AUDIENCE_LABELS[course.audience]} />
            <AdminMobileField label="Modules" value={course.modules_count} />
            <AdminMobileField label="Learners" value={course.learners_count} />
            <AdminMobileField label="Completed" value={<Completed course={course} />} />
            <AdminMobileField
              label="Status"
              value={
                <Badge variant={course.status === "published" ? "default" : "secondary"}>
                  {course.status === "published" ? "Published" : "Draft"}
                </Badge>
              }
            />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
