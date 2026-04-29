import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TicketStatus, TicketCategory, statusLabels, categoryLabels, type Ticket } from "@helpdesk/core";
import { TicketDetail } from "./TicketDetail";

const mockTicket: Ticket = {
  id: 42,
  subject: "Laptop screen broken",
  body: "The screen cracked after I dropped it.",
  bodyHtml: null,
  senderName: "Carol Student",
  senderEmail: "carol@example.com",
  status: TicketStatus.open,
  category: TicketCategory.technical,
  assignedToId: null,
  createdAt: "2024-03-20T08:30:00.000Z",
  updatedAt: "2024-03-21T10:00:00.000Z",
};

describe("TicketDetail", () => {
  // --- Header ---

  it("renders the ticket ID prefixed with #", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByText("#42")).toBeInTheDocument();
  });

  it("renders the subject as a heading", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByRole("heading", { name: mockTicket.subject })).toBeInTheDocument();
  });

  it("renders the status badge with the correct label", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByTestId("status-badge")).toHaveTextContent(statusLabels[TicketStatus.open]);
  });

  it("renders the category badge when category is set", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByTestId("category-badge")).toHaveTextContent(categoryLabels[TicketCategory.technical]);
  });

  it("does not render a category badge when category is null", () => {
    render(<TicketDetail ticket={{ ...mockTicket, category: null }} />);
    expect(screen.queryByTestId("category-badge")).not.toBeInTheDocument();
  });

  it("renders the correct status badge for each status", () => {
    for (const status of Object.values(TicketStatus)) {
      const { unmount } = render(<TicketDetail ticket={{ ...mockTicket, status }} />);
      expect(screen.getByTestId("status-badge")).toHaveTextContent(statusLabels[status]);
      unmount();
    }
  });

  // --- Sender + timestamps ---

  it("renders the sender name", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByText("Carol Student")).toBeInTheDocument();
  });

  it("renders the sender email", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByText("<carol@example.com>")).toBeInTheDocument();
  });

  it("renders a Created date", () => {
    render(<TicketDetail ticket={mockTicket} />);
    const dt = screen.getByText("Created");
    expect(dt.nextElementSibling).toHaveTextContent(
      new Date(mockTicket.createdAt).toLocaleString(),
    );
  });

  it("renders an Updated date", () => {
    render(<TicketDetail ticket={mockTicket} />);
    const dt = screen.getByText("Updated");
    expect(dt.nextElementSibling).toHaveTextContent(
      new Date(mockTicket.updatedAt).toLocaleString(),
    );
  });

  // --- Message body ---

  it("renders the plain-text body in a <pre>", () => {
    render(<TicketDetail ticket={mockTicket} />);
    expect(screen.getByText(mockTicket.body)).toBeInTheDocument();
  });

  it("renders bodyHtml when provided instead of plain text", () => {
    render(
      <TicketDetail ticket={{ ...mockTicket, bodyHtml: "<p>Formatted body</p>" }} />,
    );
    expect(screen.getByText("Formatted body")).toBeInTheDocument();
    expect(screen.queryByText(mockTicket.body)).not.toBeInTheDocument();
  });
});
