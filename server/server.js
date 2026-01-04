const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));


const DATA_DIR = path.join(__dirname, 'data');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
const SHEETS_FILE = path.join(DATA_DIR, 'sheets.json');
const SLOTS_FILE = path.join(DATA_DIR, 'slots.json');
const GRADES_FILE = path.join(DATA_DIR, 'grades.json');


function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

function sanitizeInput(input, maxLength = null) {
    if (typeof input === 'string') {
        let sanitized = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        return sanitized;
    }
    return input;
}

function validateTermCode(termCode) {
    const num = parseInt(termCode);
    return !isNaN(num) && num >= 1 && num <= 9999;
}

function validateSection(section) {
    const num = parseInt(section);
    return !isNaN(num) && num >= 1 && num <= 99;
}

function validateMemberId(memberId) {
    return typeof memberId === 'string' && memberId.length === 8;
}

function validateTimestamp(timestamp) {
    return !isNaN(Date.parse(timestamp));
}

function generateId(existingItems) {
    let id = 1;
    while (existingItems.find(item => item.id === id)) {
        id++;
    }
    return id;
}

app.post('/api/courses', (req, res) => {
    const { termCode, courseName, section = 1 } = req.body;
    
    if (!termCode || !courseName) {
        return res.status(400).json({ error: 'Term code and course name are required' });
    }
    
    if (!validateTermCode(termCode)) {
        return res.status(400).json({ error: 'Term code must be a number between 1 and 9999' });
    }
    
    if (!validateSection(section)) {
        return res.status(400).json({ error: 'Section must be a number between 1 and 99' });
    }
    
    const sanitizedCourseName = sanitizeInput(courseName, 100);
    const courses = readJsonFile(COURSES_FILE);
    const existingCourse = courses.find(course => 
        course.termCode === parseInt(termCode) && course.section === parseInt(section)
    );
    
    if (existingCourse) {
        return res.status(400).json({ error: 'Course with this term code and section already exists' });
    }
    
    const newCourse = {
        id: generateId(courses),
        termCode: parseInt(termCode),
        courseName: sanitizedCourseName,
        section: parseInt(section)
    };
    
    courses.push(newCourse);
    
    if (writeJsonFile(COURSES_FILE, courses)) {
        res.status(201).json(newCourse);
    } else {
        res.status(500).json({ error: 'Failed to save course' });
    }
});

app.get('/api/courses', (req, res) => {
    const courses = readJsonFile(COURSES_FILE);
    res.json(courses);
});

