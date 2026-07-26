// __tests__/ui-states.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

describe("Frontend UI States (Skeleton, Error, Empty)", () => {
  
  it("renders SkeletonLoader correctly during data fetching", () => {
    render(<SkeletonLoader count={3} />);
    expect(screen.getByTestId("skeleton-loader")).toBeInTheDocument();
  });

  it("renders ErrorState with structured 403 Forbidden message", () => {
    render(<ErrorState code={403} />);
    expect(screen.getByTestId("error-title")).toHaveTextContent("Access Restricted (403)");
  });

  it("triggers retry callback when retry button is clicked", () => {
    const handleRetry = jest.fn();
    render(<ErrorState onRetry={handleRetry} />);
    fireEvent.click(screen.getByTestId("retry-btn"));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders EmptyState with custom title e.g. no patients waiting", () => {
    render(<EmptyState title="no patients waiting" description="Queue is empty" />);
    expect(screen.getByTestId("empty-title")).toHaveTextContent("no patients waiting");
  });

});