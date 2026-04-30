import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { renderWithQuery } from "@/test/utils";
import { ReplyForm } from "./ReplyForm";
import type { TicketReply } from "./ReplyThread";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const mockReply: TicketReply = {
  id: 1,
  senderType: "agent",
  author: { id: "agent-1", name: "Alice Agent" },
  body: "Here is our response.",
  bodyHtml: null,
  createdAt: "2024-03-21T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReplyForm", () => {
  // --- Initial render ---

  it("renders the textarea and send button", () => {
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    expect(screen.getByPlaceholderText("Write a reply…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reply" })).toBeInTheDocument();
  });

  it("disables the button when the textarea is empty", () => {
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
  });

  it("disables the button when the textarea contains only whitespace", () => {
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
  });

  it("enables the button when the textarea has content", () => {
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    expect(screen.getByRole("button", { name: "Send reply" })).toBeEnabled();
  });

  // --- Pending state ---

  it("shows 'Sending…' and disables inputs while the request is in-flight", async () => {
    mockedAxios.post.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
      expect(screen.getByPlaceholderText("Write a reply…")).toBeDisabled();
    });
  });

  // --- Success ---

  it("calls POST /api/tickets/:id/replies with the correct body", async () => {
    mockedAxios.post.mockResolvedValue({ data: { reply: mockReply } });
    renderWithQuery(<ReplyForm ticketId={42} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello there" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/api/tickets/42/replies",
        { body: "Hello there" },
        { withCredentials: true },
      );
    });
  });

  it("clears the textarea after a successful submission", async () => {
    mockedAxios.post.mockResolvedValue({ data: { reply: mockReply } });
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Write a reply…")).toHaveValue("");
    });
  });

  it("calls onSuccess with the returned reply after a successful submission", async () => {
    mockedAxios.post.mockResolvedValue({ data: { reply: mockReply } });
    const onSuccess = vi.fn();
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockReply);
    });
  });

  // --- Error states ---

  it("shows the server error message on an axios error with a response body", async () => {
    const err = Object.assign(new Error("Bad request"), {
      response: { data: { error: "Reply body is required" } },
    });
    mockedAxios.post.mockRejectedValue(err);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(screen.getByText("Reply body is required")).toBeInTheDocument();
    });
  });

  it("shows error.message when the axios error has no response body", async () => {
    const err = Object.assign(new Error("Network Error"), { response: undefined });
    mockedAxios.post.mockRejectedValue(err);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });

  it("shows a fallback message for non-axios errors", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Unexpected"));
    mockedAxios.isAxiosError.mockReturnValue(false);
    renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
    await waitFor(() => {
      expect(screen.getByText("Failed to send reply")).toBeInTheDocument();
    });
  });

  // --- Polish button ---

  describe("Polish button", () => {
    it("renders the Polish button", () => {
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Polish" })).toBeInTheDocument();
    });

    it("disables the Polish button when the textarea is empty", () => {
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
    });

    it("disables the Polish button when the textarea contains only whitespace", () => {
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "   " } });
      expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
    });

    it("enables the Polish button when the textarea has content", () => {
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
      expect(screen.getByRole("button", { name: "Polish" })).toBeEnabled();
    });

    it("shows 'Polishing…' and disables both buttons and textarea while in-flight", async () => {
      mockedAxios.post.mockReturnValue(new Promise(() => {}));
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Polishing…" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
        expect(screen.getByPlaceholderText("Write a reply…")).toBeDisabled();
      });
    });

    it("calls POST /api/tickets/:id/polish with the correct body", async () => {
      mockedAxios.post.mockResolvedValue({ data: { polished: "Polished text." } });
      renderWithQuery(<ReplyForm ticketId={42} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "rough draft" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/tickets/42/polish",
          { body: "rough draft" },
          { withCredentials: true },
        );
      });
    });

    it("replaces the textarea content with the polished text on success", async () => {
      mockedAxios.post.mockResolvedValue({ data: { polished: "Polished text." } });
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "rough draft" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Write a reply…")).toHaveValue("Polished text.");
      });
    });

    it("shows the server error message on an axios error with a response body", async () => {
      const err = Object.assign(new Error("Bad request"), {
        response: { data: { error: "Reply body is required" } },
      });
      mockedAxios.post.mockRejectedValue(err);
      mockedAxios.isAxiosError.mockReturnValue(true);
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.getByText("Reply body is required")).toBeInTheDocument();
      });
    });

    it("shows error.message when the axios error has no response body", async () => {
      const err = Object.assign(new Error("Network Error"), { response: undefined });
      mockedAxios.post.mockRejectedValue(err);
      mockedAxios.isAxiosError.mockReturnValue(true);
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.getByText("Network Error")).toBeInTheDocument();
      });
    });

    it("shows a fallback message for non-axios errors", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Unexpected"));
      mockedAxios.isAxiosError.mockReturnValue(false);
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.getByText("Failed to polish reply")).toBeInTheDocument();
      });
    });

    it("clears the polish error when Polish is clicked again", async () => {
      const err = Object.assign(new Error("Network Error"), { response: undefined });
      mockedAxios.post.mockRejectedValueOnce(err).mockReturnValueOnce(new Promise(() => {}));
      mockedAxios.isAxiosError.mockReturnValue(true);
      renderWithQuery(<ReplyForm ticketId={1} onSuccess={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), { target: { value: "Hello" } });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.getByText("Network Error")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: "Polish" }));
      await waitFor(() => {
        expect(screen.queryByText("Network Error")).not.toBeInTheDocument();
      });
    });
  });
});
