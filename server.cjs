const { log } = require('console');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const cors = require('cors');




app.set('view engine', 'ejs');

// Set the path to your views directory
const viewsPath = path.join(__dirname, 'views');
app.set('views', viewsPath);

const templatesPath = path.join(__dirname, 'templates');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(templatesPath));
app.use(cors());
app.use(express.json());





// Database connection
const uri = "mongodb+srv://amnesalame:Amneamne1@cluster0.2b8vwrw.mongodb.net/?retryWrites=true&w=majority";

async function connect() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

// Student Schema
const StudentSchema = new mongoose.Schema({
   _id: {
      type: mongoose.Types.ObjectId,
      auto: true,
      primaryKey: true
    },
    id: {
        type: String,
        required: true,
        unique: true
      },
    name: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: "student"
    },
     courses:{
        type: [String],
        default: []
      },
    }, { _id: false 
    }); // Disable the _id field
     

// Teacher Schema
const TeacherSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
    auto: true,
    primaryKey: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
      type: String,
      required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "teacher"
   },
  courses:{
    type: [String],
    default: []
  }
  });
  // courses Schema
const CoursesSchema = new mongoose.Schema({
  code: {
      type: String,
      required: true,
      unique: true
    },
  name: {
    type: String,
    required: true
  },
  teacherId:{
    type: String,
    ref: 'Teacher'
    
  }}, { _id: false 
});
  // Enrollment Schema
  const EnrollmentsSchema = new mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    courseId: {
      type: String,
      ref: 'Course',
    },
    studentId: {
      type: String,
      ref: 'Student',
      field: 'id',
    },
    labGrades: {
      type: Number,
      default: null,
    },
    homeworkGrades: {
      type: Number,
      default: null,
    },
  });
  
  
  

const StudentModel = mongoose.model("Student", StudentSchema);
const TeacherModel = mongoose.model("Teacher", TeacherSchema);
const Enrollment = mongoose.model('Enrollment', EnrollmentsSchema);
const Course = mongoose.model('Course', CoursesSchema);

