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
    <Card className="border-border bg-card overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col} className="text-muted-foreground whitespace-nowrap px-6">{col}</TableHead>
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
                    <TableCell key={`${idx}-${i}`} className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
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
