
   
        function showSection(sectionId) {
            // Hide all sections
            const sections = document.querySelectorAll('.module-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Initialize with home section
        document.addEventListener('DOMContentLoaded', function() {
            showSection('home');
        });
