import { Compass } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      size="page"
      icon={Compass}
      title="Page not found"
      description="The address may be mistyped, or the page may have moved."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/">Go to Unified OS</Link>
        </Button>
      }
    />
  );
}
