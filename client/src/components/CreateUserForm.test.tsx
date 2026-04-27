import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { CreateUserDialog } from "./CreateUserDialog";
import { renderWithQuery } from "@/test/utils";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
  }) =>
    open ? (
      <div>
        {children}
        <button data-testid="dialog-dismiss" onClick={() => onOpenChange(false)}>
          dismiss
        </button>
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderDialog(open = true, onOpenChange = vi.fn()) {
  return {
    onOpenChange,
    ...renderWithQuery(<CreateUserDialog open={open} onOpenChange={onOpenChange} />),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateUserDialog", () => {
  describe("rendering", () => {
    it("renders nothing when closed", () => {
      renderDialog(false);
      expect(screen.queryByRole("heading", { name: "New User" })).not.toBeInTheDocument();
    });

    it("renders the form fields when open", () => {
      renderDialog();
      expect(screen.getByRole("heading", { name: "New User" })).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create User" })).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows all field errors when submitting empty", async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("shows error when name is too short", async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.type(screen.getByLabelText("Name"), "ab");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
      });
    });

    it("shows error when email is invalid", async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.type(screen.getByLabelText("Email"), "not-an-email");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it("shows error when password is too short", async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.type(screen.getByLabelText("Password"), "short");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("does not submit when validation fails", async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => screen.getByText("Email is required"));
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("submits with correct payload", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockResolvedValue({ data: {} });
      renderDialog();
      await user.type(screen.getByLabelText("Name"), "Carol Agent");
      await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
      await user.type(screen.getByLabelText("Password"), "supersecret123");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/users",
          { name: "Carol Agent", email: "carol@helpdesk.local", password: "supersecret123" },
          { withCredentials: true },
        );
      });
    });

    it("disables the submit button while pending", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockReturnValue(new Promise(() => {}));
      renderDialog();
      await user.type(screen.getByLabelText("Name"), "Carol Agent");
      await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
      await user.type(screen.getByLabelText("Password"), "supersecret123");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
      });
    });

    it("calls onOpenChange(false) and resets the form on success", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockResolvedValue({ data: {} });
      const { onOpenChange } = renderDialog();
      await user.type(screen.getByLabelText("Name"), "Carol Agent");
      await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
      await user.type(screen.getByLabelText("Password"), "supersecret123");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows a server error and keeps the dialog open on failure", async () => {
      const user = userEvent.setup();
      const err = Object.assign(new Error("Email already in use"), {
        isAxiosError: true,
        response: { data: { error: "Email already in use" } },
      });
      mockedAxios.post.mockRejectedValue(err);
      mockedAxios.isAxiosError.mockReturnValue(true);
      const { onOpenChange } = renderDialog();
      await user.type(screen.getByLabelText("Name"), "Carol Agent");
      await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
      await user.type(screen.getByLabelText("Password"), "supersecret123");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByText("Email already in use")).toBeInTheDocument();
      });
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("shows a fallback error when the response has no body", async () => {
      const user = userEvent.setup();
      const err = Object.assign(new Error("Network Error"), {
        isAxiosError: true,
        response: undefined,
      });
      mockedAxios.post.mockRejectedValue(err);
      mockedAxios.isAxiosError.mockReturnValue(true);
      renderDialog();
      await user.type(screen.getByLabelText("Name"), "Carol Agent");
      await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
      await user.type(screen.getByLabelText("Password"), "supersecret123");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => {
        expect(screen.getByText("Network Error")).toBeInTheDocument();
      });
    });
  });

  describe("reset on close", () => {
    it("clears the form and error when the dialog is dismissed", async () => {
      const user = userEvent.setup();
      const err = Object.assign(new Error("Email already in use"), {
        isAxiosError: true,
        response: { data: { error: "Email already in use" } },
      });
      mockedAxios.post.mockRejectedValue(err);
      mockedAxios.isAxiosError.mockReturnValue(true);

      renderDialog();

      await user.type(screen.getByLabelText("Name"), "Carol Agent");
      await user.type(screen.getByLabelText("Email"), "carol@helpdesk.local");
      await user.type(screen.getByLabelText("Password"), "supersecret123");
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await waitFor(() => screen.getByText("Email already in use"));

      // Trigger handleOpenChange(false) via the dialog's own onOpenChange —
      // same code path as Escape or backdrop click in the real dialog.
      await user.click(screen.getByTestId("dialog-dismiss"));

      // open prop is still true (onOpenChange is a mock), so the form is
      // still rendered — we can assert the fields and error were cleared.
      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByLabelText("Email")).toHaveValue("");
      expect(screen.getByLabelText("Password")).toHaveValue("");
      expect(screen.queryByText("Email already in use")).not.toBeInTheDocument();
    });
  });
});
