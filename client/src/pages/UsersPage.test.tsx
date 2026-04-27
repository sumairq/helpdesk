import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "@/test/utils";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

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
});
