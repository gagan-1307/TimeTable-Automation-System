const router = require("express").Router();
const multer = require("multer");
const upload = multer();

const { uploadRoomExcel } = require("../controllers/upload.controller");
const { auth } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");

router.post("/room", auth, isAdmin, upload.single("file"), uploadRoomExcel);

module.exports = router;
