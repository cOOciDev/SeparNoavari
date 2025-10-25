import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import * as hooks from "../service/hooks";
import AssignmentModal from "../components/judges/AssignmentModal";
import { renderWithProviders } from "../test/utils";

const mutateAsync = vi.fn();

describe("AssignmentModal", () => {
  beforeEach(() => {
    vi.spyOn(hooks, "useManualAssign").mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useManualAssign>);

    vi.spyOn(hooks, "useIdeaAssignments").mockReturnValue({
      data: { assignments: [], maxJudges: 10 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useIdeaAssignments>);

    vi.spyOn(hooks, "useAdminJudges").mockReturnValue({
      data: {
        items: [
          { id: "judge-1", user: { name: "Judge One", email: "one@test" } },
          { id: "judge-2", user: { name: "Judge Two", email: "two@test" } },
        ],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof hooks.useAdminJudges>);

    vi.spyOn(hooks, "useDeleteAssignment").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useDeleteAssignment>);
    vi.spyOn(hooks, "useLockAssignment").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useLockAssignment>);
  });

  afterEach(() => {
    mutateAsync.mockReset();
    vi.restoreAllMocks();
  });

  it("assigns selected judges when submitting", async () => {
    renderWithProviders(
      <AssignmentModal open ideaId="idea-123" onClose={vi.fn()} />
    );

    const user = userEvent.setup();
    const select = screen.getByRole("combobox");
    await user.click(select);
    await user.click(screen.getByText("Judge One"));

    await user.click(screen.getByRole("button", { name: /ok/i }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      ideaId: "idea-123",
      judgeIds: ["judge-1"],
    });
  });

  it("disables assign button when max judges reached", () => {
    vi.spyOn(hooks, "useIdeaAssignments").mockReturnValue({
      data: {
        assignments: new Array(10).fill({ id: "a", status: "LOCKED" }),
        maxJudges: 10,
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useIdeaAssignments>);

    renderWithProviders(
      <AssignmentModal open ideaId="idea-locked" onClose={vi.fn()} />
    );

    const okButton = screen.getByRole("button", { name: /ok/i });
    expect(okButton).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