app.delete('/api/courses/:termCode/:section', (req, res) => {
    const { termCode, section = 1 } = req.params;
    
    if (!validateTermCode(termCode)) {
        return res.status(400).json({ error: 'Invalid term code' });
    }
    
    if (!validateSection(section)) {
        return res.status(400).json({ error: 'Invalid section' });
    }
    
    const courses = readJsonFile(COURSES_FILE);
    const courseIndex = courses.findIndex(course => 
        course.termCode === parseInt(termCode) && course.section === parseInt(section)
    );
    
    if (courseIndex === -1) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    courses.splice(courseIndex, 1);
    
    if (writeJsonFile(COURSES_FILE, courses)) {
        res.json({ message: 'Course deleted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

app.post('/api/courses/:termCode/:section/members', (req, res) => {
    const { termCode, section = 1 } = req.params;
    const { members } = req.body;
    
    if (!validateTermCode(termCode) || !validateSection(section)) {
        return res.status(400).json({ error: 'Invalid term code or section' });
    }
    
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: 'Members array is required' });
    }
    
    const courses = readJsonFile(COURSES_FILE);
    const course = courses.find(c => c.termCode === parseInt(termCode) && c.section === parseInt(section));
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    const existingMembers = readJsonFile(MEMBERS_FILE);
    const courseMembers = existingMembers.filter(m => m.termCode === parseInt(termCode) && m.section === parseInt(section));
    const existingIds = new Set(courseMembers.map(m => m.memberId));
    
    const newMembers = [];
    const ignoredIds = [];
    
    members.forEach(member => {
        if (!member.memberId || !member.firstName || !member.lastName || !member.role) {
            ignoredIds.push(member.memberId || 'unknown');
            return;
        }
        
        if (!validateMemberId(member.memberId)) {
            ignoredIds.push(member.memberId);
            return;
        }
        
        if (existingIds.has(member.memberId)) {
            ignoredIds.push(member.memberId);
            return;
        }
        
        const newMember = {
            id: generateId(existingMembers),
            termCode: parseInt(termCode),
            section: parseInt(section),
            memberId: sanitizeInput(member.memberId, 8),
            firstName: sanitizeInput(member.firstName, 200),
            lastName: sanitizeInput(member.lastName, 200),
            role: sanitizeInput(member.role, 10)
        };
        
        newMembers.push(newMember);
        existingMembers.push(newMember);
        existingIds.add(member.memberId);
    });
    
    if (writeJsonFile(MEMBERS_FILE, existingMembers)) {
        res.json({
            added: newMembers.length,
            ignored: ignoredIds
        });
    } else {
        res.status(500).json({ error: 'Failed to save members' });
    }
});

app.get('/api/courses/:termCode/:section/members', (req, res) => {
    const { termCode, section = 1 } = req.params;
    const { role } = req.query;
    
    if (!validateTermCode(termCode) || !validateSection(section)) {
        return res.status(400).json({ error: 'Invalid term code or section' });
    }
    
    const members = readJsonFile(MEMBERS_FILE);
    let filteredMembers = members.filter(m => 
        m.termCode === parseInt(termCode) && m.section === parseInt(section)
    );
    
    if (role && role.trim() !== '') {
        filteredMembers = filteredMembers.filter(m => 
            m.role.toLowerCase() === role.toLowerCase()
        );
    }
    
    res.json(filteredMembers);
});

app.delete('/api/courses/:termCode/:section/members', (req, res) => {
    const { termCode, section = 1 } = req.params;
    const { memberIds } = req.body;
    
    if (!validateTermCode(termCode) || !validateSection(section)) {
        return res.status(400).json({ error: 'Invalid term code or section' });
    }
    
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ error: 'Member IDs array is required' });
    }
    
    const members = readJsonFile(MEMBERS_FILE);
    const initialLength = members.length;
    
    for (let i = members.length - 1; i >= 0; i--) {
        const member = members[i];
        if (member.termCode === parseInt(termCode) && 
            member.section === parseInt(section) && 
            memberIds.includes(member.memberId)) {
            members.splice(i, 1);
        }
    }
    
    const deletedCount = initialLength - members.length;
    
    if (writeJsonFile(MEMBERS_FILE, members)) {
        res.json({ deleted: deletedCount });
    } else {
        res.status(500).json({ error: 'Failed to delete members' });
    }
});

app.post('/api/signup-sheets', (req, res) => {
    const { termCode, section = 1, assignmentName, notBefore, notAfter } = req.body;
    
    if (!termCode || !assignmentName || !notBefore || !notAfter) {
        return res.status(400).json({ error: 'Term code, assignment name, not-before, and not-after are required' });
    }
    
    if (!validateTermCode(termCode) || !validateSection(section)) {
        return res.status(400).json({ error: 'Invalid term code or section' });
    }
    
    if (!validateTimestamp(notBefore) || !validateTimestamp(notAfter)) {
        return res.status(400).json({ error: 'Invalid timestamp format' });
    }
    
    if (new Date(notBefore) >= new Date(notAfter)) {
        return res.status(400).json({ error: 'Not-before must be before not-after' });
    }
    
    const courses = readJsonFile(COURSES_FILE);
    const course = courses.find(c => c.termCode === parseInt(termCode) && c.section === parseInt(section));
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    const sheets = readJsonFile(SHEETS_FILE);
    const newSheet = {
        id: generateId(sheets),
        termCode: parseInt(termCode),
        section: parseInt(section),
        assignmentName: sanitizeInput(assignmentName, 100),
        notBefore: new Date(notBefore).toISOString(),
        notAfter: new Date(notAfter).toISOString()
    };
    
    sheets.push(newSheet);
    
    if (writeJsonFile(SHEETS_FILE, sheets)) {
        res.status(201).json(newSheet);
    } else {
        res.status(500).json({ error: 'Failed to save signup sheet' });
    }
});

