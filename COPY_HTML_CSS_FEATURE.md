# Copy HTML + CSS Feature

## What It Does

When enabled, the "Copy HTML along with CSS" option combines both the HTML structure and CSS styles into a single, ready-to-use snippet.

## How to Use

### Step 1: Enable the Feature

1. **Activate CSS Scanner** (click icon or press `Ctrl+Shift+S`)
2. **Open Settings** - Click the ⚙️ settings button in the inspector
3. **Find "HTML Code" section**
4. **Check** ✅ "Copy HTML along with CSS"
5. **Click "Save"**

### Step 2: Copy Code

1. **Hover over an element** you want to copy
2. **Click "Copy Code"** button in the CSS tab
3. **Paste** - You'll get both HTML and CSS together!

## Output Format

### Without "Copy HTML along with CSS" (Default)
Clicking "Copy Code" gives you just CSS:

```css
div.nested-structure {
  background: rgb(224, 231, 255);
  padding: 20px;
  border-radius: 8px;
  border: 2px solid rgb(129, 140, 248);
}
```

### With "Copy HTML along with CSS" ✅ ENABLED
Clicking "Copy Code" gives you HTML + CSS combined:

```html
<div class="nested-structure">
  <h3>
    Nested Structure (Hover This!)
  </h3>
  <div class="level-1">
    Level 1 - Purple background
    <div class="level-2">
      Level 2 - Lighter purple
      <div class="level-3">
        Level 3 - Dark purple with white text
      </div>
    </div>
  </div>
  <div class="level-1">
    Another Level 1 element
  </div>
</div>

<style>
div.nested-structure {
  background: rgb(224, 231, 255);
  padding: 20px;
  border-radius: 8px;
  border: 2px solid rgb(129, 140, 248);
}
</style>
```

**Ready to paste into your HTML file!** 🎉

## Works With "Include Children"

### Example 1: Single Element (Children Unchecked)

**HTML:**
```html
<div class="card">
  <h2>...</h2>
  <p>...</p>
</div>
```

**CSS:**
```css
div.card {
  background: linear-gradient(...);
  padding: 24px;
  border-radius: 8px;
}
```

### Example 2: Full Component (Children Checked)

**HTML:**
```html
<div class="card">
  <h2>Card Title</h2>
  <p>Card description</p>
  <a href="#" class="button">Click Me</a>
</div>
```

**CSS:**
```css
div.card {
  background: linear-gradient(...);
  padding: 24px;
  border-radius: 8px;
}

.card h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
}

.card p {
  margin: 0 0 16px 0;
  opacity: 0.9;
}

.card .button {
  display: inline-block;
  background: white;
  padding: 10px 20px;
}
```

## Use Cases

### 1. Quick Component Prototyping
Copy an entire component from a website and paste it into your project to test or modify.

### 2. Learning from Examples
See exactly how a component is built - both structure and styles together.

### 3. Building Style Libraries
Extract complete UI components to create your own library.

### 4. Code Sharing
Share complete, working code snippets with teammates.

### 5. Documentation
Create documentation with live examples that include both HTML and CSS.

## How It Works

1. **Extract HTML** using `extractHTML(element, includeChildren)`
2. **Extract CSS** using optimized CSS (shorthand properties, deduplicated)
3. **Combine** in format: `HTML + <style>CSS</style>`
4. **Copy to clipboard**
5. **Show notification**: "HTML + CSS copied!"

## Settings Interaction

This feature respects other settings:

| Setting | Effect on Output |
|---------|------------------|
| **Include children CSS** | ✅ Includes all child elements in both HTML and CSS |
| **Ignore vendor prefixes** | ✅ Removes `-webkit-`, `-moz-` from CSS |
| **CSS selector mode** | ✅ Uses smart/original/truncated selectors |
| **Include children HTML** | ✅ Controls HTML child inclusion |

## Testing

### Test 1: Single Element
1. Hover over a simple `<button>` or `<div>`
2. **Uncheck** "Include child elements CSS"
3. **Check** "Copy HTML along with CSS"
4. Click "Copy Code"
5. Paste - should get button HTML + its CSS

### Test 2: Full Component
1. Hover over "Nested Structure" on test-children.html
2. **Check** "Include child elements CSS"
3. **Check** "Copy HTML along with CSS"
4. Click "Copy Code"
5. Paste - should get entire component with all nested CSS

### Test 3: Verify It Works
1. Create a new HTML file
2. Copy a component with HTML + CSS
3. Paste into the file between `<body></body>`
4. Open in browser - should look identical!

## Example: Copy Button from Website

**Original on website:**
```html
<button class="btn-primary">Sign Up</button>
```

**What you copy (HTML + CSS enabled):**
```html
<button class="btn-primary">
  Sign Up
</button>

<style>
.btn-primary {
  background: rgb(37, 99, 235);
  color: rgb(255, 255, 255);
  padding: 12px 24px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
</style>
```

**Paste and it works immediately!** ✨

## Tips

1. **Enable for component copying** - Great when you want complete, working code
2. **Disable for CSS-only work** - When you just need the styles
3. **Combine with "Include children"** - Get entire component trees
4. **Use with CodePen export** - For even more complete examples

## Technical Details

### Implementation
- File: `js/scanner-full.js`
- Function: `copyCSSCode()` (lines 1249-1274)
- Checks: `state.settings.copyHTMLWithCSS`
- Format: `${HTML}\n\n<style>\n${CSS}\n</style>`

### HTML Extraction
- Uses `extractHTML()` function
- Respects `includeChildren` setting
- Formatted with proper indentation
- Clean, readable output

### CSS Extraction
- Uses optimized CSS (shorthand properties)
- Deduplicated when children included
- Production-ready formatting

---

**Result:** One-click copy of complete, working HTML + CSS components! 🚀
