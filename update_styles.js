const fs = require('fs');
const path = require('path');

// Update globals.css
const globalsPath = path.join(__dirname, 'app/globals.css');
let cssContent = fs.readFileSync(globalsPath, 'utf8');

cssContent = cssContent.replace(
  /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Inter:wght@300;400;500;600;700&display=swap'\);/,
  "@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');"
);

// Replace variables
cssContent = cssContent.replace(/:root\s*{[^}]+}/, `:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --bg-panel: #ffffff;
  --bg-hover: #e5e7eb;
  --text-primary: #000000;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
  --border: #d1d5db;
  --accent: #000000;
  --accent-light: #e5e7eb;
  --bubble-self: #000000;
  --bubble-self-text: #ffffff;
  --bubble-other: #f3f4f6;
  --bubble-other-text: #000000;
}`);

cssContent = cssContent.replace(/\.dark\s*{[^}]+}/, `.dark {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-panel: #171717;
  --bg-hover: #262626;
  --text-primary: #ffffff;
  --text-secondary: #a3a3a3;
  --text-muted: #737373;
  --border: #404040;
  --accent: #ffffff;
  --accent-light: #262626;
  --bubble-self: #ffffff;
  --bubble-self-text: #000000;
  --bubble-other: #262626;
  --bubble-other-text: #ffffff;
}`);

cssContent = cssContent.replace(/font-family:\s*['"]Inter['"],\s*sans-serif;/g, "font-family: 'Nunito', sans-serif;");

fs.writeFileSync(globalsPath, cssContent);

// Replace gradients in .tsx files
function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace gradients with var(--accent)
      content = content.replace(/"linear-gradient\(135deg,\s*#6366f1,\s*#8b5cf6\)"/g, '"var(--accent)"');
      
      // We want to ensure text color inside elements using var(--accent) is var(--bg-primary) so it inverts correctly
      // But since replacing blindly might break things, we know exactly where these are used:
      // Avatar placeholders & Buttons.
      // E.g 'color: "white"' often used together. We will replace color: "white" with color: "var(--bg-primary)"
      // but only in lines close to var(--accent).
      
      if (content.includes('var(--accent)')) {
          content = content.replace(/color:\s*"white"/g, 'color: "var(--bg-primary)"');
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'app'));
replaceInDir(path.join(__dirname, 'components'));

console.log("Styles updated.");
