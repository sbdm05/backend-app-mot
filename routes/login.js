const express = require("express");
const router = express.Router();

const { resetPassword } = require("../controllers/login.js");

router.get("/reset-password/:id/:token", resetPassword);

module.exports = router;
