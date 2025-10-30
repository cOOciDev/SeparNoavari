import type { ReactNode } from "react";
import { useMemo } from "react";
import { Empty, Grid, Table } from "antd";
import type { TableProps, TablePaginationConfig } from "antd/es/table";
import type { FilterValue, SorterResult } from "antd/es/table/interface";
import type { ColumnsType, ColumnGroupType, ColumnType } from "antd/es/table";
import s from "../../styles/panel.module.scss";

const { useBreakpoint } = Grid;

type DataTableOnChange<RecordType> = (
  pagination: TablePaginationConfig,
  filters: Record<string, FilterValue | null>,
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  extra: Parameters<NonNullable<TableProps<RecordType>["onChange"]>>[3]
) => void;

type StackBreakpoint = "sm" | "md" | "lg";

type DataTableProps<RecordType extends object> = TableProps<RecordType> & {
  onTableChange?: DataTableOnChange<RecordType>;
  stackBreakpoint?: StackBreakpoint;
};

function isColumnGroup<RecordType>(
  column: ColumnType<RecordType> | ColumnGroupType<RecordType>
): column is ColumnGroupType<RecordType> {
  return Array.isArray((column as ColumnGroupType<RecordType>).children);
}

function flattenColumns<RecordType>(columns: ColumnsType<RecordType>): ColumnType<RecordType>[] {
  const result: ColumnType<RecordType>[] = [];
  columns.forEach((column) => {
    if (isColumnGroup(column)) {
      result.push(...flattenColumns(column.children ?? []));
    } else {
      result.push(column);
    }
  });
  return result;
}

function getDataIndexValue(record: Record<string, unknown>, dataIndex: ColumnType<any>["dataIndex"]): unknown {
  if (Array.isArray(dataIndex)) {
    return dataIndex.reduce<unknown>((value, key) => {
      if (value === undefined || value === null) return value;
      if (typeof value === "object" && value !== null && key in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>)[key as keyof typeof value];
      }
      return undefined;
    }, record);
  }

  if (typeof dataIndex === "number" || typeof dataIndex === "string") {
    return record[dataIndex as keyof typeof record];
  }

  return undefined;
}

function getColumnLabel<RecordType>(column: ColumnType<RecordType>): ReactNode {
  if (column.title && typeof column.title !== "function") return column.title;
  if (column.key) return column.key;
  const dataIndex = column.dataIndex;
  if (Array.isArray(dataIndex)) return dataIndex.join(" / ");
  if (dataIndex !== undefined) return String(dataIndex);
  return "Field";
}

function columnVisibleOnStack<RecordType>(column: ColumnType<RecordType>, breakpoint: StackBreakpoint): boolean {
  if (!Array.isArray(column.responsive) || column.responsive.length === 0) {
    return true;
  }

  const order: Record<string, number> = { xs: 0, sm: 1, md: 2, lg: 3, xl: 4, xxl: 5 };
  const limit = breakpoint === "sm" ? order.sm : breakpoint === "lg" ? order.lg : order.md;
  return column.responsive.some((bp) => (order[bp] ?? 99) <= limit);

}
function resolveRowKey<RecordType extends object>(
  rowKey: TableProps<RecordType>["rowKey"],
  record: RecordType,
  index: number
): React.Key {
  if (typeof rowKey === "function") {
    return rowKey(record);
  }
  if (typeof rowKey === "string") {
    const value = (record as Record<string, unknown>)[rowKey];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }
  const fallback = (record as Record<string, unknown>).key;
  if (typeof fallback === "string" || typeof fallback === "number") {
    return fallback;
  }
  return index;
}

function renderCell<RecordType extends object>(
  column: ColumnType<RecordType>,
  record: RecordType,
  rowIndex: number
): ReactNode {
  const rawValue = column.dataIndex !== undefined ? getDataIndexValue(record as Record<string, unknown>, column.dataIndex) : undefined;

  if (typeof column.render === "function") {
    const rendered = column.render(rawValue, record, rowIndex);
    if (rendered === null || rendered === undefined || rendered === "") {
      return "—";
    }
    if (typeof rendered === "object" && rendered !== null && "children" in (rendered as Record<string, unknown>)) {
      return (rendered as Record<string, unknown>).children as ReactNode;
    }
    return rendered as ReactNode;
  }

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "—";
  }

  return rawValue as ReactNode;
}

