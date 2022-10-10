const express = require("express");
const router = express.Router();

const {
    getTodos,
    createTodo,
    getSingleTodo,
    editTodo,
    deleteTodo,
    login,
    forgotPassword,
    resetPassword,
    getUser,
    createApplication,
    savedApplication,
    deleteApplication,
    saveNewPassword,
} = require("../controllers/todos.js");

router.get("/", getTodos);
router.get("/user", getUser);
router.patch("/user", editTodo);

router.post("/", createTodo);
router.patch("/create-application", createApplication);
router.patch("/saved-application", savedApplication);
router.patch("/delete-application", deleteApplication);

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/save-new-password", saveNewPassword);

router.get("/:id", getSingleTodo);
router.delete("/:id", deleteTodo);

module.exports = router;
