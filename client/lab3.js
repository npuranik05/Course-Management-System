const API_BASE_URL = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', initializeApp);

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function displayMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = type;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'close-message';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', clearMessages);

    const messageText = document.createElement('div');
    messageText.className = 'message-text';

    if (Array.isArray(message)) {
        message.forEach((line, index) => {
            const lineSpan = document.createElement('span');
            lineSpan.textContent = line;
            messageText.appendChild(lineSpan);
            if (index < message.length - 1) {
                messageText.appendChild(document.createElement('br'));
            }
        });
    } else {
        messageText.textContent = message;
    }

    messageDiv.appendChild(closeButton);
    messageDiv.appendChild(messageText);
    container.innerHTML = '';
    container.appendChild(messageDiv);

    setTimeout(() => {
        if (container.contains(messageDiv)) {
            clearMessages();
        }
    }, 5000);
}

function clearMessages() {
    document.getElementById('messageContainer').innerHTML = '';
}

function renderEmptyRow(tbody, colSpan, text) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = colSpan;
    cell.className = 'no-data';
    cell.textContent = text;
    row.appendChild(cell);
    tbody.appendChild(row);
}

function initializeApp() {
    document.querySelectorAll('.navigation button').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });

    const buttonBindings = [
        ['createCourseButton', createCourse],
        ['deleteCourseButton', deleteCourse],
        ['loadCoursesButton', loadCourses],
        ['addMemberButton', addSingleMember],
        ['loadMembersButton', loadMembers],
        ['deleteMembersButton', deleteMembers],
        ['createSignupButton', createSignupSheet],
        ['deleteSignupByIdButton', deleteSignupSheetById],
        ['loadSignupSheetsButton', loadSignupSheets],
        ['addSlotsButton', addSlots],
        ['loadSlotsButton', loadSlots],
        ['modifySlotButton', modifySlotFromForm],
        ['signupButton', signupForSlot],
        ['removeSignupButton', removeSignup],
        ['loadSlotMembersButton', loadSlotMembers],
        ['enterGradeButton', enterGrade],
        ['loadGradesButton', loadGrades]
    ];

    buttonBindings.forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });

    showSection('courses');
    loadCourses();
}

