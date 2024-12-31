const apiUrl = 'http://localhost:3000';

let token = '';

document.getElementById('registerBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    alert((await res.json()).message);
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
        token = data.token;
        loadTasks();
    } else {
        alert(data.error);
    }
});

async function loadTasks() {
    const res = await fetch(`${apiUrl}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await res.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = tasks.map(task =>
        `<li>${task.title} - ${task.description}</li>`
    ).join('');
}

document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const res = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, dueDate: new Date().toISOString() })
    });
    if (res.ok) {
        loadTasks();
    } else {
        alert((await res.json()).error);
    }
});
