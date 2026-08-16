"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, ExternalLink, Search, Copy, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function StoreQuickActionsMenu({
  storeId,
  storeName,
}: {
  storeId: string;
  storeName: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopyId() {
    navigator.clipboard.writeText(storeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-muted hover:text-ink"
          aria-label={`Open menu for ${storeName}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/admin/stores/${storeId}`} className="cursor-pointer">
            <ExternalLink className="mr-2 size-3.5" />
            <span>Store details</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/search?q=${encodeURIComponent(storeName)}`} className="cursor-pointer">
            <Search className="mr-2 size-3.5" />
            <span>Search transactions</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="mr-2 size-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied Store ID</span>
            </>
          ) : (
            <>
              <Copy className="mr-2 size-3.5" />
              <span>Copy Store ID</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