function showSection(sectionName) {
    document.getElementById('courses-section').classList.add('hidden');
    document.getElementById('sheets-section').classList.add('hidden');
    document.getElementById('grading-section').classList.add('hidden');

    document.querySelectorAll('.navigation button').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    const navButton = document.getElementById(`nav-${sectionName}`);
    if (navButton) {
        navButton.classList.add('active');
    }
}

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function createCourse() {
    try {
        clearMessages();
        
        const termCode = document.getElementById('termCode').value;
        const courseName = document.getElementById('courseName').value;
        const section = document.getElementById('courseSection').value || 1;
        
        if (!termCode || !courseName) {
            displayMessage('Term code and course name are required', 'error');
            return;
        }
        
        const data = await apiRequest(`${API_BASE_URL}/courses`, {
            method: 'POST',
            body: JSON.stringify({
                termCode: parseInt(termCode),
                courseName: courseName,
                section: parseInt(section)
            })
        });
        
        displayMessage(`Course "${data.courseName}" created successfully with ID ${data.id}`);
        
        document.getElementById('termCode').value = '1259';
        document.getElementById('courseName').value = '';
        document.getElementById('courseSection').value = '1';
        
        await loadCourses();
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function loadCourses() {
    try {
        const courses = await apiRequest(`${API_BASE_URL}/courses`);

        const tbody = document.querySelector('#coursesTable tbody');
        tbody.innerHTML = '';

        if (courses.length === 0) {
            renderEmptyRow(tbody, 4, 'No courses found');
            return;
        }

        courses.forEach(course => {
            const row = document.createElement('tr');

            const termCell = document.createElement('td');
            termCell.textContent = course.termCode;
            row.appendChild(termCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = course.courseName;
            row.appendChild(nameCell);

            const sectionCell = document.createElement('td');
            sectionCell.textContent = course.section;
            row.appendChild(sectionCell);

            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'delete';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteCourseById(course.termCode, course.section));
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function deleteCourseById(termCode, section) {
    try {
        await apiRequest(`${API_BASE_URL}/courses/${termCode}/${section}`, {
            method: 'DELETE'
        });
        
        displayMessage('Course deleted successfully');
        await loadCourses();
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function deleteCourse() {
    try {
        clearMessages();
        
        const termCode = document.getElementById('deleteTermCode').value;
        const section = document.getElementById('deleteSection').value || 1;
        
        if (!termCode) {
            displayMessage('Term code is required', 'error');
            return;
        }
        
        await apiRequest(`${API_BASE_URL}/courses/${termCode}/${section}`, {
            method: 'DELETE'
        });
        
        displayMessage('Course deleted successfully');
        
        document.getElementById('deleteTermCode').value = '';
        document.getElementById('deleteSection').value = '1';
        
        await loadCourses();
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function addSingleMember() {
    try {
        clearMessages();
        
        const termCode = document.getElementById('memberTermCode').value;
        const section = document.getElementById('memberSection').value || 1;
        const memberId = document.getElementById('memberId').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const role = document.getElementById('role').value;
        
        if (!termCode || !memberId || !firstName || !lastName || !role) {
            displayMessage('All fields are required', 'error');
            return;
        }
        
        if (memberId.length !== 8) {
            displayMessage('Member ID must be exactly 8 characters', 'error');
            return;
        }
        
        const member = {
            memberId: memberId,
            firstName: firstName,
            lastName: lastName,
            role: role
        };
        
        const data = await apiRequest(`${API_BASE_URL}/courses/${termCode}/${section}/members`, {
            method: 'POST',
            body: JSON.stringify({ members: [member] })
        });
        
        if (data.ignored && data.ignored.length > 0) {
            displayMessage(`Member ${memberId} already exists in this course`, 'error');
        } else {
            displayMessage(`Member ${firstName} ${lastName} added successfully!`);
            document.getElementById('memberId').value = '';
            document.getElementById('firstName').value = '';
            document.getElementById('lastName').value = '';
            document.getElementById('role').value = 'student';
            
            document.getElementById('viewTermCode').value = termCode;
            document.getElementById('viewSection').value = section;
            await loadMembers();
        }
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}


async function loadMembers() {
    try {
        const termCode = document.getElementById('viewTermCode').value;
        const section = document.getElementById('viewSection').value || 1;
        const role = document.getElementById('viewRole').value;

        if (!termCode) {
            displayMessage('Term code is required', 'error');
            return;
        }

        let url = `${API_BASE_URL}/courses/${termCode}/${section}/members`;
        if (role.trim()) {
            url += `?role=${encodeURIComponent(role)}`;
        }

        const members = await apiRequest(url);

        const tbody = document.querySelector('#membersTable tbody');
        tbody.innerHTML = '';

        if (members.length === 0) {
            renderEmptyRow(tbody, 5, 'No members found');
            return;
        }

        members.forEach(member => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.textContent = member.memberId;
            row.appendChild(idCell);

            const firstCell = document.createElement('td');
            firstCell.textContent = member.firstName;
            row.appendChild(firstCell);

            const lastCell = document.createElement('td');
            lastCell.textContent = member.lastName;
            row.appendChild(lastCell);

            const roleCell = document.createElement('td');
            roleCell.textContent = member.role;
            row.appendChild(roleCell);

            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'delete';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteMemberById(member.memberId));
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function deleteMemberById(memberId) {
    try {
        const termCode = document.getElementById('viewTermCode').value;
        const section = document.getElementById('viewSection').value || 1;
        
        if (!termCode) {
            displayMessage('Please select a course first', 'error');
            return;
        }
        
        await apiRequest(`${API_BASE_URL}/courses/${termCode}/${section}/members`, {
            method: 'DELETE',
            body: JSON.stringify({ memberIds: [memberId] })
        });
        
        displayMessage('Member deleted successfully');
        await loadMembers();
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function deleteMembers() {
    try {
        clearMessages();
        
        const termCode = document.getElementById('deleteMembersTermCode').value;
        const section = document.getElementById('deleteMembersSection').value || 1;
        const memberIdsText = document.getElementById('deleteMemberIds').value;
        
        if (!termCode || !memberIdsText) {
            displayMessage('Term code and member IDs are required', 'error');
            return;
        }
        
        const memberIds = memberIdsText.split(',').map(id => id.trim()).filter(id => id);
        
        const data = await apiRequest(`${API_BASE_URL}/courses/${termCode}/${section}/members`, {
            method: 'DELETE',
            body: JSON.stringify({ memberIds })
        });
        
        displayMessage(`Deleted ${data.deleted} members successfully`);
        
        document.getElementById('deleteMembersTermCode').value = '';
        document.getElementById('deleteMembersSection').value = '1';
        document.getElementById('deleteMemberIds').value = '';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}


async function createSignupSheet() {
    try {
        clearMessages();
        
        const termCode = document.getElementById('sheetTermCode').value;
        const section = document.getElementById('sheetSection').value || 1;
        const assignmentName = document.getElementById('assignmentName').value;
        const notBefore = document.getElementById('notBefore').value;
        const notAfter = document.getElementById('notAfter').value;
        
        if (!termCode || !assignmentName || !notBefore || !notAfter) {
            displayMessage('All fields are required', 'error');
            return;
        }
        
        const data = await apiRequest(`${API_BASE_URL}/signup-sheets`, {
            method: 'POST',
            body: JSON.stringify({
                termCode: parseInt(termCode),
                section: parseInt(section),
                assignmentName: assignmentName,
                notBefore: notBefore,
                notAfter: notAfter
            })
        });
        
        displayMessage(`Sign-up sheet "${data.assignmentName}" created successfully with ID ${data.id}`);
        
        document.getElementById('sheetTermCode').value = '';
        document.getElementById('sheetSection').value = '1';
        document.getElementById('assignmentName').value = '';
        document.getElementById('notBefore').value = '';
        document.getElementById('notAfter').value = '';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function loadSignupSheets() {
    try {
        const termCode = document.getElementById('sheetsTermCode').value;
        const section = document.getElementById('sheetsSection').value || 1;

        if (!termCode) {
            displayMessage('Term code is required', 'error');
            return;
        }

        const sheets = await apiRequest(`${API_BASE_URL}/courses/${termCode}/${section}/signup-sheets`);

        const tbody = document.querySelector('#sheetsTable tbody');
        tbody.innerHTML = '';

        if (sheets.length === 0) {
            renderEmptyRow(tbody, 5, 'No sign-up sheets found');
            return;
        }

        sheets.forEach(sheet => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.textContent = sheet.id;
            row.appendChild(idCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = sheet.assignmentName;
            row.appendChild(nameCell);

            const beforeCell = document.createElement('td');
            beforeCell.textContent = new Date(sheet.notBefore).toLocaleString();
            row.appendChild(beforeCell);

            const afterCell = document.createElement('td');
            afterCell.textContent = new Date(sheet.notAfter).toLocaleString();
            row.appendChild(afterCell);

            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'delete';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteSignupSheet(sheet.id));
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function deleteSignupSheet(sheetId) {
    try {
        await apiRequest(`${API_BASE_URL}/signup-sheets/${sheetId}`, {
            method: 'DELETE'
        });
        
        displayMessage('Sign-up sheet deleted successfully');
        await loadSignupSheets();
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function deleteSignupSheetById() {
    try {
        clearMessages();
        
        const sheetId = document.getElementById('deleteSheetId').value;
        
        if (!sheetId) {
            displayMessage('Sign-up Sheet ID is required', 'error');
            return;
        }
        
        await apiRequest(`${API_BASE_URL}/signup-sheets/${sheetId}`, {
            method: 'DELETE'
        });
        
        displayMessage(`Sign-up sheet ${sheetId} deleted successfully`);
        
        document.getElementById('deleteSheetId').value = '';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function addSlots() {
    try {
        clearMessages();
        
        const signupSheetId = document.getElementById('slotSignupSheetId').value;
        const start = document.getElementById('slotStart').value;
        const slotDuration = document.getElementById('slotDuration').value;
        const numSlots = document.getElementById('numSlots').value;
        const maxMembers = document.getElementById('maxMembers').value;
        
        if (!signupSheetId || !start || !slotDuration || !numSlots || !maxMembers) {
            displayMessage('All fields are required', 'error');
            return;
        }
        
        const data = await apiRequest(`${API_BASE_URL}/signup-sheets/${signupSheetId}/slots`, {
            method: 'POST',
            body: JSON.stringify({
                start: start,
                slotDuration: parseInt(slotDuration),
                numSlots: parseInt(numSlots),
                maxMembers: parseInt(maxMembers)
            })
        });
        
        displayMessage(`Created ${data.length} slots successfully`);
        
        document.getElementById('slotSignupSheetId').value = '';
        document.getElementById('slotStart').value = '';
        document.getElementById('slotDuration').value = '30';
        document.getElementById('numSlots').value = '1';
        document.getElementById('maxMembers').value = '1';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function loadSlots() {
    try {
        const sheetId = document.getElementById('viewSheetId').value;
        
        if (!sheetId) {
            displayMessage('Sign-up sheet ID is required', 'error');
            return;
        }
        
        const slots = await apiRequest(`${API_BASE_URL}/signup-sheets/${sheetId}/slots`);
        
        const container = document.getElementById('slotsContainer');
        container.innerHTML = '';
        
        if (slots.length === 0) {
            container.innerHTML = '<p>No slots found for this sign-up sheet.</p>';
            return;
        }
        
        slots.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'slot-info';
            slotDiv.innerHTML = `
                <h4>Slot ${slot.id}</h4>
                <p><strong>Sign-up Sheet ID:</strong> ${slot.signupSheetId}</p>
                <p><strong>Start:</strong> ${new Date(slot.start).toLocaleString()}</p>
                <p><strong>End:</strong> ${new Date(slot.end).toLocaleString()}</p>
                <p><strong>Duration:</strong> ${slot.slotDuration} minutes</p>
                <p><strong>Max Members:</strong> ${slot.maxMembers}</p>
                <p><strong>Current Members:</strong> ${slot.members.length}/${slot.maxMembers}</p>
                ${slot.members.length > 0 ? `
                    <p><strong>Signed up members:</strong></p>
                    <ul>
                        ${slot.members.map(member => 
                            `<li>${sanitizeInput(member.memberId)} - ${sanitizeInput(member.firstName)} ${sanitizeInput(member.lastName)}</li>`
                        ).join('')}
                    </ul>
                ` : ''}
            `;
            container.appendChild(slotDiv);
        });
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function modifySlot(slotId) {
    document.getElementById('modifySlotId').value = slotId;
    showSection('sheets');
    document.getElementById('modifySlotId').scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('modifySlotId').focus();
    displayMessage('Please enter the new slot information in the "Modify Slot" form above', 'success');
}

async function modifySlotFromForm() {
    try {
        clearMessages();
        
        const slotId = document.getElementById('modifySlotId').value;
        const newStart = document.getElementById('modifySlotStart').value;
        const newDuration = document.getElementById('modifySlotDuration').value;
        const newMaxMembers = document.getElementById('modifySlotMaxMembers').value;
        
        if (!slotId) {
            displayMessage('Slot ID is required', 'error');
            return;
        }
        
        if (!newStart && !newDuration && !newMaxMembers) {
            displayMessage('Please provide at least one field to modify (start time, duration, or max members)', 'error');
            return;
        }
        
        const requestBody = {};
        
        if (newStart) {
            requestBody.start = newStart;
        }
        
        if (newDuration) {
            const duration = parseInt(newDuration);
            if (duration < 1 || duration > 240) {
                displayMessage('Duration must be between 1 and 240 minutes', 'error');
                return;
            }
            requestBody.slotDuration = duration;
        }
        
        if (newMaxMembers) {
            const maxMembers = parseInt(newMaxMembers);
            if (maxMembers < 1 || maxMembers > 99) {
                displayMessage('Max members must be between 1 and 99', 'error');
                return;
            }
            requestBody.maxMembers = maxMembers;
        }
        
        const data = await apiRequest(`${API_BASE_URL}/slots/${slotId}`, {
            method: 'PUT',
            body: JSON.stringify(requestBody)
        });
        
        displayMessage(`Slot ${slotId} modified successfully!`);
        
        document.getElementById('modifySlotId').value = '';
        document.getElementById('modifySlotStart').value = '';
        document.getElementById('modifySlotDuration').value = '';
        document.getElementById('modifySlotMaxMembers').value = '';
        
        const viewSheetId = document.getElementById('viewSheetId').value;
        if (viewSheetId) {
            await loadSlots();
        }
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function signupForSlot() {
    try {
        clearMessages();
        
        const signupSheetId = document.getElementById('signupSheetId').value;
        const slotId = document.getElementById('signupSlotId').value;
        const memberId = document.getElementById('signupMemberId').value;
        
        if (!signupSheetId || !slotId || !memberId) {
            displayMessage('All fields are required', 'error');
            return;
        }
        
        const data = await apiRequest(`${API_BASE_URL}/signup-sheets/${signupSheetId}/signup`, {
            method: 'POST',
            body: JSON.stringify({
                slotId: parseInt(slotId),
                memberId: memberId
            })
        });
        
        displayMessage('Successfully signed up for the slot');
        
        document.getElementById('signupSheetId').value = '';
        document.getElementById('signupSlotId').value = '';
        document.getElementById('signupMemberId').value = '';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function removeSignup() {
    try {
        clearMessages();
        
        const signupSheetId = document.getElementById('removeSignupSheetId').value;
        const memberId = document.getElementById('removeSignupMemberId').value;
        
        if (!signupSheetId || !memberId) {
            displayMessage('All fields are required', 'error');
            return;
        }
        
        const slotInfo = await apiRequest(`${API_BASE_URL}/signup-sheets/${signupSheetId}/signup/${memberId}`, {
            method: 'DELETE'
        });
        
        const details = [
            'Sign-up removed successfully!',
            `Slot ID: ${slotInfo.id}`,
            `Sign-up Sheet ID: ${slotInfo.signupSheetId}`,
            `Start Time: ${new Date(slotInfo.start).toLocaleString()}`,
            `End Time: ${new Date(slotInfo.end).toLocaleString()}`,
            `Duration: ${slotInfo.slotDuration} minutes`,
            `Max Members: ${slotInfo.maxMembers}`,
            `Current Members: ${slotInfo.members.length}/${slotInfo.maxMembers}`
        ];

        displayMessage(details, 'success');
        
        document.getElementById('removeSignupSheetId').value = '';
        document.getElementById('removeSignupMemberId').value = '';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}


async function loadSlotMembers() {
    try {
        const slotId = document.getElementById('gradeSlotId').value;
        
        if (!slotId) {
            displayMessage('Slot ID is required', 'error');
            return;
        }
        
        const slot = await apiRequest(`${API_BASE_URL}/slots/${slotId}/members`);
        
        const container = document.getElementById('slotMembersContainer');
        container.innerHTML = '';
        
        if (slot.members.length === 0) {
            container.innerHTML = '<p>No members signed up for this slot.</p>';
            return;
        }
        
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot-info';
        slotDiv.innerHTML = `
            <h4>Slot ${slot.id} Details</h4>
            <p><strong>Start:</strong> ${new Date(slot.start).toLocaleString()}</p>
            <p><strong>End:</strong> ${new Date(slot.end).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${slot.slotDuration} minutes</p>
            <p><strong>Max Members:</strong> ${slot.maxMembers}</p>
            <p><strong>Current Members:</strong> ${slot.members.length}/${slot.maxMembers}</p>
            <h5>Signed up members:</h5>
            <ul>
                ${slot.members.map(member => 
                    `<li>${sanitizeInput(member.memberId)} - ${sanitizeInput(member.firstName)} ${sanitizeInput(member.lastName)}</li>`
                ).join('')}
            </ul>
        `;
        container.appendChild(slotDiv);
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function enterGrade() {
    try {
        clearMessages();
        
        const memberId = document.getElementById('gradeMemberId').value;
        const signupSheetId = document.getElementById('gradeSignupSheetId').value;
        const grade = document.getElementById('grade').value;
        const comment = document.getElementById('gradeComment').value;
        
        if (!memberId || !signupSheetId || grade === '') {
            displayMessage('Member ID, signup sheet ID, and grade are required', 'error');
            return;
        }
        
        const data = await apiRequest(`${API_BASE_URL}/grades`, {
            method: 'POST',
            body: JSON.stringify({
                memberId: memberId,
                signupSheetId: parseInt(signupSheetId),
                grade: parseInt(grade),
                comment: comment
            })
        });
        
        let message = `Grade ${data.grade} entered successfully for member ${data.memberId}`;
        if (data.originalGrade !== null) {
            message += ` (previous grade: ${data.originalGrade})`;
        }
        displayMessage(message);
        
        document.getElementById('gradeMemberId').value = '';
        document.getElementById('gradeSignupSheetId').value = '';
        document.getElementById('grade').value = '';
        document.getElementById('gradeComment').value = '';
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function loadGrades() {
    try {
        const signupSheetId = document.getElementById('viewGradesSheetId').value;
        
        if (!signupSheetId) {
            displayMessage('Sign-up sheet ID is required', 'error');
            return;
        }
        
        const grades = await apiRequest(`${API_BASE_URL}/signup-sheets/${signupSheetId}/grades`);
        
        const tbody = document.querySelector('#gradesTable tbody');
        tbody.innerHTML = '';
        
        if (grades.length === 0) {
            renderEmptyRow(tbody, 3, 'No grades found');
            return;
        }
        
        grades.forEach(grade => {
            const row = document.createElement('tr');

            const memberCell = document.createElement('td');
            memberCell.textContent = grade.memberId;
            row.appendChild(memberCell);

            const gradeCell = document.createElement('td');
            gradeCell.textContent = grade.grade;
            row.appendChild(gradeCell);

            const commentCell = document.createElement('td');
            commentCell.textContent = grade.comment || '';
            row.appendChild(commentCell);

            tbody.appendChild(row);
        });
        
    } catch (error) {
        displayMessage(error.message, 'error');
    }
}