const registerForm = document.getElementById("registerForm");
const studentRadio = document.getElementById("student");
const teacherRadio = document.getElementById("teacher");
const adminRadio = document.getElementById("admin");
const studentFields = document.getElementById("studentFields");
const teacherFields = document.getElementById("teacherFields");

// ------------------------------
// SHOW / HIDE FIELDS
// ------------------------------
function toggleStudentFields() {
  if (studentRadio.checked) {
    studentFields.style.display = "block";
  } else {
    studentFields.style.display = "none";
  }
}

function toggleTeacherFields() {
  if (teacherRadio.checked) {
    teacherFields.style.display = "block";
  } else {
    teacherFields.style.display = "none";
  }
}

studentRadio.addEventListener("change", function() {
  toggleStudentFields();
  toggleTeacherFields();
});

teacherRadio.addEventListener("change", function() {
  toggleStudentFields();
  toggleTeacherFields();
});

adminRadio.addEventListener("change", function() {
  toggleStudentFields();
  toggleTeacherFields();
});

// default state
toggleStudentFields();
toggleTeacherFields();

// ------------------------------
// PASSWORD MATCH CHECK
// ------------------------------
// -------------------------------
// FORM VALIDATION
// -------------------------------
function validateForm() {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  // Password match check
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return false;
  }
  
  // Password strength check
  if (password.length < 8) {
    alert("Password must be at least 8 characters long!");
    return false;
  }
  
  // Username validation
  const username = document.getElementById("username").value;
  if (username.length < 3) {
    alert("Username must be at least 3 characters long!");
    return false;
  }
  
  // Email validation
  const email = document.getElementById("email").value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address!");
    return false;
  }
  
  // Role-specific validation
  const role = document.querySelector('input[name="role"]:checked').value;
  
  if (role === "student") {
    // Student-specific validation
    const age = document.querySelector('input[name="age"]').value;
    if (age < 1 || age > 100) {
      alert("Please enter a valid age (1-100)!");
      return false;
    }
    
    const yearOfStudy = document.querySelector('input[name="year_of_study"]').value;
    if (yearOfStudy < 1 || yearOfStudy > 6) {
      alert("Please enter a valid year of study (1-6)!");
      return false;
    }
    
    const email = document.querySelector('input[name="email"]').value;
    if (!email) {
      alert("Email is required for student registration!");
      return false;
    }
  }
  
  if (role === "teacher") {
    // Teacher-specific validation
    const email = document.querySelector('input[name="email"]').value;
    if (!email) {
      alert("Email is required for teacher registration!");
      return false;
    }
    
    const instituteEmail = document.querySelector('input[name="institute_email"]').value;
    if (!instituteEmail) {
      alert("Institute email is required for teacher registration!");
      return false;
    }
  }
  
  if (role === "admin") {
    // Admin-specific validation
    const email = document.querySelector('input[name="email"]').value;
    if (!email) {
      alert("Email is required for admin registration!");
      return false;
    }
  }
  
  return true;
}

