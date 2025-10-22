import { beforeEach, describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import LoginPage from "../pages/auth/LoginPage";
import SubmitIdeaPage from "../pages/ideas/SubmitIdeaPage";
import MyIdeasPage from "../pages/ideas/MyIdeasPage";
import IdeaDetailPage from "../pages/ideas/IdeaDetailPage";
import { renderWithProviders } from "../test/utils";
import { message } from "antd";

const mockLoginState = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  error: null,
  isSuccess: false,
};
const mockRegisterState = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  error: null,
  isSuccess: false,
};
const mockCreateIdeaState = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  error: null,
};
const mockMyIdeasState = {
  data: { items: [] },
  isLoading: false,
  error: null,
};
const mockIdeaState = {
  data: null as any,
  isLoading: false,
  error: null,
};
const mockMeState = {
  data: { user: { id: "1", email: "user@example.com", name: "User", role: "USER" } },
  isLoading: false,
  error: null,
};

vi.mock("../service/hooks", () => ({
  useLogin: () => mockLoginState,
  useRegister: () => mockRegisterState,
  useCreateIdea: () => mockCreateIdeaState,
  useMyIdeas: () => mockMyIdeasState,
  useIdea: () => mockIdeaState,
  useMe: () => mockMeState,
}));

const user = userEvent.setup();

describe("Smoke flows", () => {
  beforeEach(() => {
    mockLoginState.mutate.mockReset();
    mockLoginState.mutateAsync.mockReset();
    mockCreateIdeaState.mutate.mockReset();
    mockCreateIdeaState.mutateAsync.mockReset();
    mockCreateIdeaState.mutateAsync.mockResolvedValue({});
    mockMyIdeasState.data = { items: [] };
    mockIdeaState.data = null;
    mockIdeaState.error = null;
    mockIdeaState.isLoading = false;
    mockMeState.data = { user: { id: "1", email: "user@example.com", name: "User", role: "USER" } };
  });

  test("user can submit login credentials", async () => {
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(mockLoginState.mutate).toHaveBeenCalledWith({ email: "admin@example.com", password: "secret123", next: null });
  });

  test("idea submission sends multipart payload", async () => {
    const successSpy = vi.spyOn(message, "success").mockImplementation(() => {});

    renderWithProviders(<SubmitIdeaPage />);

    await user.type(screen.getByLabelText(/title/i), "New Idea");
    await user.type(screen.getByLabelText(/summary/i), "This is a summary of the idea");

    const combobox = screen.getByRole("combobox", { name: /category/i });
    await user.click(combobox);
    const option = await screen.findAllByRole("option");
    await user.click(option[0]);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(mockCreateIdeaState.mutateAsync).toHaveBeenCalledTimes(1));
    const formData = mockCreateIdeaState.mutateAsync.mock.calls[0][0] as FormData;
    expect(Array.from(formData.keys())).toEqual(["title", "summary", "category"]);
    expect(successSpy).toHaveBeenCalled();
    successSpy.mockRestore();
  });

  test("my ideas table renders data", () => {
    mockMyIdeasState.data = {
      items: [
        {
          id: "i1",
          owner: "1",
          title: "Flood early warning",
          summary: "",
          category: "resilience",
          contactEmail: "user@example.com",
          submitterName: "User",
          phone: "",
          teamMembers: [],
          status: "UNDER_REVIEW",
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    renderWithProviders(<MyIdeasPage />);

    expect(screen.getByText(/Flood early warning/i)).toBeInTheDocument();
    expect(screen.getByText(/UNDER_REVIEW/i)).toBeInTheDocument();
  });

  test("idea detail displays files", () => {
    mockIdeaState.data = {
      idea: {
        id: "i1",
        owner: "1",
        title: "Flood early warning",
        summary: "Protects citizens",
        category: "resilience",
        contactEmail: "user@example.com",
        submitterName: "User",
        phone: "",
        teamMembers: [],
        status: "DONE",
        files: [
          {
            originalName: "plan.pdf",
            storedName: "plan.pdf",
            path: "uploads/plan.pdf",
            size: 1024 * 1024,
            mime: "application/pdf",
            fieldName: "files",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    renderWithProviders(<IdeaDetailPage />);

    expect(screen.getByText(/plan.pdf/i)).toBeInTheDocument();
  });
});
