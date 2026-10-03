const buildQuery = (query) => {
  const filter = { ...(query || {}) };
  Object.keys(filter).forEach((key) => {
    if (filter[key] === "" || filter[key] === undefined || filter[key] === null) {
      delete filter[key];
    }
  });
  return filter;
};

const getPagination = (query, maxPageSize = 100) => {
  const page = Math.max(1, Number(query.page) || 1);
  const requested = Number(query.limit) || 12;
  const limit = Math.min(Math.max(1, requested), maxPageSize);
  return { page, limit, skip: (page - 1) * limit };
};

const paginated = (data, total, { page, limit }) => ({
  items: data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
  },
});

module.exports = { buildQuery, getPagination, paginated };