app.get('/', (req, res) => {
  res.sendFile(path.join(templatesPath, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(templatesPath, 'signup.html'));
});

app.post("/signup", async (req, res) => {
  const data = {
    _id:new mongoose.Types.ObjectId(),
    id: req.body.id,
    name: req.body.name,
    password: req.body.password,
    role: req.body.role // Added role field in the signup form
  };
  try {
    let existingUser;
    if (data.role === "student") {
      existingUser = await StudentModel.findOne({ id: data.id }).exec();
    } else if (data.role === "teacher") {
      existingUser = await TeacherModel.findOne({ id: data.id }).exec();
    }

    if (existingUser) {
      res.render('signup_error', { error: 'ID already exists. Please choose a different ID.' });
      return;
    }
    if (data.role === "student") {
      const student = new StudentModel(data);
      await student.save();
      res.render('signup_success', { message: 'Signup successful. You can now log in.', loginLink: '/login' });
    } else if (data.role === "teacher") {
      const teacher = new TeacherModel(data);
      await teacher.save();
      res.render('signup_success', { message: 'Signup successful. You can now log in.', loginLink: '/login' });
    } else {
      res.render('signup_error', { error: 'Invalid role specified.' });
    }
  } catch (error) {
    console.error(error);
    res.render('signup_error', { error: 'please fill the inputs fileds.' });
  }
});
let storedTeacherId;
let storedTeacherName;
let storedStudentId;
let storedStudentName;
app.post("/login", async (req, res) => {
    const { id,name, password, role } = req.body;
  
    try {
      let user;
  
      if (role === "teacher") {
        user = await TeacherModel.findOne({ id,name, password }).exec();
      } else if (role === "student") {
        user = await StudentModel.findOne({ id,name, password }).exec();
      } else {
        res.send('Invalid role specified.');
        return;
      }
  
      if (user) {
        if (role === "teacher") {
          storedTeacherId=id
          storedTeacherName=name
          console.log(storedTeacherName)
          res.redirect('/teacher_home');

        } else if (role === "student") {
          storedStudentId = id
          storedStudentName=name
          console.log(storedStudentName,"aaaaaaaaaaaaaaaaaaa");
          res.redirect('/student_home');
        }
      } else {
        res.render('login_error', { error: 'invalid username or password' });
        

      }
  
    } catch (error) {
      console.error(error);
      res.send('An error occurred while logging in.');
    }
  });
  app.get("/teacher_home", async (req, res) => {
    try {
      const teacherName = storedTeacherName;
      const teacherId = storedTeacherId;
      console.log(teacherName,teacherId);
      const courses = await Course.find({ teacherId }).exec();
      res.render('teacher_home', { teacherName, courses });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  app.get("/teacher_courses", async (req, res) => {
    try {
      const teacherId = req.session.teacherId;
      const courses = await Course.find({ teacherId }).exec();
  
      res.json({ courses });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  app.post('/save_grades/:courseCode', async (req, res) => {
    const courseCode = req.params.courseCode;
    const grades = req.body;
  
    try {
      for (const grade of grades) {
        const { studentId, labGrade, homeworkGrade } = grade;
        await Enrollment.updateOne(
          { courseId: courseCode, studentId: studentId },
          { $set: { labGrades: labGrade, homeworkGrades: homeworkGrade } }
        );
      }
  
      console.log('Grades saved successfully.');
      res.sendStatus(200);
    } catch (error) {
      console.error('An error occurred while saving grades:', error);
      res.sendStatus(500);
    }
  });
  
  
  app.get('/course_details/:courseId', async (req, res) => {
    try {
      const courseId = req.params.courseId;
      console.log(courseId,"courseiddd")
  
      // Fetch the course data
      const course = await Course.findOne({ code: courseId }).exec();
      console.log(course,"coursee");
  
      // Fetch enrollments for the course
      const enrollments = await Enrollment.find({ courseId: courseId }).exec();
  
      console.log(enrollments); // Log enrollments
  
      // Fetch student data for each enrollment
      const studentsPromises = enrollments.map((enrollment) => {
        return StudentModel.findOne({ id: enrollment.studentId }).exec();
      });
      const students = await Promise.all(studentsPromises);
  
      console.log(students); // Log students data
      
  
      // Send data to the client
      res.render('course_details', { course: course, students: students ,enrollments:enrollments});
  
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.get('/student_home', async (req, res) => {
  try {
    const studentId = storedStudentId;
    const studentName = storedStudentName;
    console.log(studentName);

    // Fetch enrolled courses from the database for the current student
    const enrolledCourses = await Enrollment.find({ studentId })
      .populate({ path: 'courseId', model: 'Course', select: 'code name' })
      .exec();

    // Render the student_home view and pass the enrolled courses and student name
    res.render('student_home', { studentName, enrolledCourses });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
let availableCourses = [];


app.get('/enroll_courses', async (req, res) => {
  try {
    const studentId = storedStudentId;

    // Fetch all courses from the database
    const courses = await Course.find().exec();

    // Fetch the courses that the student has already enrolled in
    const enrolledCourses = await Enrollment.find({ studentId }).exec();
    const enrolledCourseIds = enrolledCourses.map((enrollment) => enrollment.courseId);

    // Filter out the courses that the student has already enrolled in
    const availableCourses = courses.filter((course) => !enrolledCourseIds.includes(course.code));

    // Check if enrollment was successful
    const enrollmentSuccess = req.query.enrollment === 'success';

    res.render('enroll_courses', { courses: availableCourses, enrollmentSuccess });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/enroll', async (req, res) => {
  try {
    const studentId = storedStudentId;
    const courseId = req.body.courseId;
    const labGrades = req.body.labGrades;
    const homeworkGrades = req.body.homeworkGrades;

    // Check if the student is already enrolled in the course
    const isEnrolled = await Enrollment.exists({ studentId, courseId });

    if (isEnrolled) {
      res.send('Already enrolled in the course.');
      return;
    }

    // Create a new enrollment record for the student and course
    const enrollment = new Enrollment({
      _id: new mongoose.Types.ObjectId(),
      courseId: courseId,
      studentId: studentId,
      labGrades: labGrades,
      homeworkGrades: homeworkGrades
    });

    await enrollment.save();

    // Fetch the enrolled course from the available courses array
    const enrolledCourseIndex = availableCourses.findIndex((course) => course.code === courseId);

    // Remove the enrolled course from the available courses array
    if (enrolledCourseIndex !== -1) {
      availableCourses.splice(enrolledCourseIndex, 1);
    }

    res.redirect('/enroll_courses?enrollment=success');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



// app.js
app.post('/logout', (req, res) => {
  
  res.redirect('/');
  
});

app.get('/view_enrolled_courses', async (req, res) => {
  try {
    const studentId = storedStudentId;

    // Fetch enrolled courses for the current student
    const enrollments = await Enrollment.find({ studentId }).exec();

    // Get an array of courseIds from the enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);

    // Fetch the course data for all the courseIds
    const coursesPromises = courseIds.map(courseId => Course.findOne({ code: courseId }).exec());
    const courses = await Promise.all(coursesPromises);

    // Combine the enrolled courses with the course data
    const enrolledCourses = enrollments.map((enrollment, index) => ({
      _id: enrollment._id,
      courseId: enrollment.courseId,
      courseCode: courses[index].code,
      courseName: courses[index].name
    }));

    res.render('view_enrolled_courses', { enrolledCourses });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
// Server-side code

// Update the /delete_enrollment route to handle the enrollment deletion
app.post('/delete_enrollment/:enrollmentId', async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId;

    // Delete the enrollment record
    const deleteResult = await Enrollment.deleteOne({ _id: enrollmentId }).exec();

    if (deleteResult.deletedCount === 0) {
      res.status(404).send('Enrollment not found.');
      return;
    }

    // Fetch the updated enrolled courses for the current student
    const studentId = storedStudentId;
    const updatedEnrollments = await Enrollment.find({ studentId }).exec();

    // Fetch the updated course data for the remaining enrolled courses
    const courseIds = updatedEnrollments.map(enrollment => enrollment.courseId);
    const coursesPromises = courseIds.map(courseId => Course.findOne({ code: courseId }).exec());
    const courses = await Promise.all(coursesPromises);

    // Combine the updated enrolled courses with the updated course data
    const updatedEnrolledCourses = updatedEnrollments.map((enrollment, index) => ({
      _id: enrollment._id,
      courseId: enrollment.courseId,
      courseCode: courses[index].code,
      courseName: courses[index].name
    }));

    res.json({ success: true, enrolledCourses: updatedEnrolledCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
app.get('/view_grades', async (req, res) => {
  try {
    const studentId = storedStudentId;

    // Fetch enrolled courses for the current student
    const enrollments = await Enrollment.find({ studentId }).exec();

    // Get an array of courseIds from the enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);

    // Fetch the course data for all the courseIds
    const coursesPromises = courseIds.map(courseId => Course.findOne({ code: courseId }).exec());
    const courses = await Promise.all(coursesPromises);

    // Combine the enrolled courses with the course data
    const enrolledCourses = enrollments.map((enrollment, index) => ({
      courseId: courses[index],
      labGrades: enrollment.labGrades,
      homeworkGrades: enrollment.homeworkGrades
    }));

    console.log(enrolledCourses); // Log enrolled courses

    res.render('view_grades', { enrolledCourses });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/grades_distribution', async (req, res) => {
  try {
    const studentId = storedStudentId // Assuming you have a session with the student's ID stored

    // Fetch enrolled courses for the current student
    const enrollments = await Enrollment.find({ studentId }).exec();

    // Get an array of courseIds from the enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);

    // Fetch the grades for the current student and all enrolled courses
    const grades = await Enrollment.find({ studentId, courseId: { $in: courseIds } }).exec();

    // Calculate the distribution of grades for all enrolled courses
    const distributions = [];

    // Iterate over each enrolled course's grades
    for (const grade of grades) {
      const labGrade = grade.labGrades;
      const homeworkGrade = grade.homeworkGrades;

      // Calculate the distribution based on your requirements
      // For example, you can use a histogram or any other statistical method
      // to calculate the distribution of grades.

      const distribution = [0, 0, 0, 0, 0]; // Array to store the count of each grade range

      // Assign each grade to a grade range
      if (labGrade >= 90 && homeworkGrade >= 90) {
        distribution[0] += 1; // Grade range A
      } else if (labGrade >= 80 && homeworkGrade >= 80) {
        distribution[1] += 1; // Grade range B
      } else if (labGrade >= 70 && homeworkGrade >= 70) {
        distribution[2] += 1; // Grade range C
      } else if (labGrade >= 60 && homeworkGrade >= 60) {
        distribution[3] += 1; // Grade range D
      } else {
        distribution[4] += 1; // Grade range F
      }

      distributions.push(distribution);
    }

    // Fetch course names for display in the template
    const courseNames = await Course.find({ code: { $in: courseIds } }).distinct('name').exec();
    console.log(distributions);
    console.log(courseNames);

    res.render('grades_distribution', { enrolledCourses: enrollments, distributions, courseNames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Contact Us route
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'contact.html'));
});
app.get('/TeacherContact', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'TeacherContact.html'));
});


// Connection to server
connect();
app.listen(8000, () => {
  console.log("Server started on port 8000");
});