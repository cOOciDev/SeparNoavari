import { ChangeEvent } from "react";
import { Button, Input, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export type SearchBarProps = {
  value: string;
  placeholder?: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onSearch?: () => void;
  onReset?: () => void;
  searchLabel?: string;
  resetLabel?: string;
};

const SearchBar = ({
  value,
  placeholder,
  loading,
  onChange,
  onSearch,
  onReset,
  searchLabel = "Search",
  resetLabel = "Reset",
}: SearchBarProps) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Space.Compact style={{ width: "100%" }}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={handleInputChange}
        onPressEnter={onSearch}
        allowClear
      />
      <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={onSearch}>
        {searchLabel}
      </Button>
      {onReset ? (
        <Button onClick={onReset} disabled={loading}>
          {resetLabel}
        </Button>
      ) : null}
    </Space.Compact>
  );
};

export default SearchBar;