const DataTable = <RecordType extends object>({
  onTableChange,
  stackBreakpoint = "md",
  pagination,
  scroll,
  size,
  className,
  columns: columnsProp,
  dataSource: dataSourceProp,
  rowKey,
  ...tableProps
}: DataTableProps<RecordType>) => {
  const screens = useBreakpoint();
  const columns = useMemo(() => (columnsProp ?? []) as ColumnsType<RecordType>, [columnsProp]);
  const flatColumns = useMemo(() => flattenColumns(columns), [columns]);
  const dataSource = useMemo(() => (dataSourceProp ?? []) as RecordType[], [dataSourceProp]);

  const hasBreakpointInfo = Object.values(screens).some(Boolean);
  const activeBreakpoint = stackBreakpoint === "sm" ? screens.sm : stackBreakpoint === "lg" ? screens.lg : screens.md;
  const shouldStack = hasBreakpointInfo && !activeBreakpoint && flatColumns.length > 0;

  const stackColumns = useMemo(() => {
    if (!shouldStack) return [] as ColumnType<RecordType>[];
    return flatColumns.filter((column) => {
      if (!column) return false;
      if ((column as Record<string, unknown>).hideInCard) return false;
      return columnVisibleOnStack(column, stackBreakpoint);
    });
  }, [flatColumns, shouldStack, stackBreakpoint]);

  const cardNodes = useMemo(() => {
    if (!shouldStack || stackColumns.length === 0 || dataSource.length === 0) {
      return [] as ReactNode[];
    }

    const [primaryColumn, ...detailColumns] = stackColumns;

    return dataSource.map((record, rowIndex) => {
      const key = resolveRowKey(rowKey, record, rowIndex);
      const primaryValue = renderCell(primaryColumn, record, rowIndex);

      return (
        <article key={String(key)} className={s.tableCard}>
          <div className={s.tableCardHeader}>
            <span className={s.tableCardLabel}>{getColumnLabel(primaryColumn)}</span>
            <span className={s.tableCardPrimary}>{primaryValue}</span>
          </div>
          {detailColumns.length ? (
            <div className={s.tableCardBody}>
              {detailColumns.map((column, columnIndex) => (
                <div
                  key={String(column.key ?? column.dataIndex ?? columnIndex)}
                  className={s.tableCardRow}
                >
                  <span className={s.tableCardLabel}>{getColumnLabel(column)}</span>
                  <span className={s.tableCardValue}>{renderCell(column, record, rowIndex)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      );
    });
  }, [dataSource, rowKey, shouldStack, stackColumns]);

  const mergedPagination = useMemo(() => {
    if (pagination === false) return false;
    return {
      showSizeChanger: true,
      pageSize: 10,
      position: ["bottomRight"],
      ...pagination,
    } as TablePaginationConfig;
  }, [pagination]);

  const mergedScroll = useMemo(() => {
    if (scroll) {
      return { ...scroll, x: scroll.x ?? "max-content" };
    }
    return { x: "max-content" as const };
  }, [scroll]);

  const tableClassName = [s.tableDesktop, className ?? ""].filter(Boolean).join(" ");
  const stacked = shouldStack && stackColumns.length > 0;

  const cardContent = useMemo(() => {
    if (!stacked) return null;
    if (cardNodes.length === 0) {
      const empty = tableProps.locale?.emptyText;
      const emptyNode = typeof empty === "function" ? empty() : empty;
      return (
        <div className={s.tableCardEmpty}>
          {emptyNode ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" />}
        </div>
      );
    }
    return cardNodes;
  }, [cardNodes, stacked, tableProps.locale]);

  return (
    <div className={s.tableContainer} data-stacked={stacked ? "true" : "false"}>
      {cardContent ? <div className={s.tableCards}>{cardContent}</div> : null}
      <Table<RecordType>
        {...tableProps}
        className={tableClassName}
        columns={columnsProp}
        dataSource={dataSourceProp}
        size={size ?? "middle"}
        scroll={mergedScroll}
        pagination={mergedPagination}
        rowKey={rowKey}
        onChange={(paginationConfig, filters, sorter, extra) => {
          onTableChange?.(paginationConfig, filters, sorter, extra);
        }}
      />
    </div>
  );
};

export default DataTable;





