"use client";

import type { ComponentProps } from "react";
import { Select } from "@/components/ui";

export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return (
    <Select
      {...props}
      className="h-10 w-auto shrink-0 text-sm"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}
