const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps', 'client', 'src', 'components', 'course-page');

const replacements = {
  // CSS file import
  "import './course-page.css'": "",

  // Class replacements
  "cp-panel": "bg-card/80 backdrop-blur-xl shadow-xl",
  "cp-panel-glow": "bg-[radial-gradient(ellipse_at_top_right,var(--primary),transparent_68%)] opacity-10",
  "cp-checkout": "bg-card/80 backdrop-blur-xl shadow-2xl",
  "cp-checkout-aura": "bg-[radial-gradient(ellipse_at_top,var(--primary),transparent_65%)] opacity-20",
  "cp-inner-tile": "bg-surface/50 hover:bg-surface transition-all duration-200 hover:shadow-lg hover:shadow-primary/10",
  "cp-section-header": "bg-surface/50 hover:bg-surface transition-colors duration-200",
  "cp-section": "bg-surface/80 shadow-md transition-shadow duration-250",
  "cp-icon-box": "bg-primary/10 shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--primary)_18%,transparent)]",
  "cp-chip": "bg-card/80 backdrop-blur-md shadow-md",
  "cp-breadcrumb": "bg-card/80 backdrop-blur-md shadow-sm",
  "cp-badge": "bg-primary/10",
  "cp-trust-bar": "bg-surface/50",
  "cp-skeleton-panel": "bg-card shadow-xl",

  // Inline styles that referenced CSS variables
  "var(--cp-divider)": "color-mix(in srgb, var(--border) 90%, transparent)",
  "var(--cp-bg-grid-opacity)": "0.03", // Approximate average of light (0.018) and dark (0.045)
};

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const files = walkSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Replace standard classes
    for (const [key, value] of Object.entries(replacements)) {
      if (key === "import './course-page.css'") {
        content = content.replace(/import '\.\/course-page\.css'[\r\n]*/g, '');
      } else {
        const regex = new RegExp(key, 'g');
        content = content.replace(regex, value);
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
});
