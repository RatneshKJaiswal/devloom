"use client";

import { useEffect } from "react";

interface UseListKeyboardNavigationOptions<T> {
  items: T[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenItem?: (item: T) => void;
  onToggleItem?: (item: T) => void;
  onQuickCapture?: () => void;
  enabled?: boolean;
}

/**
 * Linear/Vim-style list navigation hook:
 * - 'j' / 'ArrowDown': Move to next item
 * - 'k' / 'ArrowUp': Move to previous item
 * - 'Enter': Open details/edit modal for active item
 * - 'x' / 'Space': Toggle status (done/todo or open/resolved)
 * - 'c': Open quick capture dialog
 */
export function useListKeyboardNavigation<T extends { id: string }>({
  items,
  selectedIndex,
  onSelectIndex,
  onOpenItem,
  onToggleItem,
  onQuickCapture,
  enabled = true,
}: UseListKeyboardNavigationOptions<T>) {
  useEffect(() => {
    if (!enabled || items.length === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is inside an input, textarea, select or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ignore if Cmd or Ctrl or Alt is pressed
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        onSelectIndex(selectedIndex + 1 < items.length ? selectedIndex + 1 : 0);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        onSelectIndex(selectedIndex - 1 >= 0 ? selectedIndex - 1 : items.length - 1);
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < items.length && onOpenItem) {
          e.preventDefault();
          onOpenItem(items[selectedIndex]);
        }
      } else if (e.key === "x" || e.key === " ") {
        if (selectedIndex >= 0 && selectedIndex < items.length && onToggleItem) {
          e.preventDefault();
          onToggleItem(items[selectedIndex]);
        }
      } else if (e.key === "c") {
        if (onQuickCapture) {
          e.preventDefault();
          onQuickCapture();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, onSelectIndex, onOpenItem, onToggleItem, onQuickCapture, enabled]);
}
