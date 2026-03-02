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

interface AdminDetailHeaderProps {
  admin?: FragmentType<typeof AdminDetailFragment> | null;
  logs?: any[];
  isLoadingLogs?: boolean;
}

export function AdminDetailHeader({ admin, logs = [], isLoadingLogs = false }: AdminDetailHeaderProps) {
  const data = getFragmentData(AdminDetailFragment, admin);

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/security/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Details</h1>
          <p className="text-gray-600 mt-1">Role and permission overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
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
              <div className="text-[15px] text-muted-foreground">{data.adminEmail}</div>
            </div>
            <div className="space-y-2 pt-4 border-t border-border/50">
              <div className="text-sm flex justify-between items-center bg-muted/20 p-2 rounded-md">
                <span className="text-muted-foreground font-medium">Admin ID</span>
                <span className="font-mono text-[13px] font-medium bg-mutedpx-2 py-0.5 rounded text-foreground">{data.adminId}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Current Role</span>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-semibold px-3">{data.role}</Badge>
            </div>
            <div className="text-sm flex justify-between items-center bg-muted/20 p-2 rounded-md">
              <span className="text-muted-foreground font-medium">Role ID</span>
              <span className="font-mono text-[13px] text-foreground">{data.roleId}</span>
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
        <Card className="border-border bg-card lg:col-span-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      logs.filter((log) => new Date(log.timestamp).toDateString() === new Date().toDateString())
                        .length
                    }
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Actions</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
