let taskFiles = [];
let usersExist = false;
let studentRows = [];
let headers = [];
let taskQuantity = 0;
let pointOrder = false;
let taskCount = 0;
let studentsWithoutGit = [];
let showStudentsWithoutGit = false;




document.getElementById('taskFiles').addEventListener('change', parseFiles);
document.getElementById('userFiles').addEventListener('change', parsePeppiUsers);
document.querySelector('#export').addEventListener('click', exportCsv);
document.querySelector('#ordernames').addEventListener('click', setOrder);
document.querySelector('#orderpoints').addEventListener('click', setOrder);
document.querySelector('#gitnames').addEventListener('click', ()=> {
    showStudentsWithoutGit = !showStudentsWithoutGit;
    createTable();
})

function setOrder(e){       
    pointOrder = e.currentTarget.id == 'orderpoints';
    createTable();
}

/**
 * Process assignment files and users file.
 */
function parseFiles(e) {
    studentRows = [];
    studentsWithoutGit = [];
    headers = [];
    taskCount = 0;
    taskFiles = [...e.currentTarget.files];

    taskFiles.sort((x, y) => x.name.localeCompare(y.name));
    taskQuantity = taskFiles.length;
}

function parsePeppiUsers(e){
    // open the users file
    let file = e.currentTarget.files[0];
    let reader = new FileReader();
    usersExist = true;
    reader.addEventListener('load', getPeppiUsers);
    reader.readAsText(file);
    processTaskFiles();
}


/**
 * Parses the users from users file.
 */
function getPeppiUsers(event) {

    const USERS_FILE_LNAME_INDEX = 0;
    const USERS_FILE_FNAME_INDEX = 1;
    const USERS_FILE_STUDENT_EMAIL_INDEX = 3;
    const USERS_FILE_STUDENT_ID_INDEX = 4;

    let users = event.target.result;
    let userRows = users.split('\n');
    
    // skip the first row because it's the header
    for (let i = 1; i < userRows.length; i++) {
        const r = userRows[i];

        let userArray = r.split(',');

        //Omitting empty row
        if (userArray.length < 3) {
            return;
        }

        let studentEmail = userArray[USERS_FILE_STUDENT_EMAIL_INDEX]?.trim();
        let name = userArray[USERS_FILE_LNAME_INDEX] + ' ' + userArray[USERS_FILE_FNAME_INDEX];
        let studentId = userArray[USERS_FILE_STUDENT_ID_INDEX]?.trim();

        studentRows.push({ name, studentEmail, studentId, points: Array(taskQuantity).fill(0), sum: 0 });
    }
    debugger

    //Processing task files after peppiUsers.csv is parsed 
    processTaskFiles();
}

/**
 * Process all the assignment files
 */
function processTaskFiles() {
    taskFiles.forEach(file => {
        const reader = new FileReader();
        reader.addEventListener('load', getTasks);
        reader.readAsText(file);
    });
}

/**
 * Parse single assignment file
 */
function getTasks(event) {

    const TASK_FILE_GITHUB_USERNAME_INDEX = 3;
    const TASK_FILE_STUDENT_EMAIL_INDEX = 4;
    const TASK_FILE_POINTS_TASK_INDEX = 8;    

    let taskContent = event.target.result;
    let rows = taskContent.replaceAll('"', '').split('\n');

    if (rows.length <= 1) return;

    //Get the assignment name from first user row
    let name = rows[1].split(',')[0];
    debugger

    //Add the assignment name to table headers
    headers.push(name);

    //Iterate the assignment rows
    for (let i = 1; i < rows.length; i++) {

        let rowValues = rows[i].split(',');
        if (rowValues.length < 3) {
            continue;
        }

        //Get git username and points from the row.
        let gitName = rowValues[TASK_FILE_GITHUB_USERNAME_INDEX]?.trim();
        let studentEmail = rowValues[TASK_FILE_STUDENT_EMAIL_INDEX]?.trim();
        let points = Number(rowValues[TASK_FILE_POINTS_TASK_INDEX].trim());

        let student = studentRows.find(s => s.studentEmail == studentEmail);

        //Update task points for exising student or add a new student.
        if (student) {
            student.points[taskCount] = points;
            student.gitName = gitName;
            student.sum += points;
        } else {
            student = { gitName, name: '', studentEmail, studentId: null, points: Array(taskFiles.length).fill(0), sum: 0 };
            student.points[taskCount] = points;
            student.sum += points;
            studentRows.push(student);
        }

    }

    taskCount++;

    //Create the table after all assigments are processed
    if (taskCount == taskFiles.length) {
        createTable();
    }
}

/**
 * Create the table from headers and assignment data
 */
function createTable() {

    let table = document.querySelector('table');
    table.replaceChildren([]);

    let tableRows = studentRows;
    if(showStudentsWithoutGit){
        tableRows = [...tableRows, ...studentsWithoutGit];
    }

    if (pointOrder) {
        tableRows.sort((x, y) => x.sum > y.sum ? 1 : -1);
    } else {
        tableRows.sort((x, y) => x.name.localeCompare(y.name))
    }

    for (const student of tableRows) {
        let row = table.insertRow();
        //Omit name column if there's no users file processed
        if (usersExist) {
            row.insertCell().textContent = student.name;
        }
        row.insertCell().textContent = student.gitName;
        row.insertCell().textContent = student.studentEmail;
        row.insertCell().textContent = student.studentId;
        row.insertCell().textContent = student.sum;
        student.points.forEach(p => row.insertCell().textContent = p);
    }

    //Create table headers

    let thead = table.createTHead().insertRow();

    if (usersExist) {
        table.classList.add('users')
        thead.insertCell().textContent = 'Name';
    }else{
        table.classList.remove('users');
    }

    thead.insertCell().textContent = 'Git name';
    thead.insertCell().textContent = 'Student email';
    thead.insertCell().textContent = 'Student id';
    thead.insertCell().textContent = 'Sum';
    debugger
    headers.forEach(h => {
        thead.insertCell().textContent = h;
    })
    
}


/**
 * Exports table data to CSV
 */
function exportCsv(){
    let tableRows = studentRows;
    if(showStudentsWithoutGit){
        tableRows = [...tableRows, ...studentsWithoutGit];
    }

    let fileString = '\ufeff';
    fileString += 'Name,';
    fileString += 'Git username,';
    fileString += 'Student email,';
    fileString += 'Student id,';
    headers.forEach(h => fileString += `${h},`);
    fileString += 'Sum\n';
    
    for (const student of tableRows) {
        fileString += student.name;
        fileString += ',' + student.gitName;
        fileString += ',' + student.studentEmail;
        fileString += ',' + student.studentId;
        student.points.forEach( p => fileString += ',' + p);
        fileString += ',' + student.sum + '\n';
    }

    let b = new Blob([fileString], {type: 'text/csv'});
    const link = document.createElement('a');
    link.download = 'clasroom'+Date.now();
    link.href = URL.createObjectURL(b);
    link.click();

}