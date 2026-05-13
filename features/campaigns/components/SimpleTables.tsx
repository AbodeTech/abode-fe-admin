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
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <div className="border-b border-border px-3 py-3 sm:px-6 sm:py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="min-w-0 overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap px-3 text-muted-foreground sm:px-6">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground hover:bg-transparent">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={idx} className="border-border hover:bg-muted/50">
                  {row.map((cell, i) => (
                    <TableCell
                      key={`${idx}-${i}`}
                      className="max-w-[220px] px-3 py-3 text-sm font-medium text-foreground wrap-break-word whitespace-normal sm:px-6 sm:py-4"
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
