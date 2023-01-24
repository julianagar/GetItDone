console.log("Javascript started");

let taskList = [];

chrome.storage.sync.get(["taskList"], (result) => {
    
    if (result.taskList) {
        
        taskList = result.taskList;
    } 
    
    else {
        
        chrome.storage.sync.set({"taskList": []});
        
    }
    
    displayTaskList();
    
});

//Above code to load taskList from storage if possible.

function displayTaskList() {
    
    const taskListElement = document.getElementById("taskList");
    
    const completedTasksElement = document.getElementById("completedTasks");
    
    taskListElement.innerHTML = ""; //clear rather than append because append logic gets messy fast.
    
    completedTasksElement.innerHTML = "";
    
    // Below code actually starts rendering
    
    for (let i = 0; i < taskList.length; i++) {
        
        const task = taskList[i];
        
        const taskElement = document.createElement("li");
        // taskElement.classList.add("tasks")
        
        //Marks as complete or incomplete for later
        
        if (task.completed == true) {
            
            taskElement.classList.add("Completed");
            
        } else {
            
            taskElement.classList.add("Incomplete");
            
        }
        
        const taskButton = document.createElement("a");
        
        taskButton.innerText = task.text;
        
        taskButton.addEventListener("click", () => {
            
            //Somehow make this code more elegant(it switches to a task detail view)
            document.querySelector('html').innerHTML = `
                <head>
                    <meta charset="UTF-8" /> 
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="stylesheet" href="toDoTaskStyles.css" />    
            
                    <!--- bootstrap -->
                     <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">


    
                </head>
                <body>
            
                <span class="header">
                    <h2>${taskButton.innerText}</h2>
                    <a href="./toDoIndex.html"><button id="back" class="btn btn-outline-danger back-btn">dismiss</button></a>
                </span>
                <br> 

                <p></p>
                
                <div class="due-dates">
                    <input type="datetime-local" id="dueDate"></input>
                    <br>

                    <button class="btn btn-outline-primary addtask" id="setDueDate">Set Due Date</button>

                    <input type="text" id="reminderTime"></input>
                    <button class="btn btn-outline-primary addtask" id="setReminder">Remind me x minutes before</button>
                </div>
            
                
            
                </body>
            
            `;
            
            const setDueDateButton = document.getElementById("setDueDate");
            
            setDueDateButton.addEventListener("click", () => {
                
                console.log("setDueDate button clicked");
                
                task.dueDate = new Date(document.getElementById("dueDate").value);
                
                console.log(task.dueDate);
                
                console.log(task.dueDate.getTime());
                
                (async () => {
                    const response = await chrome.runtime.sendMessage({type: "setDueDate", alarmName: task.text, dueDate: task.dueDate.getTime()});
                    
                    console.log(response);
                    
                })();
            });

            const setReminderButton = document.getElementById("setReminder");

            setReminderButton.addEventListener("click", () => {

                console.log("setReminder button clicked");

                task.dueDate = new Date(document.getElementById("dueDate").value);

                console.log(task.dueDate);

                let reminderTime = document.getElementById("reminderTime").value;

                console.log(reminderTime);

                let remindDate = task.dueDate - reminderTime*1000*60;

                console.log(remindDate);

                (async () => {
                    
                    //Below line isn't sending the message for some reason?
                    const response = await chrome.runtime.sendMessage({type: "setReminder", alarmName: `Reminder for ${task.text} which is due in ${reminderTime} minutes`, remindDate: remindDate});
                    
                    console.log(response);

                })();

            });

        });
        
        const removeButton = document.createElement("button");
        
        removeButton.innerText = "X";

        removeButton.classList.add("btn")
        removeButton.classList.add("btn-danger")
        removeButton.classList.add("remove-button")
        
        removeButton.addEventListener("click", () => {
            
            removeTask(i);
            
            displayTaskList(); //Display task here rather than in the function because the functions should only modify taskList, not display it.
            
        });
        
        const checkbox = document.createElement("input");
        
        checkbox.type = "checkbox";
        
        checkbox.checked = task.completed; // If task is not completed, it will be unchecked. If task is completed, it will be checked.
        
        checkbox.addEventListener("click", () => {
            
            toggleTask(i); //Saves what happened a few lines above to the taskList
            
            displayTaskList();
            
        });
        
        taskElement.appendChild(checkbox);
        
        taskElement.appendChild(taskButton);
        
        taskElement.appendChild(removeButton);
        
        if (taskElement.className == "Completed") {
            
            completedTasksElement.appendChild(taskElement);
            
        } else {
            
            taskListElement.appendChild(taskElement);
            
        }
    }
    
}

