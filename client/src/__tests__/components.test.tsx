import { beforeEach, describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";

import AssignmentModal from "../components/judges/AssignmentModal";
import ReviewForm from "../pages/judge/ReviewForm";
import IdeaForm from "../components/forms/IdeaForm";
import { renderWithProviders } from "../test/utils";
import { RoleGuard } from "../utils/guard";

const mockUseBulkAssign = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const mockUseAdminJudges = {
  data: { items: [] },
  isLoading: false,
  error: null,
};
const mockUseSubmitReview = {
  mutateAsync: vi.fn(),
  isPending: false,
  error: null,
};

const mockAuthValue = {
  user: { id: "1", email: "user@example.com", name: "User", role: "USER" as const },
  isAuthenticated: true,
  loading: false,
  refreshUser: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
  navigateAfterLogin: vi.fn(),
};

vi.mock("../service/hooks", () => ({
  useBulkAssign: () => mockUseBulkAssign,
  useAdminJudges: () => mockUseAdminJudges,
  useSubmitReview: () => mockUseSubmitReview,
}));

vi.mock("../contexts/AuthProvider", () => ({
  useAuth: () => mockAuthValue,
}));

describe("AssignmentModal", () => {
  beforeEach(() => {
    mockUseBulkAssign.mutateAsync.mockReset();
    mockUseAdminJudges.data = {
      items: [
        { id: "j1", active: true, expertise: ["AI"], user: { id: "u1", email: "judge@example.com", name: "Judge" } },
      ],
    };
  });

  test("submits manual assignment", async () => {
    const onClose = vi.fn();
    mockUseBulkAssign.mutateAsync.mockResolvedValue({});

    renderWithProviders(<AssignmentModal open ideaId="i1" onClose={onClose} />);

    await userEvent.click(screen.getByRole("combobox", { name: /Strategy/i }));
    const manual = (await screen.findAllByRole("option", { name: /Manual/i }))[0];
    await userEvent.click(manual);
    const judgeSelect = screen.getByRole("combobox", { name: /Judges/i });
    await userEvent.click(judgeSelect);
    const judgeOption = (await screen.findAllByRole("option", { name: /Judge/i }))[0];
    await userEvent.click(judgeOption);
    const countInput = screen.getByRole("spinbutton", { name: /Judges per idea/i });
    await userEvent.clear(countInput);
    await userEvent.type(countInput, "2");
    await userEvent.click(screen.getByRole("button", { name: /Assign/i }));

    await waitFor(() => expect(mockUseBulkAssign.mutateAsync).toHaveBeenCalled());
    expect(mockUseBulkAssign.mutateAsync.mock.calls[0][0]).toMatchObject({
      ideaId: "i1",
      judgeIds: ["j1"],
      countPerIdea: 2,
      strategy: "MANUAL",
    });
    expect(onClose).toHaveBeenCalled();
  });

  test("shows conflict error", async () => {
    mockUseBulkAssign.mutateAsync.mockRejectedValue({ code: "CONFLICT", message: "Already assigned" });

    renderWithProviders(<AssignmentModal open ideaId="i1" onClose={() => {}} />);

    await userEvent.click(screen.getByRole("combobox", { name: /Strategy/i }));
    const manual = (await screen.findAllByRole("option", { name: /Manual/i }))[0];
    await userEvent.click(manual);
    await userEvent.click(screen.getByRole("combobox", { name: /Judges/i }));
    const judgeOption = (await screen.findAllByRole("option", { name: /Judge/i }))[0];
    await userEvent.click(judgeOption);
    await userEvent.click(screen.getByRole("button", { name: /Assign/i }));

    await waitFor(() => expect(screen.getByText(/Already assigned/i)).toBeInTheDocument());
  });
});

describe("ReviewForm", () => {
  beforeEach(() => {
    mockUseSubmitReview.mutateAsync.mockReset();
    mockUseSubmitReview.mutateAsync.mockResolvedValue({});
  });

  test("requires scores", async () => {
    renderWithProviders(<ReviewForm ideaId="i1" />);

    await userEvent.clear(screen.getByLabelText(/Novelty/i));
    await userEvent.click(screen.getByRole("button", { name: /Submit review/i }));

    expect(mockUseSubmitReview.mutateAsync).not.toHaveBeenCalled();
  });

  test("submits scores and comment", async () => {
    renderWithProviders(<ReviewForm ideaId="i1" />);

    await userEvent.clear(screen.getByLabelText(/Novelty/i));
    await userEvent.type(screen.getByLabelText(/Novelty/i), "80");
    await userEvent.clear(screen.getByLabelText(/Feasibility/i));
    await userEvent.type(screen.getByLabelText(/Feasibility/i), "70");
    await userEvent.clear(screen.getByLabelText(/Impact/i));
    await userEvent.type(screen.getByLabelText(/Impact/i), "60");
    await userEvent.type(screen.getByLabelText(/Comment/i), "Great potential");

    await userEvent.click(screen.getByRole("button", { name: /Submit review/i }));

    await waitFor(() => expect(mockUseSubmitReview.mutateAsync).toHaveBeenCalled());
    expect(mockUseSubmitReview.mutateAsync.mock.calls[0][0]).toEqual({
      ideaId: "i1",
      scores: { novelty: 80, feasibility: 70, impact: 60 },
      comment: "Great potential",
    });
  });
});

describe("IdeaForm", () => {
  test("calls onSubmit with form values", async () => {
    const handleSubmit = vi.fn();
    renderWithProviders(
      <IdeaForm
        categories={[
          { label: "Resilience", value: "resilience" },
          { label: "Response", value: "response" },
        ]}
        onSubmit={handleSubmit}
      />
    );

    await userEvent.type(screen.getByLabelText(/Title/i), "Sensor network");
    await userEvent.type(screen.getByLabelText(/Summary/i), "Deploy sensors");
    const select = screen.getByRole("combobox", { name: /Category/i });
    await userEvent.click(select);
    await userEvent.click(await screen.findByText(/Resilience/));

    await userEvent.click(screen.getByRole("button", { name: /Submit/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    expect(handleSubmit.mock.calls[0][0]).toMatchObject({
      title: "Sensor network",
      summary: "Deploy sensors",
      category: "resilience",
    });
  });
});

describe("RoleGuard", () => {
  test("redirects non-admin user", () => {
    mockAuthValue.user = { ...mockAuthValue.user, role: "USER" };

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleGuard need={['ADMIN']}>
              <div>admin</div>
            </RoleGuard>
          }
        />
        <Route path="/" element={<div>home</div>} />
      </Routes>,
      { router: { initialEntries: ["/admin"] } }
    );

    expect(screen.getByText(/home/)).toBeInTheDocument();
  });

  test("allows admin user", () => {
    mockAuthValue.user = { ...mockAuthValue.user, role: "ADMIN" };

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleGuard need={['ADMIN']}>
              <div>administrator</div>
            </RoleGuard>
          }
        />
      </Routes>,
      { router: { initialEntries: ["/admin"] } }
    );

    expect(screen.getByText(/administrator/)).toBeInTheDocument();
  });
});
