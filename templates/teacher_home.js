function populateCoursesTable(courses) {
  const tableBody = document.querySelector('#coursesTable tbody');
  tableBody.innerHTML = '';

  courses.forEach((course) => {
    const row = document.createElement('tr');

    const codeCell = document.createElement('td');
    codeCell.textContent = course.code;
    row.appendChild(codeCell);

    const nameCell = document.createElement('td');
    nameCell.textContent = course.name;
    row.appendChild(nameCell);

    tableBody.appendChild(row);
  });
}
// teacher_home.js

async function fetchTeacherCourses() {
  try {
    const response = await fetch('/teacher_courses');
    if (!response.ok) {
      throw new Error('Failed to fetch teacher courses');
    }
    const data = await response.json();
    return data.courses;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Call the fetchTeacherCourses function
fetchTeacherCourses()
  .then((courses) => {
    // Call the populateCoursesTable function with the fetched courses
    populateCoursesTable(courses);
  })
  .catch((error) => {
    console.error(error);
  });
