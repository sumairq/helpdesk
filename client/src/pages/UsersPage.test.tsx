import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "@/test/utils";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUsers = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@helpdesk.local",
    role: "ADMIN" as const,
    createdAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@helpdesk.local",
    role: "AGENT" as const,
    createdAt: "2024-03-20T08:30:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage", () => {
  it("renders the page heading", () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<UsersPage />);
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(20); // 5 rows × 4 columns
  });

  it("renders a row for each user after loading", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText("Alice Admin")).toBeInTheDocument();
      expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    });
  });

  it("renders user email and role", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText("alice@helpdesk.local")).toBeInTheDocument();
      expect(screen.getByText("ADMIN")).toBeInTheDocument();
      expect(screen.getByText("bob@helpdesk.local")).toBeInTheDocument();
      expect(screen.getByText("AGENT")).toBeInTheDocument();
    });
  });

  it("shows 'No users found' when the list is empty", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });
  });

  it("shows the server error message on API failure", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { data: { error: "Unauthorized" } },
    });
    mockedAxios.get.mockRejectedValue(err);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<UsersPage />);
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
    renderWithQuery(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });
  });

  it("renders the New User button", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New User" })).toBeInTheDocument();
    });
  });

  it("opens the create user dialog when New User is clicked", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    expect(screen.getByRole("heading", { name: "New User" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() => {
      expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("creates a user, closes the modal, and refetches on success", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    mockedAxios.post.mockResolvedValue({ data: {} });
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    await user.type(screen.getByLabelText("Name"), "Carol Agent");
    await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
    await user.type(screen.getByLabelText("Password"), "supersecret123");
    await user.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "New User" })).not.toBeInTheDocument();
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/users",
      { name: "Carol Agent", email: "carol@helpdesk.local", password: "supersecret123" },
      { withCredentials: true },
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("displays a server error inside the modal when creation fails", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    const err = Object.assign(new Error("Email already in use"), {
      isAxiosError: true,
      response: { data: { error: "Email already in use" } },
    });
    mockedAxios.post.mockRejectedValue(err);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    await user.type(screen.getByLabelText("Name"), "Carol Agent");
    await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
    await user.type(screen.getByLabelText("Password"), "supersecret123");
    await user.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "New User" })).toBeInTheDocument();
    });
  });
});
