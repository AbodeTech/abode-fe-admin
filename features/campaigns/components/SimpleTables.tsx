"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GenericTableProps {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export function GenericTable({ title, columns, rows }: GenericTableProps) {
  return (
    <Card className="border border-gray-200 overflow-x-auto">
      <div className="px-4 py-3 border-b text-sm font-semibold text-gray-900">{title}</div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={idx}>
                {row.map((cell, i) => (
                  <TableCell key={`${idx}-${i}`}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
