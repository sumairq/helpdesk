import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketStatus, TicketCategory } from "@helpdesk/core";
import { screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { TicketsPage } from "./TicketsPage";
import { renderWithQuery } from "@/test/utils";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const mockTickets = [
  {
    id: 1,
    subject: "Keyboard not working",
    body: "Keys unresponsive.",
    bodyHtml: null,
    senderName: "Alice Student",
    senderEmail: "alice@example.com",
    status: TicketStatus.open,
    category: TicketCategory.technical,
    assignedToId: null,
    createdAt: "2024-03-20T08:30:00.000Z",
    updatedAt: "2024-03-20T08:30:00.000Z",
  },
  {
    id: 2,
    subject: "Refund request",
    body: "I need a refund.",
    bodyHtml: null,
    senderName: "Bob Student",
    senderEmail: "bob@example.com",
    status: TicketStatus.resolved,
    category: TicketCategory.refund,
    assignedToId: null,
    createdAt: "2024-03-19T10:00:00.000Z",
    updatedAt: "2024-03-19T10:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockedAxios.get.mockResolvedValue({ data: { tickets: [] } });
});

describe("TicketsPage", () => {
  it("renders the page heading", () => {
    renderWithQuery(<TicketsPage />);
    expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<TicketsPage />);
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(30); // 5 rows × 6 columns
  });

  it("shows empty state when there are no tickets", async () => {
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("No tickets yet.")).toBeInTheDocument();
    });
  });

  it("renders a row for each ticket after loading", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("Keyboard not working")).toBeInTheDocument();
      expect(screen.getByText("Refund request")).toBeInTheDocument();
    });
  });

  it("renders sender name and email for each ticket", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("Alice Student")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Bob Student")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });
  });

  it("renders status badges", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("open")).toBeInTheDocument();
      expect(screen.getByText("resolved")).toBeInTheDocument();
    });
  });

  it("renders category badges", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("Technical")).toBeInTheDocument();
      expect(screen.getByText("Refund")).toBeInTheDocument();
    });
  });

  it("renders — for tickets with no category", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        tickets: [{ ...mockTickets[0], category: null }],
      },
    });
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  it("renders ticket IDs prefixed with #", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets } });
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });
  });

  it("shows the server error message on API failure", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { data: { error: "Unauthorized" } },
    });
    mockedAxios.get.mockRejectedValue(err);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    });
  });

  it("shows a fallback message when the error has no response body", async () => {
    const err = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
      response: undefined,
    });
    mockedAxios.get.mockRejectedValue(err);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });

  it("fetches from /api/tickets with default sort params", async () => {
    renderWithQuery(<TicketsPage />);
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", {
        params: { sortBy: "createdAt", sortOrder: "desc" },
        withCredentials: true,
      });
    });
  });
});
