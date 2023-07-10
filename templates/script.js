document.addEventListener('DOMContentLoaded', () => {
  const navigation = document.getElementById('navigation');
  const path = window.location.pathname;

  // Update the history when a new page is visited
  updateNavigationHistory(path);

  // Generate the breadcrumb navigation
  const breadcrumbs = generateBreadcrumbs();
  navigation.innerHTML = breadcrumbs;

 

  function updateNavigationHistory(path) {
    const history = getNavigationHistory();

    const index = history.indexOf(path);
    if (index !== -1) {
      history.splice(index + 1);
    } else {
      history.push(path);
    }

    updateStorage(history);
  }

  function generateBreadcrumbs() {
    const history = getNavigationHistory();
    const breadcrumbs = [];

    history.forEach((path, index) => {
      const label = getPageLabel(path);
      const breadcrumb = `<li><a href="${path}">${label}</a></li>`;
      breadcrumbs.push(breadcrumb);
    });

    return `<ul class="breadcrumb">${breadcrumbs.join(' > ')}</ul>`;
  }

  function getPageLabel(path) {
    // Customize this function to return the label for each page based on its path
    if (path === '/') {
      return 'Home';
    } else if (path === '/enroll_courses') {
      return 'Enroll Courses';
    } else if (path === '/view_grades') {
      return 'View Grades';
    } else if (path === '/teacher_home') {
      return 'Teacher Home';
    } else if (path === '/view_enrolled_courses') {
      return 'View Enroll Courses';
    } else if (path === '/student_home') {
      return 'Student Home Page';
    } else if (path === '/grades_distribution') {
      return 'Grades Distribution';
    } else if (path === '/course_details') {
      return 'Course Details';
    }

    return 'Unknown Page';
  }

  function getNavigationHistory() {
    const historyString = localStorage.getItem('navigationHistory');
    return historyString ? JSON.parse(historyString) : [];
  }

  function updateStorage(history) {
    localStorage.setItem('navigationHistory', JSON.stringify(history));
  }

  
});
