import { beforeEach, describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";
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

const mockAuthContext = {
  user: { id: "1", email: "user@example.com", name: "User", role: "USER" as const },
  isAuthenticated: true,
  loading: false,
  refreshUser: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
  navigateAfterLogin: vi.fn().mockReturnValue("/ideas/mine"),
};

vi.mock("../service/hooks", () => ({
  useLogin: () => mockLoginState,
  useRegister: () => mockRegisterState,
  useCreateIdea: () => mockCreateIdeaState,
  useMyIdeas: () => mockMyIdeasState,
  useIdea: () => mockIdeaState,
  useMe: () => mockMeState,
}));

vi.mock("../contexts/AuthProvider", () => ({
  useAuth: () => mockAuthContext,
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
    mockAuthContext.user = { id: "1", email: "user@example.com", name: "User", role: "USER" };
    mockAuthContext.refreshUser.mockReset();
    mockAuthContext.logout.mockReset();
    mockAuthContext.setUser.mockReset();
    mockAuthContext.navigateAfterLogin.mockReset();
    mockAuthContext.navigateAfterLogin.mockReturnValue("/ideas/mine");
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
    const firstOption = document.querySelector<HTMLElement>(".ant-select-item-option");
    if (!firstOption) {
      throw new Error("No category options rendered");
    }
    await user.click(firstOption);

    const fileInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const wordFile = new File(["word-content"], "proposal.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const pdfFile = new File(["pdf-content"], "proposal.pdf", { type: "application/pdf" });
    fireEvent.change(fileInputs[0], { target: { files: [wordFile] } });
    fireEvent.change(fileInputs[1], { target: { files: [pdfFile] } });

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(mockCreateIdeaState.mutateAsync).toHaveBeenCalledTimes(1));
    const formData = mockCreateIdeaState.mutateAsync.mock.calls[0][0] as FormData;
    expect(Array.from(formData.keys())).toEqual([
      "title",
      "summary",
      "category",
      "submitterName",
      "contactEmail",
      "proposalDoc",
      "proposalPdf",
    ]);
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
