import { Table } from "antd";
import type { TableProps, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";

type DataTableOnChange<RecordType> = (
  pagination: TablePaginationConfig,
  filters: Record<string, FilterValue | null>,
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  extra: Parameters<NonNullable<TableProps<RecordType>["onChange"]>>[3]
) => void;

type DataTableProps<RecordType extends object> = TableProps<RecordType> & {
  onTableChange?: DataTableOnChange<RecordType>;
};

const DataTable = <RecordType extends object>({
  onTableChange,
  ...rest
}: DataTableProps<RecordType>) => (
  <Table<RecordType>
    {...rest}
    onChange={(pagination, filters, sorter, extra) => {
      onTableChange?.(pagination, filters, sorter, extra);
    }}
  />
);

export default DataTable;
