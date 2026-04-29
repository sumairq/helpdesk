import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReplyThread, type TicketReply } from "./ReplyThread";

const agentReply: TicketReply = {
  id: 1,
  senderType: "agent",
  author: { id: "agent-1", name: "Alice Agent" },
  body: "We are looking into this.",
  bodyHtml: null,
  createdAt: "2024-03-21T09:00:00.000Z",
};

const customerReply: TicketReply = {
  id: 2,
  senderType: "customer",
  author: null,
  body: "Any update on this?",
  bodyHtml: null,
  createdAt: "2024-03-22T10:00:00.000Z",
};

describe("ReplyThread", () => {
  // --- Loading state ---

  it("shows skeletons while loading", () => {
    render(<ReplyThread replies={[]} isLoading={true} />);
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("does not show the empty state while loading", () => {
    render(<ReplyThread replies={[]} isLoading={true} />);
    expect(screen.queryByText("No replies yet.")).not.toBeInTheDocument();
  });

  // --- Empty state ---

  it("shows the empty state when there are no replies", () => {
    render(<ReplyThread replies={[]} isLoading={false} />);
    expect(screen.getByText("No replies yet.")).toBeInTheDocument();
  });

  // --- Agent reply ---

  it("renders the agent's name as the sender label", () => {
    render(<ReplyThread replies={[agentReply]} isLoading={false} />);
    expect(screen.getByText("Alice Agent")).toBeInTheDocument();
  });

  it("falls back to 'Agent' when author is null on an agent reply", () => {
    const reply: TicketReply = { ...agentReply, author: null };
    render(<ReplyThread replies={[reply]} isLoading={false} />);
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("renders the agent reply body", () => {
    render(<ReplyThread replies={[agentReply]} isLoading={false} />);
    expect(screen.getByText(agentReply.body)).toBeInTheDocument();
  });

  it("renders the agent reply timestamp", () => {
    render(<ReplyThread replies={[agentReply]} isLoading={false} />);
    expect(
      screen.getByText(new Date(agentReply.createdAt).toLocaleString()),
    ).toBeInTheDocument();
  });

  // --- Customer reply ---

  it("renders 'Customer' as the sender label for customer replies", () => {
    render(<ReplyThread replies={[customerReply]} isLoading={false} />);
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("renders the customer reply body", () => {
    render(<ReplyThread replies={[customerReply]} isLoading={false} />);
    expect(screen.getByText(customerReply.body)).toBeInTheDocument();
  });

  // --- Mixed thread ---

  it("renders all replies in order", () => {
    render(
      <ReplyThread replies={[agentReply, customerReply]} isLoading={false} />,
    );
    expect(screen.getByText(agentReply.body)).toBeInTheDocument();
    expect(screen.getByText(customerReply.body)).toBeInTheDocument();
  });

  it("does not show the empty state when there are replies", () => {
    render(<ReplyThread replies={[agentReply]} isLoading={false} />);
    expect(screen.queryByText("No replies yet.")).not.toBeInTheDocument();
  });
});
