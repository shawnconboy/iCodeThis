const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

let tasks = [];

// Fetch tasks from server
window.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('http://localhost:3000/tasks');
    tasks = await res.json();
    tasks.forEach(task => addTaskToList(task.text, task.done));
});

// Add new task
taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText === "") return;
    tasks.push({ text: taskText, done: false });
    addTaskToList(taskText, false);
    taskInput.value = '';
    saveTasksToServer();
});

function addTaskToList(text, done) {
    const li = document.createElement('li');
    li.textContent = text;
    if (done) li.classList.add('done');

    li.addEventListener('click', () => {
        li.classList.toggle('done');
        const index = Array.from(taskList.children).indexOf(li);
        tasks[index].done = li.classList.contains('done');
        saveTasksToServer();
    });

    taskList.appendChild(li);
}

async function saveTasksToServer() {
    await fetch('http://localhost:3000/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
    });
}
