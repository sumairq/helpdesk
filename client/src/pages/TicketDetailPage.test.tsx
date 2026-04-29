import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { TicketStatus, TicketCategory } from "@helpdesk/core";
import { TicketDetailPage } from "./TicketDetailPage";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Mock Base UI Select to avoid jsdom pointer-event incompatibilities.
vi.mock("@/components/ui/select", async () => {
  const { createContext, useContext } = await import("react");
  const Ctx = createContext<((v: string) => void) | undefined>(undefined);

  return {
    Select({ onValueChange, children }: any) {
      return <Ctx.Provider value={onValueChange}>{children}</Ctx.Provider>;
    },
    SelectTrigger({ children }: any) { return <>{children}</>; },
    SelectValue({ children }: any) { return <span data-testid="select-value">{children}</span>; },
    SelectContent({ children }: any) { return <>{children}</>; },
    SelectItem({ value: itemValue, children }: any) {
      const onChange = useContext(Ctx);
      return (
        <button role="option" type="button" onClick={() => onChange?.(itemValue ?? "")}>
          {children}
        </button>
      );
    },
  };
});

const mockAgents = [
  { id: "agent-1", name: "Alice Agent", email: "alice@helpdesk.com" },
  { id: "agent-2", name: "Bob Agent", email: "bob@helpdesk.com" },
];

const mockTicket: {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  senderName: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
} = {
  id: 1,
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

function renderDetailPage(ticketId = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/tickets" element={<div>Tickets</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function setupMocks(
  ticket = mockTicket,
  agents = mockAgents,
) {
  mockedAxios.get.mockImplementation((url: string) => {
    if (url === `/api/tickets/${ticket.id}`) return Promise.resolve({ data: { ticket } });
    if (url === "/api/tickets/agents") return Promise.resolve({ data: { agents } });
    if (url === `/api/tickets/${ticket.id}/replies`) return Promise.resolve({ data: { replies: [] } });
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
}

// Returns the <dd> element for the metadata field with the given label.
function getFieldDd(label: string): HTMLElement {
  const dt = screen.getByText(label, { selector: "dt" });
  return dt.nextElementSibling as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks();
  mockedAxios.patch.mockResolvedValue({ data: { ticket: mockTicket } });
});

describe("TicketDetailPage", () => {
  // --- Loading state ---

  it("shows skeletons while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderDetailPage();
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // --- Error states ---

  it("shows the server error message on ticket fetch failure", async () => {
    const err = Object.assign(new Error("Ticket not found"), {
      response: { data: { error: "Ticket not found" } },
    });
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "/api/tickets/1") return Promise.reject(err);
      return Promise.resolve({ data: { agents: mockAgents } });
    });
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText("Ticket not found")).toBeInTheDocument();
    });
  });

  it("shows a fallback error message when there is no response body", async () => {
    const err = Object.assign(new Error("Network Error"), { response: undefined });
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "/api/tickets/1") return Promise.reject(err);
      return Promise.resolve({ data: { agents: mockAgents } });
    });
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });

  // --- Header ---

  it("renders the ticket subject as a heading", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: mockTicket.subject })).toBeInTheDocument();
    });
  });

  it("renders the ticket ID prefixed with #", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText("#1")).toBeInTheDocument();
    });
  });

  it("renders the status badge", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByTestId("status-badge")).toHaveTextContent("Open");
    });
  });

  it("renders the category badge", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByTestId("category-badge")).toHaveTextContent("Technical");
    });
  });

  it("does not render a category badge when category is null", async () => {
    setupMocks({ ...mockTicket, category: null });
    renderDetailPage();
    await waitFor(() => screen.getByRole("heading", { name: mockTicket.subject }));
    expect(screen.queryByTestId("category-badge")).not.toBeInTheDocument();
  });

  // --- Metadata fields ---

  it("renders the sender name in the From field", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText("Carol Student")).toBeInTheDocument();
    });
  });

  it("renders the sender email in the From field", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText("<carol@example.com>")).toBeInTheDocument();
    });
  });

  // --- Assign to ---

  it("shows 'Unassigned' in the assign trigger when ticket has no agent", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(within(getFieldDd("Assigned to")).getByTestId("select-value")).toHaveTextContent("Unassigned");
    });
  });

  it("shows the assigned agent name in the trigger when ticket is assigned", async () => {
    setupMocks({ ...mockTicket, assignedToId: "agent-1" });
    renderDetailPage();
    await waitFor(() => {
      expect(within(getFieldDd("Assigned to")).getByTestId("select-value")).toHaveTextContent("Alice Agent");
    });
  });

  it("shows 'Unknown agent' when assignedToId does not match any agent", async () => {
    setupMocks({ ...mockTicket, assignedToId: "does-not-exist" });
    renderDetailPage();
    await waitFor(() => {
      expect(within(getFieldDd("Assigned to")).getByTestId("select-value")).toHaveTextContent("Unknown agent");
    });
  });

  it("calls PATCH /api/tickets/:id with the agent id when an agent is selected", async () => {
    mockedAxios.patch.mockResolvedValue({
      data: { ticket: { ...mockTicket, assignedToId: "agent-1" } },
    });
    renderDetailPage();
    await waitFor(() => within(getFieldDd("Assigned to")).getByRole("option", { name: "Alice Agent" }));

    fireEvent.click(within(getFieldDd("Assigned to")).getByRole("option", { name: "Alice Agent" }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { assignedToId: "agent-1" },
        { withCredentials: true },
      );
    });
  });

  it("calls PATCH /api/tickets/:id with null when Unassigned is selected", async () => {
    setupMocks({ ...mockTicket, assignedToId: "agent-1" });
    mockedAxios.patch.mockResolvedValue({
      data: { ticket: { ...mockTicket, assignedToId: null } },
    });
    renderDetailPage();
    await waitFor(() =>
      expect(within(getFieldDd("Assigned to")).getByTestId("select-value")).toHaveTextContent("Alice Agent"),
    );

    fireEvent.click(within(getFieldDd("Assigned to")).getByRole("option", { name: "Unassigned" }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/api/tickets/1",
        { assignedToId: null },
        { withCredentials: true },
      );
    });
  });

  it("updates the assign trigger to show the agent name after a successful assignment", async () => {
    mockedAxios.patch.mockResolvedValue({
      data: { ticket: { ...mockTicket, assignedToId: "agent-1" } },
    });
    renderDetailPage();
    await waitFor(() => within(getFieldDd("Assigned to")).getByRole("option", { name: "Alice Agent" }));

    fireEvent.click(within(getFieldDd("Assigned to")).getByRole("option", { name: "Alice Agent" }));

    await waitFor(() => {
      expect(within(getFieldDd("Assigned to")).getByTestId("select-value")).toHaveTextContent("Alice Agent");
    });
  });

  // --- Message body ---

  it("renders the plain-text message body", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText(mockTicket.body)).toBeInTheDocument();
    });
  });

  it("renders bodyHtml when available instead of plain text", async () => {
    setupMocks({ ...mockTicket, bodyHtml: "<p>Formatted body</p>" });
    renderDetailPage();
    await waitFor(() => {
      expect(screen.getByText("Formatted body")).toBeInTheDocument();
    });
    expect(screen.queryByText(mockTicket.body)).not.toBeInTheDocument();
  });

  // --- API calls ---

  it("fetches the ticket from /api/tickets/:id", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets/1", {
        withCredentials: true,
      });
    });
  });

  it("fetches agents from /api/tickets/agents", async () => {
    renderDetailPage();
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets/agents", {
        withCredentials: true,
      });
    });
  });
});