function addTask(text) {
    
    console.log("Task being added...");
    
    taskList.push({
        
        text: text,
        
        completed: false,

        addedDate: new Date(),
        
        dueDate: new Date()
        
    });
    
    storeList();
    
}

function removeTask(index) {
    
    console.log("Task being removed...");
    
    taskList.splice(index, 1);
    
    storeList();
    
}

function toggleTask(index) {
    
    taskList[index].completed = !taskList[index].completed;
    
    storeList();
    
}

function storeList() {
    
    chrome.storage.sync.set({"taskList": taskList});
    
    const result = [];
    
    for (let i = 0; i < taskList.length; i++) {
        
        result.push(`{Text: ${taskList[i].text}, Completed: ${taskList[i].completed}}`);
        
        console.log(`taskList has been stored as: ${result}`);
        
    }
    
}

const addTaskButton = document.getElementById("addTask"); 

addTaskButton.addEventListener("click", () => {
    
    const taskContent = document.getElementById("taskContent");
    
    const taskText = taskContent.value.trim(); //Remove whitespace
    
    if (taskText !== "") {
        
        addTask(taskContent.value);
        
        taskContent.value = '';
        
        displayTaskList();
    }
    
});

var startingMinutes;
var startingSeconds;
var time;

const countdownEl = document.getElementById('countdown');
const startButton = document.getElementById('Start');
const stopButton = document.getElementById("Stop");
const resetButton = document.getElementById("Reset");

function displayCountdown() {
    
    console.log("Displaying countdown...")
    
    chrome.storage.local.get(["timeLeft"], (result) => {
        
        const time = result.timeLeft;
        
        let minutes = Math.floor(time / 60);
        
        let seconds = time % 60;
        
        seconds = seconds < 10 ? '0' + seconds : seconds;
        
        // Ugly conditionals to make sure it doesn't display weird things.
        
        if (minutes == -1) {
            
            minutes = 0;
            
        }
        
        if (seconds == "0-1") {
            
            seconds = "00";
            
        }
        
        countdownEl.innerText = `${minutes}: ${seconds}`;
        
    });
    
}

displayCountdown();

setInterval(displayCountdown, 1000);

startButton.addEventListener("click", () => {
    
    console.log("Starting countdown...");
    
    // If user does not enter a number, it will default to 25 minutes
    startingMinutes = Number(document.getElementById("StartingMinutes").value);
    
    startingSeconds = Number(document.getElementById("StartingSeconds").value);
    
    time = startingMinutes * 60 + startingSeconds;
    
    if (time <= 0) {
        
        startingMinutes = 25;
        
        startingSeconds = 0;
        
        time = startingMinutes * 60 + startingSeconds;
        
    }
    
    chrome.storage.local.set({
        
        timeLeft: time,
        
        isRunning: true
        
    });
    
}); 

stopButton.addEventListener("click", () => {
    
    console.log("Stopping countdown...");
    
    chrome.storage.local.set({
        
        isRunning: false,
        
    });
    
});

resetButton.addEventListener("click", () => {
    
    console.log("Resetting countdown...");
    
    chrome.storage.local.set({
        
        timeLeft: -1,
        
        isRunning: false
        
    });
    
}); 
