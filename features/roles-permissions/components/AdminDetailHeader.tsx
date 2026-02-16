"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Shield } from "lucide-react";
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
}

export function AdminDetailHeader({ admin }: AdminDetailHeaderProps) {
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
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="font-semibold text-lg">{data.adminName}</div>
            <div className="text-sm text-muted-foreground">{data.adminEmail}</div>
            <div className="text-sm flex justify-between">
              <span className="text-muted-foreground">Admin ID:</span>
              <span className="font-mono">{data.adminId}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge className="bg-black text-white">{data.role}</Badge>
            <div className="text-sm text-muted-foreground">Role ID: {data.roleId}</div>
            <div className="flex flex-wrap gap-2">
              {(data.permissions || []).map((perm, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {perm}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
