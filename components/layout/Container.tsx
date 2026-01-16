"use client";

import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Container = ({ children, className, ...props }: ContainerProps) => {
  return (
    <div className={cn("w-full px-6 mx-auto", className)} {...props}>
      {children}
    </div>
  );
};

export default Container;
