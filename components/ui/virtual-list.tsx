// Virtual List Component - Optimizovano za duge liste
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 100,
  overscan = 5,
  className = "",
  itemClassName = "",
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`h-full overflow-auto ${className}`}
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className={itemClassName}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Homework List sa Virtual Scrolling
interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  dueDate: Date;
  status: string;
}

interface VirtualHomeworkListProps {
  homework: HomeworkItem[];
  onItemClick?: (item: HomeworkItem) => void;
}

export function VirtualHomeworkList({
  homework,
  onItemClick,
}: VirtualHomeworkListProps) {
  return (
    <VirtualList
      items={homework}
      estimateSize={120}
      className="max-h-[600px]"
      renderItem={(item, _index) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="w-full text-left p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.subject}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                item.status === "done"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {item.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(item.dueDate).toLocaleDateString("sr-RS")}
          </p>
        </button>
      )}
    />
  );
}
