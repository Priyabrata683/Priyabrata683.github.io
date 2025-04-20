<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PRIYABRATA PARIDA - Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .fade-in {
      animation: fadeIn 1s ease-in forwards;
      opacity: 0;
    }
    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }
  </style>
</head>
  <body class="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-gray-800">
  <header class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-6 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-indigo-600">PRIYABRATA PARIDA</h1>
      <nav class="space-x-6 text-gray-600 hidden md:flex">
        <a href="#about" class="hover:text-indigo-600 transition">About</a>
        <a href="#skills" class="hover:text-indigo-600 transition">Skills</a>
        <a href="#projects" class="hover:text-indigo-600 transition">Projects</a>
        <a href="#contact" class="hover:text-indigo-600 transition">Contact</a>
      </nav>
      <button id="menu-btn" class="md:hidden text-gray-600 focus:outline-none">
        <i class="fas fa-bars fa-lg"></i>
      </button>
    </div>
    <nav id="mobile-menu" class="hidden bg-white shadow-md md:hidden">
      <a href="#about" class="block px-6 py-3 border-b border-gray-200 hover:bg-indigo-50">About</a>
      <a href="#skills" class="block px-6 py-3 border-b border-gray-200 hover:bg-indigo-50">Skills</a>
      <a href="#projects" class="block px-6 py-3 border-b border-gray-200 hover:bg-indigo-50">Projects</a>
      <a href="#contact" class="block px-6 py-3 hover:bg-indigo-50">Contact</a>
    </nav>
  </header>

  <main class="container mx-auto px-6 py-12 space-y-20">
    <!-- About Section -->
    <section id="about" class="fade-in max-w-4xl mx-auto text-center">
      <h2 class="text-4xl font-extrabold mb-4 text-indigo-600">PRIYABRATA PARIDA</h2>
      <p class="text-lg text-gray-600 max-w-3xl mx-auto">
        Hello! I am PRIYABRATA PARIDA a Mechanical Engineering graduate with a strong focus on automotive design and hands-on project experience, including leading the design team for an Electric Go-Kart. Conducted research on optimizing connecting rod materials for durability and cost-effectiveness. A self-taught Python learner , actively expanding skills to combine mechanical systems with automation and software. Proficient in AutoCAD, PTC Creo, Fusion 360, and ANSYS.
      </p>
    </section>

    <!-- Skills Section -->
    <section id="skills" class="fade-in max-w-5xl mx-auto">
      <h3 class="text-3xl font-bold mb-8 text-center text-indigo-600">Skills</h3>
      <h4 class="text-xl font-semibold mb-4">Technical Skills</h4>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-8 text-center mb-12">
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-drafting-compass text-5xl text-indigo-600 mb-3"></i>
          <h4 class="font-semibold text-lg">AutoCAD</h4>
          <p class="text-gray-500 text-sm mt-1">2D & 3D CAD Design</p>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-cogs text-5xl text-indigo-600 mb-3"></i>
          <h4 class="font-semibold text-lg">ANSYS Workbench</h4>
          <p class="text-gray-500 text-sm mt-1">Finite Element Analysis</p>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-cube text-5xl text-indigo-600 mb-3"></i>
          <h4 class="font-semibold text-lg">PTC Creo</h4>
          <p class="text-gray-500 text-sm mt-1">3D CAD Modeling</p>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-tools text-5xl text-indigo-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Fusion 360</h4>
          <p class="text-gray-500 text-sm mt-1">CAD, CAM, CAE</p>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fab fa-python text-5xl text-indigo-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Python</h4>
          <p class="text-gray-500 text-sm mt-1">Scripting & Automation</p>
        </div>
      </div>
      <h4 class="text-xl font-semibold mb-4">Soft Skills</h4>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-8 text-center">
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-users text-5xl text-green-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Teamwork</h4>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-clock text-5xl text-green-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Time Management</h4>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-desktop text-5xl text-green-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Computer Operating</h4>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-car-side text-5xl text-green-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Automotive Design</h4>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-lg transition">
          <i class="fas fa-hard-hat text-5xl text-green-600 mb-3"></i>
          <h4 class="font-semibold text-lg">Hard Working</h4>
        </div>
      </div>
    </section>

    <!-- Projects Section -->
    <section id="projects" class="fade-in max-w-5xl mx-auto">
      <h3 class="text-3xl font-bold mb-8 text-center text-indigo-600">Projects</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col">
          <h4 class="text-xl font-semibold mb-2">Electrical Go-Kart</h4>
          <p class="text-gray-600 flex-grow">My team and I successfully built an Electric Go-Kart from scratch with the primary goal of participating in the motorsport event GKDC 2019. I served as the Team Leader of the Design Team, overseeing vehicle design, functionality, safety, and performance. This project enhanced my technical and leadership skills and gave me hands-on experience in electric vehicle systems and motorsport engineering.</p>
        </div>
        <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col">
          <h4 class="text-xl font-semibold mb-2">RoboRider: Arduino-Based Remote Control Vehicle</h4>
          <p class="text-gray-600 flex-grow">Contributed to the development of RoboRider, a remote-controlled vehicle powered by Arduino. Involved assembling hardware components and writing Arduino code to control movements. Gained practical experience in robotics, microcontroller programming, and remote communication. Our team placed 3rd in a race competition.</p>
        </div>
        <div class="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col">
          <h4 class="text-xl font-semibold mb-2">Thesis: Analysis of Connecting Rod under Different Material & Load Conditions</h4>
          <p class="text-gray-600 flex-grow">Conducted detailed analysis to identify the most suitable alloy for manufacturing connecting rods that withstand heavy loads and harsh conditions. Evaluated materials based on durability, mechanical performance, and cost-effectiveness to recommend an optimal material for large-scale production.</p>
          <a href="./IJERT_Analysis_of_Connecting_Rod_Under_D.pdf" download class="mt-4 inline-block text-indigo-600 hover:underline">Download Thesis PDF</a>
        </div>
      </div>
    </section>

    <!-- Education Section -->
    <section id="education" class="fade-in max-w-4xl mx-auto">
      <h3 class="text-3xl font-bold mb-8 text-indigo-600 text-center">Education</h3>
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-xl font-semibold mb-2">Bachelor of Mechanical Engineering (B. Tech)</h4>
        <p class="mb-1">G.I.E.T University, Gunupur, Rayagada, Odisha</p>
        <p class="mb-1">Graduated: 2021</p>
        <p class="mb-4">CGPA: 7.97</p>
        <label for="sgpa-toggle" class="block mb-2 font-semibold cursor-pointer select-none">Semester-wise SGPA (click to toggle)</label>
        <div id="sgpa-toggle" class="hidden bg-gray-50 border border-gray-300 rounded-md p-4">
          <ul class="list-disc list-inside text-gray-700">
            <li>1st Semester: 8.38</li>
            <li>2nd Semester: 7.96</li>
            <li>3rd Semester: 7.13</li>
            <li>4th Semester: 7.38</li>
            <li>5th Semester: 7.52</li>
            <li>6th Semester: 7.96</li>
            <li>7th Semester: 8.70</li>
            <li>8th Semester: 9.05</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Education Section Higher Secondary -->
    <section id="education-higher-secondary" class="fade-in max-w-4xl mx-auto mt-12">
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-xl font-semibold mb-2">Higher Secondary Examination (12th Grade)</h4>
        <p class="mb-1">Ispat Vidya Mandir, Rourkela, Odisha</p>
        <p class="mb-1">Graduated: 2017</p>
        <p class="mb-4">Percentage: 52.83%</p>
      </div>
    </section>

    <!-- Education Section Continued -->
    <section id="education-secondary" class="fade-in max-w-4xl mx-auto mt-12">
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-xl font-semibold mb-2">Secondary Education (10th Grade)</h4>
        <p class="mb-1">Chinmaya Vidyalaya (O.M.), Rourkela, Odisha</p>
        <p class="mb-1">Graduated: 2015</p>
        <p class="mb-4">Percentage: 80.2%</p>
        <label for="secondary-subjects-toggle" class="block mb-2 font-semibold cursor-pointer select-none">Subject-wise Marks (click to toggle)</label>
        <div id="secondary-subjects-toggle" class="hidden bg-gray-50 border border-gray-300 rounded-md p-4">
          <ul class="list-disc list-inside text-gray-700">
            <li>Mathematics: 95%</li>
            <li>General Science: 71%</li>
            <li>Social Science: 77%</li>
            <li>Odia: 74%</li>
            <li>English: 73%</li>
            <li>Sanskrit: 92%</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="fade-in max-w-4xl mx-auto text-center">
      <h3 class="text-3xl font-bold mb-8 text-indigo-600">Contact Me</h3>
      <p class="mb-6 text-gray-600">Feel free to reach out via social media, email, phone, or send me a message using the form below.</p>
      <div class="flex justify-center space-x-6 mb-4 text-gray-600 text-2xl">
        <a href="https://www.linkedin.com/in/priyabrata-parida-134970189" target="_blank" aria-label="LinkedIn" class="hover:text-blue-700 transition"><i class="fab fa-linkedin"></i></a>
        <a href="https://github.com/Priyabrata683" target="_blank" aria-label="GitHub" class="hover:text-gray-900 transition"><i class="fab fa-github"></i></a>
      </div>
      <p class="mb-2 text-gray-700 font-semibold">Email: <a href="mailto:priyabrata683@gmail.com" class="text-indigo-600 hover:underline">priyabrata683@gmail.com</a></p>
      <p class="mb-8 text-gray-700 font-semibold">Phone: <a href="tel:+918249583054" class="text-indigo-600 hover:underline">+91-8249583054</a></p>
      <form class="max-w-xl mx-auto space-y-6 text-left" action="#" method="POST">
        <div>
          <label for="name" class="block mb-2 font-semibold">Name</label>
          <input type="text" id="name" name="name" required class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label for="email" class="block mb-2 font-semibold">Email</label>
          <input type="email" id="email" name="email" required class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label for="message" class="block mb-2 font-semibold">Message</label>
          <textarea id="message" name="message" rows="4" required class="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>
        <button type="submit" class="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition">Send Message</button>
      </form>
    </section>

  </main>


  <script>
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Toggle SGPA visibility
    const sgpaLabel = document.querySelector('label[for="sgpa-toggle"]');
    const sgpaDiv = document.getElementById('sgpa-toggle');
    sgpaLabel.addEventListener('click', () => {
      sgpaDiv.classList.toggle('hidden');
    });

    // Toggle Secondary subjects visibility
    const secondaryLabel = document.querySelector('label[for="secondary-subjects-toggle"]');
    const secondaryDiv = document.getElementById('secondary-subjects-toggle');
    secondaryLabel.addEventListener('click', () => {
      secondaryDiv.classList.toggle('hidden');
    });
  </script>
  <!-- Footer -->

  <script>
   function createFooter() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes colorShift {
      0% { color: #4f46e5; }   /* Indigo */
      25% { color: #3b82f6; }  /* Blue-500 */
      50% { color: #ec4899; }  /* Pink-500 */
      75% { color: #8b5cf6; }  /* Violet-500 */
      100% { color: #4f46e5; } /* Back to Indigo */
    }

    .animated-name {
      animation: colorShift 3s infinite;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  const footer = document.createElement("footer");
  footer.style.cssText = `
    background-color: #0d47a1;
    color: #ffffff;
    text-align: center;
    padding: 1rem;
    font-size: 0.9rem;
    width: 100%;
    display: none;
  `;
  footer.innerHTML = `
    <p style="margin: 0;">Thank you for visiting my portfolio! 🙏✨</p>
    <p style="margin: 0;">Created by 💻 with passion by <span class="animated-name">PRIYABRATA PARIDA</span> ❤️</p>
  `;
  document.body.appendChild(footer);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const bodyHeight = document.body.offsetHeight;

    if (scrollTop + windowHeight >= bodyHeight - 10) {
      footer.style.display = 'block';
    } else {
      footer.style.display = 'none';
    }
  });
}
createFooter();

  </script>
  </body>
</html>

