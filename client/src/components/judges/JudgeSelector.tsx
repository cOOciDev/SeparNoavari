import { Select } from "antd";
import { useMemo } from "react";
import { useAdminJudges } from "../../service/hooks";

export type JudgeSelectorProps = {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

const JudgeSelector = ({ value, onChange, disabled, placeholder }: JudgeSelectorProps) => {
  const { data, isLoading } = useAdminJudges();

  const options = useMemo(
    () =>
      (data?.items ?? []).map((judge) => ({
        key: judge.id,
        label: `${judge.user?.name || judge.user?.email || judge.id}${
          typeof judge.capacity === "number" ? ` (cap ${judge.capacity})` : ""
        }`,
        value: String(judge.id),
      })),
    [data]
  );

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
