import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TicketStatus, TicketCategory } from "@helpdesk/core";
import { TicketsFilters } from "./TicketsFilters";

const noop = vi.fn();

const defaultProps = {
  searchInput: "",
  filters: {},
  onSearchChange: noop,
  onFiltersChange: noop,
};

beforeEach(() => vi.clearAllMocks());

describe("TicketsFilters", () => {
  it("renders the search input", () => {
    render(<TicketsFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search subject, name or email…")).toBeInTheDocument();
  });

  it("reflects the current search input value", () => {
    render(<TicketsFilters {...defaultProps} searchInput="laptop" />);
    expect(screen.getByPlaceholderText("Search subject, name or email…")).toHaveValue("laptop");
  });

  it("calls onSearchChange when the search input changes", () => {
    const onSearchChange = vi.fn();
    render(<TicketsFilters {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText("Search subject, name or email…"), {
      target: { value: "printer" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("printer");
  });

  it("shows 'All Statuses' in the status trigger when no status filter is active", () => {
    render(<TicketsFilters {...defaultProps} />);
    expect(screen.getByText("All Statuses")).toBeInTheDocument();
  });

  it("shows 'All Categories' in the category trigger when no category filter is active", () => {
    render(<TicketsFilters {...defaultProps} />);
    expect(screen.getByText("All Categories")).toBeInTheDocument();
  });

  it("shows the active status label in the trigger", () => {
    render(<TicketsFilters {...defaultProps} filters={{ status: TicketStatus.open }} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("shows 'Resolved' in the trigger when resolved status is active", () => {
    render(<TicketsFilters {...defaultProps} filters={{ status: TicketStatus.resolved }} />);
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("shows 'Closed' in the trigger when closed status is active", () => {
    render(<TicketsFilters {...defaultProps} filters={{ status: TicketStatus.closed }} />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("shows the active category label in the trigger", () => {
    render(<TicketsFilters {...defaultProps} filters={{ category: TicketCategory.technical }} />);
    expect(screen.getByText("Technical")).toBeInTheDocument();
  });

  it("shows 'General' in the trigger when general_question category is active", () => {
    render(<TicketsFilters {...defaultProps} filters={{ category: TicketCategory.general_question }} />);
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("shows 'Refund' in the trigger when refund category is active", () => {
    render(<TicketsFilters {...defaultProps} filters={{ category: TicketCategory.refund }} />);
    expect(screen.getByText("Refund")).toBeInTheDocument();
  });

  it("shows 'Uncategorised' in the trigger when uncategorised is active", () => {
    render(<TicketsFilters {...defaultProps} filters={{ category: "uncategorised" }} />);
    expect(screen.getByText("Uncategorised")).toBeInTheDocument();
  });
});
