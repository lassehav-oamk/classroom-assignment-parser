let taskFiles = [];
let usersExist = false;
let studentRows = [];
let headers = [];
let taskQuantity = 0;
let pointOrder = false;
let taskCount = 0;
let studentsWithoutGit = [];
let showStudentsWithoutGit = false;

const GIT_TASK_INDEX = 3;
const POINTS_TASK_INDEX = 8;
const LNAME_INDEX = 0;
const FNAME_INDEX = 1;
const GIT_USER_INDEX = 2;

//Setting the table order if changed.
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


document.getElementById('files').addEventListener('change', parseFiles);

/**
 * Process assignment files and users file.
 */
function parseFiles(e) {
    
    headers = [];
    taskCount = 0;
    let files = [...e.currentTarget.files];

    let usersFile = files.find(f => f.name == 'users.csv');
    taskFiles = files.filter(f => f.name != 'users.csv')

    taskFiles.sort((x, y) => x.name.localeCompare(y.name));

    taskQuantity = taskFiles.length;
    usersExist = usersFile ? true : false;

    //Prosessing users file first if it exists
    if (usersFile) {
        const reader = new FileReader();
        reader.addEventListener('load', getUsers);
        reader.readAsText(usersFile);
    } else {
        processTaskFiles();
    }
}


/**
 * Parses the users from users file.
 */
function getUsers(event) {
    let users = event.target.result;
    let userRows = users.split('\n');

    userRows.forEach(r => {
        let userArray = r.split(',');
        //Omitting empty row
        if (userArray.length < 3) {
            return;
        }

        let gitName = userArray[GIT_USER_INDEX]?.trim();
        let name = userArray[LNAME_INDEX] + ' ' + userArray[FNAME_INDEX];


        let studentTarget = gitName.length > 0 ? studentRows : studentsWithoutGit;
        studentTarget.push({ gitName, name, points: Array(taskQuantity).fill(0), sum: 0 });
    });

    //Processing task files after users.csv is parsed
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
    let taskContent = event.target.result;
    let rows = taskContent.replaceAll('"', '').split('\n');

    if (rows.length <= 1) return;

    //Get the assignment name from first user row
    let name = rows[1].split(',')[0];

    //Add the assignment name to table headers
    headers.push(name);

    //Iterate the assignment rows
    for (let i = 1; i < rows.length; i++) {

        let rowValues = rows[i].split(',');
        if (rowValues.length < 3) {
            continue;
        }

        //Get git username and points from the row.
        let gitName = rowValues[GIT_TASK_INDEX]?.trim();
        let p = Number(rowValues[POINTS_TASK_INDEX].trim());

        let student = studentRows.find(s => s.gitName == gitName);

        //Update task points for exising student or add a new student.
        if (student) {
            student.points[taskCount] = p;
            student.sum += p;
        } else {
            let newStudent = { gitName, name: '', points: Array(taskFiles.length).fill(0), sum: 0 };
            newStudent.points[taskCount] = p;
            studentRows.push(newStudent);
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
        student.points.forEach(p => row.insertCell().textContent = p);
        row.insertCell().textContent = student.sum;
    }

    //Create table headers

    let thead = table.createTHead().insertRow();

    if (usersExist) {
        thead.insertCell().textContent = 'Name';
    }

    thead.insertCell().textContent = 'Git name';
    headers.forEach(h => {
        thead.insertCell().textContent = h;
    })
    thead.insertCell().textContent = 'Sum';
}
