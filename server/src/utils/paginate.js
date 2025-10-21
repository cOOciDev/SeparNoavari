export const parsePagination = (query = {}) => {
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || 20, 1),
    100
  );
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  return {
    limit,
    page,
    skip: (page - 1) * limit,
  };
};

export const buildPagedResponse = ({ items, total, limit, page }) => {
  const pages = Math.max(Math.ceil(total / limit), 1);
  return {
    items,
    meta: {
      total,
      page,
      pages,
      limit,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};