app.delete('/api/signup-sheets/:id', (req, res) => {
    const { id } = req.params;
    const sheetId = parseInt(id);
    
    if (isNaN(sheetId)) {
        return res.status(400).json({ error: 'Invalid signup sheet ID' });
    }
    
    const sheets = readJsonFile(SHEETS_FILE);
    const sheetIndex = sheets.findIndex(sheet => sheet.id === sheetId);
    
    if (sheetIndex === -1) {
        return res.status(404).json({ error: 'Signup sheet not found' });
    }
    
    sheets.splice(sheetIndex, 1);
    
    const slots = readJsonFile(SLOTS_FILE);
    const updatedSlots = slots.filter(slot => slot.signupSheetId !== sheetId);
    writeJsonFile(SLOTS_FILE, updatedSlots);
    
    if (writeJsonFile(SHEETS_FILE, sheets)) {
        res.json({ message: 'Signup sheet deleted successfully' });
    } else {
        res.status(500).json({ error: 'Failed to delete signup sheet' });
    }
});

app.get('/api/courses/:termCode/:section/signup-sheets', (req, res) => {
    const { termCode, section = 1 } = req.params;
    
    if (!validateTermCode(termCode) || !validateSection(section)) {
        return res.status(400).json({ error: 'Invalid term code or section' });
    }
    
    const sheets = readJsonFile(SHEETS_FILE);
    const filteredSheets = sheets.filter(sheet => 
        sheet.termCode === parseInt(termCode) && sheet.section === parseInt(section)
    );
    
    res.json(filteredSheets);
});

app.post('/api/signup-sheets/:id/slots', (req, res) => {
    const { id } = req.params;
    const { start, slotDuration, numSlots, maxMembers } = req.body;
    
    const sheetId = parseInt(id);
    
    if (isNaN(sheetId)) {
        return res.status(400).json({ error: 'Invalid signup sheet ID' });
    }
    
    if (!start || !slotDuration || !numSlots || !maxMembers) {
        return res.status(400).json({ error: 'Start time, slot duration, number of slots, and max members are required' });
    }
    
    if (!validateTimestamp(start)) {
        return res.status(400).json({ error: 'Invalid start timestamp format' });
    }
    
    const duration = parseInt(slotDuration);
    const slots = parseInt(numSlots);
    const max = parseInt(maxMembers);
    
    if (duration < 1 || duration > 240) {
        return res.status(400).json({ error: 'Slot duration must be between 1 and 240 minutes' });
    }
    
    if (slots < 1 || slots > 99) {
        return res.status(400).json({ error: 'Number of slots must be between 1 and 99' });
    }
    
    if (max < 1 || max > 99) {
        return res.status(400).json({ error: 'Max members must be between 1 and 99' });
    }
    
    const sheets = readJsonFile(SHEETS_FILE);
    const sheet = sheets.find(s => s.id === sheetId);
    
    if (!sheet) {
        return res.status(404).json({ error: 'Signup sheet not found' });
    }
    
    const existingSlots = readJsonFile(SLOTS_FILE);
    const newSlots = [];
    
    for (let i = 0; i < slots; i++) {
        const slotStart = new Date(new Date(start).getTime() + (i * duration * 60000));
        const slotEnd = new Date(slotStart.getTime() + (duration * 60000));
        
        const newSlot = {
            id: generateId(existingSlots),
            signupSheetId: sheetId,
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            slotDuration: duration,
            maxMembers: max,
            members: []
        };
        
        newSlots.push(newSlot);
        existingSlots.push(newSlot);
    }
    
    if (writeJsonFile(SLOTS_FILE, existingSlots)) {
        res.status(201).json(newSlots);
    } else {
        res.status(500).json({ error: 'Failed to save slots' });
    }
});

