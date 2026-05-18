"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Shield, Activity, Loader2 } from "lucide-react";
import Link from "next/link";

export const AdminDetailFragment = graphql(`
  fragment AdminDetailFragment on AdminRoles {
    adminEmail
    adminId
    adminName
    permissions
    role
    roleId
  }
`);

export interface AdminLogLike {
  action?: string | null;
  timestamp?: string;
}

interface AdminDetailHeaderProps {
  admin?: FragmentType<typeof AdminDetailFragment> | null;
  logs?: AdminLogLike[];
  isLoadingLogs?: boolean;
}

export function AdminDetailHeader({ admin, logs = [], isLoadingLogs = false }: AdminDetailHeaderProps) {
  const data = getFragmentData(AdminDetailFragment, admin);

  if (!data) return null;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" asChild>
          <Link href="/security/roles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Details</h1>
          <p className="mt-1 text-gray-600">Role and permission overview</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mr-2 shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-semibold leading-none">Personal Information</span>
                <span className="text-[13px] font-normal text-muted-foreground">Admin contact and identification</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div>
              <div className="font-semibold text-xl text-foreground">{data.adminName}</div>
              <div className="text-[15px] break-all text-muted-foreground">{data.adminEmail}</div>
            </div>
            <div className="space-y-2 border-t border-border/50 pt-4">
              <div className="flex flex-col gap-2 rounded-md bg-muted/20 p-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="shrink-0 text-sm font-medium text-muted-foreground">Admin ID</span>
                <span className="break-all rounded py-0.5 text-right font-mono text-[13px] font-medium text-foreground sm:bg-muted sm:px-2">
                  {data.adminId}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center mr-2 shrink-0">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-semibold leading-none">Role & Permissions</span>
                <span className="text-[13px] font-normal text-muted-foreground">Access levels assigned</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-sm font-medium text-muted-foreground">Current Role</span>
              <Badge className="min-w-0 max-w-[min(100%,14rem)] whitespace-normal break-words bg-primary/10 px-3 text-center font-semibold text-primary hover:bg-primary/20 border-primary/20 sm:max-w-[55%]">
                {data.role}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 rounded-md bg-muted/20 p-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="shrink-0 text-sm font-medium text-muted-foreground">Role ID</span>
              <span className="break-all font-mono text-[13px] text-foreground sm:text-right">{data.roleId}</span>
            </div>
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Permissions ({data.permissions?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {(data.permissions || []).map((perm, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-muted/30 border-border/80 text-foreground font-medium">
                    {perm}
                  </Badge>
                ))}
                {(!data.permissions || data.permissions.length === 0) && (
                  <span className="text-sm text-muted-foreground italic">No permissions assigned</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary Module */}
        <Card className="min-w-0 border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Generating activity summary...</span>
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center p-5 bg-muted/40 border border-border/50 rounded-xl transition-colors hover:bg-muted/60">
                  <div className="text-3xl font-bold text-foreground mb-1">{logs.length}</div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Actions</div>
                </div>
                <div className="text-center p-5 bg-muted/40 border border-border/50 rounded-xl transition-colors hover:bg-muted/60">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {logs.filter((log) => log.action?.toLowerCase().includes("create")).length}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Create Actions</div>
                </div>
                <div className="text-center p-5 bg-muted/40 border border-border/50 rounded-xl transition-colors hover:bg-muted/60">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {
                      logs.filter(
                        (log) =>
                          log.timestamp &&
                          new Date(log.timestamp).toDateString() === new Date().toDateString()
                      ).length
                    }
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Actions</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
