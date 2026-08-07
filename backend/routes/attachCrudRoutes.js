const { protect, requireRole } = require("../middleware/auth");

/**
 * Mounts the standard set of routes on `router` for a crudFactory instance:
 *   GET    /            public list (filtered)
 *   GET    /admin       full list, requires one of writeRoles
 *   GET    /:idOrSlug    public getOne (filtered)
 *   GET    /admin/:idOrSlug   full getOne, requires one of writeRoles
 *   POST   /            requires one of writeRoles
 *   PATCH  /:idOrSlug    requires one of writeRoles
 *   DELETE /:idOrSlug    requires one of writeRoles (or deleteRoles if provided)
 *
 * Pass `publicRead: false` to skip mounting the public GET routes entirely
 * (e.g. for admin-only resources like coupons).
 */
function attachCrudRoutes(router, crud, { writeRoles = ["admin"], deleteRoles = null, publicRead = true } = {}) {
  const guard = [protect, requireRole(...writeRoles)];
  const deleteGuard = deleteRoles ? [protect, requireRole(...deleteRoles)] : guard;

  if (publicRead) {
    router.get("/", crud.list(true));
    router.get("/:idOrSlug", crud.getOne(true));
  }

  router.get("/admin/all", ...guard, crud.list(false));
  router.get("/admin/:idOrSlug", ...guard, crud.getOne(false));
  router.post("/", ...guard, crud.create);
  router.patch("/:idOrSlug", ...guard, crud.update);
  router.delete("/:idOrSlug", ...deleteGuard, crud.remove);

  return router;
}

module.exports = attachCrudRoutes;