app.get('/api/signup-sheets/:id/slots', (req, res) => {
    const { id } = req.params;
    const sheetId = parseInt(id);
    
    if (isNaN(sheetId)) {
        return res.status(400).json({ error: 'Invalid signup sheet ID' });
    }
    
    const slots = readJsonFile(SLOTS_FILE);
    const filteredSlots = slots.filter(slot => slot.signupSheetId === sheetId);
    
    res.json(filteredSlots);
});

app.put('/api/slots/:id', (req, res) => {
    const { id } = req.params;
    const { start, slotDuration, maxMembers } = req.body;
    
    const slotId = parseInt(id);
    
    if (isNaN(slotId)) {
        return res.status(400).json({ error: 'Invalid slot ID' });
    }
    
    const slots = readJsonFile(SLOTS_FILE);
    const slotIndex = slots.findIndex(slot => slot.id === slotId);
    
    if (slotIndex === -1) {
        return res.status(404).json({ error: 'Slot not found' });
    }
    
    const slot = slots[slotIndex];
    
    if (slot.members && slot.members.length > 0) {
        return res.status(400).json({ 
            error: 'Cannot modify slot with existing signups',
            members: slot.members.map(m => m.memberId)
        });
    }
    
    if (start) {
        if (!validateTimestamp(start)) {
            return res.status(400).json({ error: 'Invalid start timestamp format' });
        }
        slot.start = new Date(start).toISOString();
        if (slot.slotDuration) {
            slot.end = new Date(new Date(start).getTime() + (slot.slotDuration * 60000)).toISOString();
        }
    }
    
    if (slotDuration) {
        const duration = parseInt(slotDuration);
        if (duration < 1 || duration > 240) {
            return res.status(400).json({ error: 'Slot duration must be between 1 and 240 minutes' });
        }
        slot.slotDuration = duration;
        slot.end = new Date(new Date(slot.start).getTime() + (duration * 60000)).toISOString();
    }
    
    if (maxMembers) {
        const max = parseInt(maxMembers);
        if (max < 1 || max > 99) {
            return res.status(400).json({ error: 'Max members must be between 1 and 99' });
        }
        slot.maxMembers = max;
    }
    
    if (writeJsonFile(SLOTS_FILE, slots)) {
        res.json(slot);
    } else {
        res.status(500).json({ error: 'Failed to update slot' });
    }
});

app.post('/api/signup-sheets/:sheetId/signup', (req, res) => {
    const { sheetId } = req.params;
    const { slotId, memberId } = req.body;
    
    const signupSheetId = parseInt(sheetId);
    const slotNum = parseInt(slotId);
    
    if (isNaN(signupSheetId) || isNaN(slotNum)) {
        return res.status(400).json({ error: 'Invalid signup sheet ID or slot ID' });
    }
    
    if (!memberId || !validateMemberId(memberId)) {
        return res.status(400).json({ error: 'Valid member ID is required' });
    }
    
    const slots = readJsonFile(SLOTS_FILE);
    const slot = slots.find(s => s.id === slotNum && s.signupSheetId === signupSheetId);
    
    if (!slot) {
        return res.status(404).json({ error: 'Slot not found for this signup sheet' });
    }
    
    if (slot.members.length >= slot.maxMembers) {
        return res.status(400).json({ error: 'Slot is full' });
    }
    
    if (slot.members.find(m => m.memberId === memberId)) {
        return res.status(400).json({ error: 'Member has already signed up for this slot' });
    }
    
    const members = readJsonFile(MEMBERS_FILE);
    const member = members.find(m => m.memberId === memberId);
    
    if (!member) {
        return res.status(404).json({ error: 'Member not found' });
    }
    
    slot.members.push({
        memberId: memberId,
        firstName: member.firstName,
        lastName: member.lastName
    });
    
    if (writeJsonFile(SLOTS_FILE, slots)) {
        res.json(slot);
    } else {
        res.status(500).json({ error: 'Failed to save signup' });
    }
});

