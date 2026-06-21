
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== DATA LAYER ====================
// In-memory database
class StudentDatabase {
    constructor() {
        this.students = [
            { id: 1, name: 'Alice Johnson', age: 20, major: 'Computer Science', gpa: 3.8 },
            { id: 2, name: 'Bob Smith', age: 22, major: 'Mathematics', gpa: 3.5 },
            { id: 3, name: 'Carol Davis', age: 21, major: 'Physics', gpa: 3.9 }
        ];
        this.nextId = 4;
    }

    getAll() {
        return this.students;
    }

    getById(id) {
        return this.students.find(s => s.id === id);
    }

    create(student) {
        const newStudent = { id: this.nextId++, ...student };
        this.students.push(newStudent);
        return newStudent;
    }

    update(id, updatedData) {
        const index = this.students.findIndex(s => s.id === id);
        if (index === -1) return null;
        this.students[index] = { ...this.students[index], ...updatedData };
        return this.students[index];
    }

    delete(id) {
        const index = this.students.findIndex(s => s.id === id);
        if (index === -1) return false;
        this.students.splice(index, 1);
        return true;
    }
}

// ==================== REPOSITORY LAYER ====================
class StudentRepository {
    constructor(db) {
        this.db = db;
    }

    findAll() {
        return this.db.getAll();
    }

    findById(id) {
        return this.db.getById(id);
    }

    save(studentData) {
        return this.db.create(studentData);
    }

    update(id, studentData) {
        return this.db.update(id, studentData);
    }

    delete(id) {
        return this.db.delete(id);
    }
}

// ==================== SERVICE LAYER (Business Logic) ====================
class StudentService {
    constructor(repository) {
        this.repository = repository;
    }

    getAllStudents() {
        return this.repository.findAll();
    }

    getStudentById(id) {
        const student = this.repository.findById(id);
        if (!student) {
            throw new Error('Student not found');
        }
        return student;
    }

    createStudent(studentData) {
        // Business validation
        if (!studentData.name || studentData.name.length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        if (!studentData.age || studentData.age < 18 || studentData.age > 100) {
            throw new Error('Age must be between 18 and 100');
        }
        if (!studentData.major) {
            throw new Error('Major is required');
        }
        if (studentData.gpa !== undefined && (studentData.gpa < 0 || studentData.gpa > 4.0)) {
            throw new Error('GPA must be between 0 and 4.0');
        }

        return this.repository.save(studentData);
    }

    updateStudent(id, studentData) {
        // Check if student exists
        const existing = this.repository.findById(id);
        if (!existing) {
            throw new Error('Student not found');
        }

        // Business validation for updates
        if (studentData.name && studentData.name.length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        if (studentData.age && (studentData.age < 18 || studentData.age > 100)) {
            throw new Error('Age must be between 18 and 100');
        }
        if (studentData.gpa !== undefined && (studentData.gpa < 0 || studentData.gpa > 4.0)) {
            throw new Error('GPA must be between 0 and 4.0');
        }

        return this.repository.update(id, studentData);
    }

    deleteStudent(id) {
        const deleted = this.repository.delete(id);
        if (!deleted) {
            throw new Error('Student not found');
        }
        return true;
    }

    // Additional business logic: Get honors students (GPA >= 3.5)
    getHonorsStudents() {
        return this.repository.findAll().filter(s => s.gpa >= 3.5);
    }

    // Get students by major
    getStudentsByMajor(major) {
        return this.repository.findAll().filter(s => 
            s.major.toLowerCase() === major.toLowerCase()
        );
    }
}

// ==================== CONTROLLER LAYER (REST API) ====================
class StudentController {
    constructor(service) {
        this.service = service;
    }

    // GET /api/students
    getAllStudents(req, res) {
        try {
            const students = this.service.getAllStudents();
            res.json({
                success: true,
                data: students,
                count: students.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // GET /api/students/:id
    getStudentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const student = this.service.getStudentById(id);
            res.json({ success: true, data: student });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    // POST /api/students
    createStudent(req, res) {
        try {
            const student = this.service.createStudent(req.body);
            res.status(201).json({ success: true, data: student });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    // PUT /api/students/:id
    updateStudent(req, res) {
        try {
            const id = parseInt(req.params.id);
            const student = this.service.updateStudent(id, req.body);
            res.json({ success: true, data: student });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    // DELETE /api/students/:id
    deleteStudent(req, res) {
        try {
            const id = parseInt(req.params.id);
            this.service.deleteStudent(id);
            res.json({ success: true, message: 'Student deleted successfully' });
        } catch (error) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    // GET /api/students/honors
    getHonorsStudents(req, res) {
        try {
            const students = this.service.getHonorsStudents();
            res.json({ success: true, data: students });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // GET /api/students/major/:major
    getStudentsByMajor(req, res) {
        try {
            const students = this.service.getStudentsByMajor(req.params.major);
            res.json({ success: true, data: students });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

// ==================== SETUP ROUTES ====================
const db = new StudentDatabase();
const repository = new StudentRepository(db);
const service = new StudentService(repository);
const controller = new StudentController(service);

// Route definitions
app.get('/api/students', (req, res) => controller.getAllStudents(req, res));
app.get('/api/students/honors', (req, res) => controller.getHonorsStudents(req, res));
app.get('/api/students/major/:major', (req, res) => controller.getStudentsByMajor(req, res));
app.get('/api/students/:id', (req, res) => controller.getStudentById(req, res));
app.post('/api/students', (req, res) => controller.createStudent(req, res));
app.put('/api/students/:id', (req, res) => controller.updateStudent(req, res));
app.delete('/api/students/:id', (req, res) => controller.deleteStudent(req, res));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET    /api/students`);
    console.log(`  GET    /api/students/:id`);
    console.log(`  POST   /api/students`);
    console.log(`  PUT    /api/students/:id`);
    console.log(`  DELETE /api/students/:id`);
    console.log(`  GET    /api/students/honors`);
    console.log(`  GET    /api/students/major/:major`);
});