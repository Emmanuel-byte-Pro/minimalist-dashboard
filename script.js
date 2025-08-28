document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switcher ---
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode-btn');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    if (toggleDarkModeBtn) {
        toggleDarkModeBtn.addEventListener('click', () => {
            const isDarkMode = document.body.classList.contains('dark-mode');
            if (isDarkMode) {
                localStorage.setItem('theme', 'light');
                applyTheme('light');
            } else {
                localStorage.setItem('theme', 'dark');
                applyTheme('dark');
            }
        });
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // --- Clock Widget ---
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}`;
        }
        setInterval(updateClock, 1000);
        updateClock();
    }

    // --- Calendar Widget ---
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    let currentlyDisplayedDate = new Date();

    function updateCalendar() {
        if (!calendarGrid || !calendarMonthYear) return;

        const today = new Date();
        const month = currentlyDisplayedDate.getMonth();
        const year = currentlyDisplayedDate.getFullYear();

        calendarMonthYear.textContent = `${currentlyDisplayedDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const totalDaysInMonth = lastDayOfMonth.getDate();

        let calendarHTML = '<thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead><tbody>';

        let day = 1;
        for (let i = 0; i < 6; i++) { // 6 rows for the calendar
            calendarHTML += '<tr>';
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfWeek) {
                    calendarHTML += '<td></td>';
                } else if (day > totalDaysInMonth) {
                    calendarHTML += '<td></td>';
                } else {
                    let cellClass = '';
                    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        cellClass = 'class="today"';
                    }
                    calendarHTML += `<td ${cellClass}>${day}</td>`;
                    day++;
                }
            }
            calendarHTML += '</tr>';
        }
        calendarHTML += '</tbody>';
        calendarGrid.innerHTML = calendarHTML;
    }

    document.getElementById('prev-month-btn').addEventListener('click', () => {
        currentlyDisplayedDate.setMonth(currentlyDisplayedDate.getMonth() - 1);
        updateCalendar();
    });
    document.getElementById('next-month-btn').addEventListener('click', () => {
        currentlyDisplayedDate.setMonth(currentlyDisplayedDate.getMonth() + 1);
        updateCalendar();
    });
    document.getElementById('prev-year-btn').addEventListener('click', () => {
        currentlyDisplayedDate.setFullYear(currentlyDisplayedDate.getFullYear() - 1);
        updateCalendar();
    });
    document.getElementById('next-year-btn').addEventListener('click', () => {
        currentlyDisplayedDate.setFullYear(currentlyDisplayedDate.getFullYear() + 1);
        updateCalendar();
    });

    updateCalendar();

    // --- Task List Widget ---
    const taskList = document.getElementById('task-list');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    if (taskList && taskInput && addTaskBtn) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
        function renderTasks() {
            taskList.innerHTML = '';
            tasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span><button class="delete-btn" data-index="${index}">X</button>`;
                li.addEventListener('click', () => toggleTask(index));
                taskList.appendChild(li);
            });
        }
        function addTask() {
            const text = taskInput.value.trim();
            if (text) {
                tasks.push({ text, completed: false });
                taskInput.value = '';
                saveTasks();
                renderTasks();
            }
        }
        function toggleTask(index) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks();
            renderTasks();
        }
        function deleteTask(index) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
        taskList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                e.stopPropagation();
                deleteTask(e.target.dataset.index);
            }
        });
        renderTasks();
    }

    // --- Gemini AI Assistant Widget ---
    const geminiChatHistory = document.getElementById('gemini-chat-history');
    const geminiInput = document.getElementById('gemini-input');
    const sendToGeminiBtn = document.getElementById('send-to-gemini-btn');

    function appendMessage(sender, message) {
        if (!geminiChatHistory) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('gemini-message', `${sender}-message`);
        messageElement.textContent = message;
        geminiChatHistory.appendChild(messageElement);
        geminiChatHistory.scrollTop = geminiChatHistory.scrollHeight;
    }

    if (typeof self.generativeAI !== 'undefined') {
        try {
            const GEMINI_API_KEY = "AIzaSyCDInLgs25ZFXUDrUBPD7Vz8ZWGjjwy2a0";
            const ai = new self.generativeAI.GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const geminiModel = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

            async function sendMessageToGemini() {
                const prompt = geminiInput.value.trim();
                if (!prompt) return;
                geminiInput.value = '';
                appendMessage('user', prompt);
                appendMessage('model', 'Thinking...');
                try {
                    const result = await geminiModel.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    if (geminiChatHistory.lastChild) {
                        geminiChatHistory.lastChild.remove();
                    }
                    appendMessage('model', text);
                } catch (error) {
                    console.error("Error calling Gemini API:", error);
                    if (geminiChatHistory.lastChild) {
                        geminiChatHistory.lastChild.remove();
                    }
                    appendMessage('model', 'Sorry, an error occurred.');
                }
            }

            if (sendToGeminiBtn && geminiInput) {
                sendToGeminiBtn.addEventListener('click', sendMessageToGemini);
                geminiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessageToGemini(); });
            }

        } catch (e) {
            console.error("Failed to initialize Gemini AI Widget:", e);
            if(geminiInput) geminiInput.disabled = true;
            if(sendToGeminiBtn) sendToGeminiBtn.disabled = true;
            appendMessage('model', 'Gemini AI could not be loaded.');
        }
    } else {
        console.error("Google Gen AI SDK not loaded.");
        if(geminiInput) geminiInput.disabled = true;
        if(sendToGeminiBtn) sendToGeminiBtn.disabled = true;
        appendMessage('model', 'Gemini AI SDK not loaded.');
    }

    // --- Lock Screen Widget ---
    const lockBtn = document.getElementById('lock-btn');
    const lockScreenOverlay = document.getElementById('lock-screen-overlay');
    const lockScreenClock = document.getElementById('lock-screen-clock');
    const unlockBtn = document.getElementById('unlock-btn');
    const passwordInput = document.getElementById('lock-screen-password');
    const LOCK_SCREEN_PASSWORD = "2930";

    if (lockBtn && lockScreenOverlay && unlockBtn && passwordInput) {
        lockBtn.addEventListener('click', () => {
            lockScreenOverlay.classList.remove('hidden');
            updateLockScreenClock();
        });

        unlockBtn.addEventListener('click', () => {
            if (passwordInput.value === LOCK_SCREEN_PASSWORD) {
                lockScreenOverlay.classList.add('hidden');
                passwordInput.value = '';
            } else {
                passwordInput.value = '';
                const inputContainer = document.querySelector('.lock-screen-input-container');
                inputContainer.classList.add('shake');
                setTimeout(() => {
                    inputContainer.classList.remove('shake');
                }, 500);
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                unlockBtn.click();
            }
        });
    }

    function updateLockScreenClock() {
        if (!lockScreenClock) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        lockScreenClock.textContent = `${hours}:${minutes}`;
    }

    setInterval(updateLockScreenClock, 1000);

    // --- Work Mode ---
    const workModeBtn = document.getElementById('work-mode-btn');
    const exitWorkModeBtn = document.getElementById('exit-work-mode-btn');

    // --- Stopwatch Widget ---
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    let stopwatchInterval = null;
    let stopwatchStartTime = 0;

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function startStopwatch() {
        if (stopwatchInterval) return; // Already running
        stopwatchStartTime = Date.now();
        stopwatchInterval = setInterval(() => {
            const elapsedTime = Date.now() - stopwatchStartTime;
            stopwatchDisplay.textContent = formatTime(elapsedTime);
        }, 1000);
    }

    function stopStopwatch() {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }

    function resetStopwatch() {
        stopStopwatch();
        stopwatchDisplay.textContent = "00:00:00";
    }


    // --- Last Activation Widget ---
    const lastActivationTimeElement = document.getElementById('last-activation-time');

    function displayLastActivationTime() {
        const lastActivation = localStorage.getItem('lastWorkModeActivation');
        if (lastActivation) {
            const date = new Date(lastActivation);
            lastActivationTimeElement.textContent = date.toLocaleString();
        }
    }
    displayLastActivationTime();


    if (workModeBtn && exitWorkModeBtn) {
        workModeBtn.addEventListener('click', () => {
            document.body.classList.add('work-mode-active');
            startStopwatch();
            // Save activation time
            localStorage.setItem('lastWorkModeActivation', new Date().toISOString());
        });

        exitWorkModeBtn.addEventListener('click', () => {
            document.body.classList.remove('work-mode-active');
            resetStopwatch();
        });
    }
});
