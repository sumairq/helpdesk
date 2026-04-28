import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@helpdesk/core";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "@/test/utils";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Prevent Base UI portal/animation issues in jsdom.
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/DeleteUserDialog", () => ({
  DeleteUserDialog: ({ user, onClose }: { user: { id: string; name: string } | null; onClose: () => void }) =>
    user ? (
      <div>
        <p>Delete {user.name}?</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onClose}>Delete</button>
      </div>
    ) : null,
}));

// Wrap the real CreateUserDialog with dismiss simulation so that both the form
// tests (which need real inputs) and the open/close tests work in one file.
vi.mock("@/components/CreateUserDialog", async (importOriginal) => {
  const { useEffect } = await import("react");
  const mod = await importOriginal<typeof import("@/components/CreateUserDialog")>();
  const Real = mod.CreateUserDialog;
  return {
    CreateUserDialog: (props: { open: boolean; onOpenChange: (open: boolean) => void }) => {
      useEffect(() => {
        if (!props.open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape") props.onOpenChange(false);
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
      }, [props.open, props.onOpenChange]);

      return (
        <>
          <Real {...props} />
          {props.open && (
            <div data-testid="backdrop" onClick={() => props.onOpenChange(false)} />
          )}
        </>
      );
    },
  };
});

const mockUsers = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@helpdesk.local",
    role: Role.ADMIN,
    createdAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@helpdesk.local",
    role: Role.AGENT,
    createdAt: "2024-03-20T08:30:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockedAxios.get.mockResolvedValue({ data: { users: [] } });
});

describe("UsersPage", () => {
  it("renders the page heading", () => {
    renderWithQuery(<UsersPage />);
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<UsersPage />);
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(25); // 5 rows × 5 columns
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
    renderWithQuery(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "New User" })).toBeInTheDocument();
    });
  });

  it("dialog is not shown on initial render", () => {
    renderWithQuery(<UsersPage />);
    expect(screen.queryByRole("heading", { name: "New User" })).not.toBeInTheDocument();
  });

  it("shows the dialog when New User is clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    expect(screen.getByRole("heading", { name: "New User" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("hides the dialog when clicking outside", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    expect(screen.getByRole("heading", { name: "New User" })).toBeInTheDocument();
    await user.click(screen.getByTestId("backdrop"));
    expect(screen.queryByRole("heading", { name: "New User" })).not.toBeInTheDocument();
  });

  it("hides the dialog when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "New User" }));
    await user.click(screen.getByRole("button", { name: "New User" }));
    expect(screen.getByRole("heading", { name: "New User" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("heading", { name: "New User" })).not.toBeInTheDocument();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
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

  it("does not show a delete button for ADMIN users", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByText("Alice Admin"));
    expect(screen.queryByRole("button", { name: "Delete Alice Admin" })).not.toBeInTheDocument();
  });

  it("shows a delete button for AGENT users", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByText("Bob Agent"));
    expect(screen.getByRole("button", { name: "Delete Bob Agent" })).toBeInTheDocument();
  });

  it("opens the delete confirmation dialog when delete is clicked", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<UsersPage />);
    await waitFor(() => screen.getByRole("button", { name: "Delete Bob Agent" }));
    await user.click(screen.getByRole("button", { name: "Delete Bob Agent" }));
    expect(screen.getByText("Delete Bob Agent?")).toBeInTheDocument();
  });

  it("displays a server error inside the modal when creation fails", async () => {
    const user = userEvent.setup();
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
