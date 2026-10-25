
require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT);

app.use(express.json());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.send("Hello, Express is up and running!");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Student Task Management API is running"
    });
});

app.get("/api/tasks", async (req, res) => {
    try {
        const [tasks] = await pool.query("SELECT * FROM tasks");
        res.json(tasks);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

app.post("/api/tasks", async (req, res) => {
    const { title, description, due_date } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO tasks (title, description, due_date) VALUES (?, ?, ?)",
            [title.trim(), description || null, due_date || null]
        );

        res.status(201).json({
            message: "Task created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Failed to create task" });
    }
});

app.put("/api/tasks/:id", async (req, res) => {
    const { title, description, status, due_date } = req.body;
    const { id } = req.params;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        const [result] = await pool.query(
            `UPDATE tasks
             SET title = ?, description = ?, status = ?, due_date = ?
             WHERE id = ?`,
            [
                title.trim(),
                description || null,
                status || "pending",
                due_date || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task updated successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Failed to update task" });
    }
});

app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM tasks WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Failed to delete task" });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