// -------------------------------
// PASSWORD STRENGTH INDICATOR
// -------------------------------
function checkPasswordStrength() {
  const password = document.getElementById("password").value;
  const strengthIndicator = document.getElementById("passwordStrength");
  
  if (!strengthIndicator) {
    return;
  }
  
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]+/)) strength++;
  if (password.match(/[A-Z]+/)) strength++;
  if (password.match(/[0-9]+/)) strength++;
  if (password.match(/[$@#&!]+/)) strength++;
  
  switch(strength) {
    case 0:
    case 1:
      strengthIndicator.textContent = "Very Weak";
      strengthIndicator.style.color = "#ff0000";
      break;
    case 2:
      strengthIndicator.textContent = "Weak";
      strengthIndicator.style.color = "#ff6600";
      break;
    case 3:
      strengthIndicator.textContent = "Medium";
      strengthIndicator.style.color = "#ffcc00";
      break;
    case 4:
      strengthIndicator.textContent = "Strong";
      strengthIndicator.style.color = "#99cc00";
      break;
    case 5:
      strengthIndicator.textContent = "Very Strong";
      strengthIndicator.style.color = "#00cc00";
      break;
  }
}

// -------------------------------
// USERNAME AVAILABILITY CHECK
// -------------------------------
function checkUsernameAvailability() {
  const username = document.getElementById("username").value;
  const usernameStatus = document.getElementById("usernameStatus");
  
  if (!username) {
    if (usernameStatus) {
      usernameStatus.textContent = "";
    }
    return;
  }
  
  // Simple client-side validation
  if (username.length < 3) {
    if (usernameStatus) {
      usernameStatus.textContent = "Username too short!";
      usernameStatus.style.color = "#ff0000";
    }
    return;
  }
  
  // Simulate availability check (in real app, this would be an API call)
  setTimeout(() => {
    if (usernameStatus) {
      const availableUsernames = ["student1", "teacher1", "admin1"];
      if (availableUsernames.includes(username)) {
        usernameStatus.textContent = "Username already taken!";
        usernameStatus.style.color = "#ff0000";
      } else {
        usernameStatus.textContent = "Username available!";
        usernameStatus.style.color = "#00cc00";
      }
    }
  }, 500);
}

// -------------------------------
// FIELD VISIBILITY AND VALIDATION
// -------------------------------
function validateField(field, validationType) {
  const value = field.value.trim();
  const fieldName = field.name || field.id;
  
  switch(validationType) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showFieldError(field, "Please enter a valid email address");
        return false;
      }
      break;
      
    case "phone":
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(value)) {
        showFieldError(field, "Please enter a valid 10-digit phone number");
        return false;
      }
      break;
      
    case "pincode":
      const pincodeRegex = /^[0-9]{6}$/;
      if (!pincodeRegex.test(value)) {
        showFieldError(field, "Please enter a valid 6-digit pincode");
        return false;
      }
      break;
      
    case "aadhar":
      const aadharRegex = /^[0-9]{12}$/;
      if (!aadharRegex.test(value)) {
        showFieldError(field, "Please enter a valid 12-digit Aadhar number");
        return false;
      }
      break;
      
    case "required":
      if (!value) {
        showFieldError(field, "This field is required");
        return false;
      }
      break;
      
    default:
      break;
  }
  
  hideFieldError(field);
  return true;
}

function showFieldError(field, message) {
  let errorDiv = field.parentNode.querySelector('.field-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    field.parentNode.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
  errorDiv.style.color = '#ff0000';
}

function hideFieldError(field) {
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// -------------------------------
// SUCCESS MESSAGE
// -------------------------------
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// -------------------------------
// ERROR MESSAGE
// -------------------------------
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #f44336;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

// -------------------------------
// FORM SUBMISSION
// -------------------------------
registerForm.addEventListener("submit", function (e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  // Show loading indicator
  const submitButton = this.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Registering...";
  submitButton.disabled = true;
  
  // Simulate form submission
  setTimeout(() => {
    // In real app, this would be an AJAX call
    showSuccessMessage("Registration successful! You will be redirected to login.");
    
    // Reset form
    this.reset();
    
    // Reset button
    submitButton.textContent = originalText;
    submitButton.disabled = false;
    
    // Redirect to login after success
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  }, 1000);
});

// -------------------------------
// INPUT EVENT LISTENERS
// -------------------------------
const inputs = document.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
  input.addEventListener('blur', function() {
    if (this.type === 'email') {
      validateField(this, 'email');
    } else if (this.type === 'tel') {
      validateField(this, 'phone');
    } else if (this.name === 'pincode') {
      validateField(this, 'pincode');
    } else if (this.name === 'aadhar_number') {
      validateField(this, 'aadhar');
    } else if (this.hasAttribute('required')) {
      validateField(this, 'required');
    }
  });
  
  if (this.type === 'password') {
    this.addEventListener('input', checkPasswordStrength);
  }
});

// -------------------------------
// USERNAME AVAILABILITY CHECK
// -------------------------------
document.getElementById('username').addEventListener('input', checkUsernameAvailability);

document.getElementById('password').addEventListener('input', checkPasswordStrength);

document.getElementById('confirmPassword').addEventListener('input', function() {
  const password = document.getElementById('password').value;
  const confirmPassword = this.value;
  
  if (password !== confirmPassword) {
    showFieldError(this, "Passwords do not match!");
  } else {
    hideFieldError(this);
  }
});
