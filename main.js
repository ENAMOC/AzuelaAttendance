const firebaseConfig = {
            apiKey: "AIzaSyC2bh3jNsWU02kBRCPYgQ1tzZeLhwvxK1c",
            authDomain: "azuelaattendance.firebaseapp.com",
            databaseURL: "https://azuelaattendance-default-rtdb.firebaseio.com",
            projectId: "azuelaattendance",
            storageBucket: "azuelaattendance.appspot.com",
            messagingSenderId: "699259071144",
            appId: "1:699259071144:web:4f630cfe7ed04e83baf09d",
            measurementId: "G-MH4DXFELQ2"
        };
     
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Reference to the database
        const db = firebase.database();
        const PASSWORD = '00000'; // Define the password

        const daysInMonth = {
            1: 31,
            2: 28,
            3: 31,
            4: 30,
            5: 31,
            6: 30,
            7: 31,
            8: 31,
            9: 30,
            10: 31,
            11: 30,
            12: 31
        };

        let employees = [];

        function promptForPassword(callback) {
            const enteredPassword = prompt('Enter password:');
            if (enteredPassword === PASSWORD) {
                callback();
            } else {
                alert('Incorrect password.');
            }
        }

        function populateEmployeeSelect() {
            const employeeSelect = document.getElementById('employee');
            const deleteEmployeeSelect = document.getElementById('deleteEmployee');
            employeeSelect.innerHTML = '';
            deleteEmployeeSelect.innerHTML = '';

            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee;
                option.textContent = employee;
                employeeSelect.appendChild(option);

                const deleteOption = option.cloneNode(true);
                deleteEmployeeSelect.appendChild(deleteOption);
            });
        }

        function generateTable(month) {
            const days = daysInMonth[month];
            const tableHead = document.querySelector('#attendanceTable thead tr');
            const tableBody = document.querySelector('#attendanceTable tbody');
            
            tableHead.innerHTML = '<th>Employee</th>';
            tableBody.innerHTML = '';

            for (let i = 1; i <= days; i++) {
                const th = document.createElement('th');
                th.textContent = i;
                tableHead.appendChild(th);
            }

            employees.forEach(employee => {
                const row = document.createElement('tr');
                const employeeCell = document.createElement('td');
                employeeCell.textContent = employee;
                row.appendChild(employeeCell);
                for (let i = 1; i <= days; i++) {
                    const cell = document.createElement('td');
                    cell.className = 'attendance-input';
                    row.appendChild(cell);
                }
                tableBody.appendChild(row);

                // Fetch attendance data for this employee
                db.ref('attendance/' + month + '/' + employee).once('value').then(snapshot => {
                    const attendance = snapshot.val() || {};
                    Object.keys(attendance).forEach(day => {
                        const status = attendance[day];
                        const cell = row.getElementsByTagName('td')[parseInt(day)];
                        cell.textContent = status;
                        cell.className = status.toLowerCase(); // Set the class based on status
                    });
                });
            });
        }

        function markAttendance() {
            const employeeSelect = document.getElementById('employee');
            const dateInput = document.getElementById('date');
            const statusSelect = document.getElementById('status');
            const monthSelect = document.getElementById('month');
            const employee = employeeSelect.value;
            const date = new Date(dateInput.value);
            const status = statusSelect.value;
            const month = parseInt(monthSelect.value);

            if (!employee || !dateInput.value) {
                alert('Please select an employee and a date.');
                return;
            }
            
            const day = date.getDate();
            if (day < 1 || day > daysInMonth[month]) {
                alert('Invalid date.');
                return;
            }

            // Save attendance to Firebase
            db.ref('attendance/' + month + '/' + employee + '/' + day).set(status)
                .then(() => {
                                        alert('Attendance marked successfully!');
                    updateTableWithStatus(employee, day, status);
                })
                .catch(error => console.error('Error marking attendance:', error));
        }

        function updateTableWithStatus(employee, day, status) {
            const table = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
            const rows = table.getElementsByTagName('tr');
            
            for (let i = 0; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                if (cells[0].textContent === employee) {
                    if (cells[day]) { // Ensure the cell exists
                        cells[day].textContent = status;
                        cells[day].className = status.toLowerCase(); // Set the class based on status
                    }
                    break;
                }
            }
        }

        function addOrUpdateEmployee() {
            promptForPassword(() => {
                const newEmployeeInput = document.getElementById('newEmployee');
                const newEmployeeName = newEmployeeInput.value.trim();
                
                if (newEmployeeName === '') {
                    alert('Please enter an employee name.');
                    return;
                }

                if (employees.includes(newEmployeeName)) {
                    alert('Employee already exists.');
                    return;
                }

                employees.push(newEmployeeName);
                populateEmployeeSelect();
                generateTable(parseInt(document.getElementById('month').value));

                // Save employee list to Firebase
                db.ref('employees').set(employees)
                    .then(() => alert('Employee list updated successfully!'))
                    .catch(error => console.error('Error updating employee list:', error));

                newEmployeeInput.value = '';
            });
        }

        function deleteEmployee() {
            promptForPassword(() => {
                const deleteEmployeeSelect = document.getElementById('deleteEmployee');
                const employeeToDelete = deleteEmployeeSelect.value;

                if (!employeeToDelete) {
                    alert('Please select an employee to delete.');
                    return;
                }

                employees = employees.filter(employee => employee !== employeeToDelete);
                populateEmployeeSelect();
                generateTable(parseInt(document.getElementById('month').value));

                // Save updated employee list to Firebase
                db.ref('employees').set(employees)
                    .then(() => alert('Employee deleted successfully!'))
                    .catch(error => console.error('Error deleting employee:', error));
            });
        }

        // Initialize the page with default values
        function init() {
            db.ref('employees').once('value').then(snapshot => {
                employees = snapshot.val() || [];
                populateEmployeeSelect();
                const currentMonth = parseInt(document.getElementById('month').value);
                generateTable(currentMonth);
            });

            document.getElementById('month').addEventListener('change', (event) => {
                const month = parseInt(event.target.value);
                generateTable(month);
            });
        }

        init();
