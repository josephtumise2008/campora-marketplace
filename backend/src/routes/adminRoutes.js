const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { validateObjectId, requireFields } = require("../middleware/validate");
const controller = require("../controllers/adminController");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/overview", controller.overview);
router.get("/reports", controller.reports);

router.get("/users", controller.listUsers);
router.patch("/users/:id", validateObjectId("id"), controller.updateUser);

router.get("/stores", controller.listStores);
router.patch("/stores/:id", validateObjectId("id"), controller.updateStoreVerification);

router.get("/products", controller.listProducts);
router.get("/orders", controller.listOrders);
router.patch("/orders/:id/status", requireFields(["status"]), validateObjectId("id"), controller.updateOrderStatus);

router.get("/categories", categoryController.list);
router.post("/categories", categoryController.create);
router.patch("/categories/:id", validateObjectId("id"), categoryController.update);
router.delete("/categories/:id", validateObjectId("id"), categoryController.remove);
router.post("/categories/recount", categoryController.recount);

module.exports = router;