app.delete('/api/signup-sheets/:sheetId/signup/:memberId', (req, res) => {
    const { sheetId, memberId } = req.params;
    
    const signupSheetId = parseInt(sheetId);
    
    if (isNaN(signupSheetId)) {
        return res.status(400).json({ error: 'Invalid signup sheet ID' });
    }
    
    if (!validateMemberId(memberId)) {
        return res.status(400).json({ error: 'Invalid member ID' });
    }
    
    const slots = readJsonFile(SLOTS_FILE);
    let slotInfo = null;
    
    for (let slot of slots) {
        if (slot.signupSheetId === signupSheetId) {
            const memberIndex = slot.members.findIndex(m => m.memberId === memberId);
            if (memberIndex !== -1) {
                slot.members.splice(memberIndex, 1);
                slotInfo = slot;
                break;
            }
        }
    }
    
    if (!slotInfo) {
        return res.status(404).json({ error: 'Signup not found' });
    }
    
    if (writeJsonFile(SLOTS_FILE, slots)) {
        res.json(slotInfo);
    } else {
        res.status(500).json({ error: 'Failed to delete signup' });
    }
});

app.get('/api/slots/:id/members', (req, res) => {
    const { id } = req.params;
    const slotId = parseInt(id);
    
    if (isNaN(slotId)) {
        return res.status(400).json({ error: 'Invalid slot ID' });
    }
    
    const slots = readJsonFile(SLOTS_FILE);
    const slot = slots.find(s => s.id === slotId);
    
    if (!slot) {
        return res.status(404).json({ error: 'Slot not found' });
    }
    
    res.json(slot);
});

app.post('/api/grades', (req, res) => {
    const { memberId, signupSheetId, grade, comment } = req.body;
    
    if (!memberId || !signupSheetId || grade === undefined) {
        return res.status(400).json({ error: 'Member ID, signup sheet ID, and grade are required' });
    }
    
    if (!validateMemberId(memberId)) {
        return res.status(400).json({ error: 'Invalid member ID' });
    }
    
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 999) {
        return res.status(400).json({ error: 'Grade must be a number between 0 and 999' });
    }
    
    const sanitizedComment = sanitizeInput(comment || '', 500);
    
    const grades = readJsonFile(GRADES_FILE);
    const existingGradeIndex = grades.findIndex(g => 
        g.memberId === memberId && g.signupSheetId === parseInt(signupSheetId)
    );
    
    let originalGrade = null;
    
    if (existingGradeIndex !== -1) {
        originalGrade = grades[existingGradeIndex].grade;
        grades[existingGradeIndex].grade = gradeNum;
        
        if (sanitizedComment) {
            if (grades[existingGradeIndex].comment) {
                grades[existingGradeIndex].comment += ' ' + sanitizedComment;
            } else {
                grades[existingGradeIndex].comment = sanitizedComment;
            }
        }
    } else {
        const newGrade = {
            id: generateId(grades),
            memberId: memberId,
            signupSheetId: parseInt(signupSheetId),
            grade: gradeNum,
            comment: sanitizedComment
        };
        grades.push(newGrade);
    }
    
    if (writeJsonFile(GRADES_FILE, grades)) {
        res.json({
            memberId: memberId,
            signupSheetId: parseInt(signupSheetId),
            grade: gradeNum,
            comment: existingGradeIndex !== -1 ? grades[existingGradeIndex].comment : sanitizedComment,
            originalGrade: originalGrade
        });
    } else {
        res.status(500).json({ error: 'Failed to save grade' });
    }
});

app.get('/api/signup-sheets/:id/grades', (req, res) => {
    const { id } = req.params;
    const signupSheetId = parseInt(id);
    
    if (isNaN(signupSheetId)) {
        return res.status(400).json({ error: 'Invalid signup sheet ID' });
    }
    
    const grades = readJsonFile(GRADES_FILE);
    const filteredGrades = grades.filter(g => g.signupSheetId === signupSheetId);
    
    res.json(filteredGrades);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});