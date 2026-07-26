// components/SkeletonLoader.tsx
import React from "react";

export const SkeletonLoader = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-3 w-full" data-testid="skeleton-loader">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border border-gray-150 bg-white animate-pulse flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="space-y-2 w-full max-w-[200px]">
              <div className="h-3 bg-gray-200 rounded-md w-full" />
              <div className="h-2.5 bg-gray-150 rounded-md w-2/3" />
            </div>
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};