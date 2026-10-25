
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const alertBox = document.getElementById("alertBox");

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const dueDateInput = document.getElementById("due_date");
const statusInput = document.getElementById("status");

const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const refreshButton = document.getElementById("refreshButton");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

let tasks = [];
let editingTaskId = null;

function showAlert(message, type = "success") {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
}

function hideAlert() {
    alertBox.textContent = "";
    alertBox.className = "alert d-none";
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || result.message || "Request failed");
    }

    return result;
}

async function loadTasks() {
    taskList.textContent = "Loading tasks...";

    try {
        tasks = await apiRequest("/api/tasks");
        renderTasks();
        updateSummary();
    } catch (error) {
        taskList.textContent = "Could not load tasks. Please try again.";
        showAlert(error.message, "danger");
    }
}

function updateSummary() {
    document.getElementById("totalCount").textContent = tasks.length;

    document.getElementById("progressCount").textContent =
        tasks.filter(task => task.status === "in_progress").length;

    document.getElementById("completedCount").textContent =
        tasks.filter(task => task.status === "completed").length;
}

function renderTasks() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search);
        const matchesStatus =
            selectedStatus === "all" || task.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    taskList.replaceChildren();

    if (filteredTasks.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent = tasks.length === 0
            ? "No tasks yet. Add your first task above."
            : "No tasks match your search or filter.";

        taskList.appendChild(emptyState);
        return;
    }

    filteredTasks.forEach(task => {
        const card = document.createElement("article");
        card.className = "task-card";

        const topRow = document.createElement("div");
        topRow.className = "d-flex flex-wrap justify-content-between align-items-start gap-2";

        const title = document.createElement("h3");
        title.className = "task-title mb-2";
        title.textContent = task.title;

        const badge = document.createElement("span");
        badge.className = `status-badge status-${task.status}`;
        badge.textContent = formatStatus(task.status);

        topRow.append(title, badge);

        const description = document.createElement("p");
        description.className = "task-description mb-3";
        description.textContent = task.description || "No description provided.";

        const dueDate = document.createElement("p");
        dueDate.className = "task-meta mb-3";
        dueDate.textContent = task.due_date
            ? `Due: ${String(task.due_date).slice(0, 10)}`
            : "No due date";

        const actions = document.createElement("div");
        actions.className = "d-flex flex-wrap gap-2";

        const statusSelect = document.createElement("select");
        statusSelect.className = "form-select form-select-sm";
        statusSelect.style.width = "auto";
        statusSelect.setAttribute("aria-label", `Status for ${task.title}`);

        [
            ["pending", "Pending"],
            ["in_progress", "In progress"],
            ["completed", "Completed"]
        ].forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            option.selected = task.status === value;
            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener("change", () => {
            updateTask(task, { status: statusSelect.value });
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-outline-primary btn-sm";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => startEditing(task));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-outline-danger btn-sm";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteTask(task));

        actions.append(statusSelect, editButton, deleteButton);
        card.append(topRow, description, dueDate, actions);
        taskList.appendChild(card);
    });
}

function formatStatus(status) {
    return {
        pending: "Pending",
        in_progress: "In progress",
        completed: "Completed"
    }[status] || status;
}

function startEditing(task) {
    editingTaskId = task.id;

    titleInput.value = task.title;
    descriptionInput.value = task.description || "";
    dueDateInput.value = task.due_date
        ? String(task.due_date).slice(0, 10)
        : "";
    statusInput.value = task.status;

    submitButton.textContent = "Save changes";
    cancelEditButton.classList.remove("d-none");

    taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInput.focus();
}

function resetForm() {
    editingTaskId = null;
    taskForm.reset();
    statusInput.value = "pending";
    submitButton.textContent = "Add task";
    cancelEditButton.classList.add("d-none");
}

async function updateTask(task, changes) {
    hideAlert();

    const updatedTask = {
        title: changes.title ?? task.title,
        description: changes.description ?? task.description ?? "",
        status: changes.status ?? task.status,
        due_date: changes.due_date ?? (
            task.due_date ? String(task.due_date).slice(0, 10) : null
        )
    };

    try {
        await apiRequest(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask)
        });

        showAlert("Task updated successfully.");
        await loadTasks();
    } catch (error) {
        showAlert(error.message, "danger");
        await loadTasks();
    }
}

async function deleteTask(task) {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) {
        return;
    }

    hideAlert();

    try {
        await apiRequest(`/api/tasks/${task.id}`, {
            method: "DELETE"
        });

        if (editingTaskId === task.id) {
            resetForm();
        }

        showAlert("Task deleted successfully.");
        await loadTasks();
    } catch (error) {
        showAlert(error.message, "danger");
    }
}

taskForm.addEventListener("submit", async event => {
    event.preventDefault();
    hideAlert();

    const title = titleInput.value.trim();

    if (!title) {
        showAlert("Task title is required.", "danger");
        titleInput.focus();
        return;
    }

    const task = {
        title,
        description: descriptionInput.value.trim(),
        status: statusInput.value,
        due_date: dueDateInput.value || null
    };

    const isEditing = editingTaskId !== null;
    const url = isEditing
        ? `/api/tasks/${editingTaskId}`
        : "/api/tasks";

    const options = {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    };

    submitButton.disabled = true;

    try {
        await apiRequest(url, options);

        showAlert(isEditing
            ? "Task updated successfully."
            : "Task created successfully."
        );

        resetForm();
        await loadTasks();
    } catch (error) {
        showAlert(error.message, "danger");
    } finally {
        submitButton.disabled = false;
    }
});

cancelEditButton.addEventListener("click", () => {
    resetForm();
    hideAlert();
});

refreshButton.addEventListener("click", loadTasks);
searchInput.addEventListener("input", renderTasks);
filterStatus.addEventListener("change", renderTasks);

loadTasks();
