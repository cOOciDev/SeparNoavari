import { Select } from "antd";
import { useMemo } from "react";
import type { Judge } from "../../types/domain";
import { useAdminJudges } from "../../service/hooks";
import type { Judge } from "../../types/domain";


export type JudgeSelectorProps = {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  excludeIds?: string[];
};

<<<<<<< HEAD
const JudgeSelector = ({
  value,
  onChange,
  disabled,
  placeholder,
  excludeIds,
}: JudgeSelectorProps) => {
  const { data, isLoading } = useAdminJudges();

  const options = useMemo(() => {
    const seen = new Set<string>();
    const excluded = new Set((excludeIds ?? []).map((entry) => String(entry)));

    const items = ((data as { items?: Judge[] } | undefined)?.items ?? []) as Judge[];

    return items
      .map((judge, index) => {
        const rawId =
          judge.id ??
          // some APIs expose _id instead of id
          (judge as unknown as { _id?: string })?._id ??
          judge.user?.id ??
          null;
        const value = rawId ? String(rawId) : null;

        if (!value || seen.has(value)) {
          return null;
        }

        seen.add(value);

        const alreadyAssigned = excluded.has(value);
        return {
          key: value || `judge-${index}`,
          disabled: alreadyAssigned,
          label: `${judge.user?.name || judge.user?.email || value}${
            typeof judge.capacity === "number" ? ` (cap ${judge.capacity})` : ""
          }${alreadyAssigned ? " (assigned)" : ""}`,
          value,
        };
      })
      .filter((option): option is NonNullable<typeof option> => Boolean(option));
  }, [data, excludeIds]);
=======
const toStringId = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    try {
      const str = (value as { toString: () => string }).toString?.();
      if (str && str !== "[object Object]") {
        return str;
      }
    } catch {
      // ignore
    }
  }
  return null;
};

const resolveJudgeId = (judge: Judge): string | null => {
  const directId = toStringId(judge?.id);
  if (directId) return directId;

  const judgeAny = judge as unknown as { _id?: unknown };
  const objectId = toStringId(judgeAny?._id);
  if (objectId) return objectId;

  const judgeUser = judge?.user as unknown as { id?: unknown; _id?: unknown } | undefined;
  const userId = toStringId(judgeUser?.id);
  if (userId) return userId;

  const userObjectId = toStringId(judgeUser?._id);
  if (userObjectId) return userObjectId;

  return null;
};

const toStringId = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    try {
      const str = (value as { toString: () => string }).toString?.();
      if (str && str !== "[object Object]") {
        return str;
      }
    } catch {
      // ignore
    }
  }
  return null;
};

const resolveJudgeId = (judge: Judge): string | null => {
  const directId = toStringId(judge?.id);
  if (directId) return directId;

  const judgeAny = judge as unknown as { _id?: unknown };
  const objectId = toStringId(judgeAny?._id);
  if (objectId) return objectId;

  const judgeUser = judge?.user as unknown as { id?: unknown; _id?: unknown } | undefined;
  const userId = toStringId(judgeUser?.id);
  if (userId) return userId;

  const userObjectId = toStringId(judgeUser?._id);
  if (userObjectId) return userObjectId;

  return null;
};

const JudgeSelector = ({ value, onChange, disabled, placeholder }: JudgeSelectorProps) => {
  const { data, isLoading } = useAdminJudges();

  const options = useMemo(() => {
    const judges = Array.isArray(data?.items) ? (data.items as Judge[]) : [];

    const mapped = judges
      .map((judge) => {
        const rawId = resolveJudgeId(judge);
        if (!rawId) {
          return null;
        }

        const baseLabel =
          judge?.user?.name ||
          judge?.user?.email ||
          judge?.id ||
          rawId;

        const capacityLabel =
          typeof judge?.capacity === "number" && judge.capacity > 0
            ? ` (cap ${judge.capacity})`
            : "";

        return {
          value: rawId,
          label: `${baseLabel}${capacityLabel}`,
        };
      })
      .filter((option): option is { value: string; label: string } => Boolean(option));

    const seen = new Set<string>();
    return mapped.filter((option) => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [data]);
<<<<<<< Updated upstream
=======
>>>>>>> a582a459a026773c088d0a1851f4e2816ef5e273
>>>>>>> Stashed changes

  return (
    <Select
      mode="multiple"
      showSearch
      allowClear
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      loading={isLoading}
      options={options}
      optionFilterProp="label"
    />
  );
};

export default JudgeSelector;
