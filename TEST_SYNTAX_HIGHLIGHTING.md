# Testing Syntax Highlighting - CSS Scanner Pro

## Quick Test Guide

Follow these steps to test the new syntax highlighting feature.

## Step 1: Reload the Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Find **"CSS Scanner Pro"**
4. Click the **Reload** button (↻)

## Step 2: Open Test Page

You can test on any webpage, but the included test page has good examples:

```bash
# Navigate to the extension directory
cd /Users/simon/Downloads/Chrome/copy-html-css-extension

# Open the test page in Chrome
open test-children.html
```

Or just drag [test-children.html](test-children.html) into your Chrome browser.

## Step 3: Activate CSS Scanner

**Keyboard shortcut:**
- Windows/Linux: `Ctrl + Shift + S`
- Mac: `Cmd + Shift + S`

**Or click the extension icon** in the toolbar.

## Step 4: Test Each Tab

### Test 1: CSS Tab (Read-Only Highlighting)

1. **Hover over "Card with Children"** (purple card at top)
2. The inspector appears on the right
3. You should be on the **CSS tab** by default

**Expected Results:**
```
✅ Selector ".card" is in YELLOW/AMBER
✅ Property names (background, padding, etc.) are in BLUE
✅ Property values are in GREEN
✅ Color values like rgb() are in PURPLE
✅ Numbers with units (24px, 8px) are in ORANGE
✅ Braces { } are in RED
```

4. **Check the "Include child elements CSS" checkbox**

**Expected Results:**
```
✅ Multiple selectors appear (.card, .card h2, .card p, .card .button)
✅ All selectors are YELLOW
✅ All property names are BLUE
✅ All values are colored appropriately
✅ Code is easy to scan and read
```

### Test 2: HTML Tab (Markup Highlighting)

1. Click the **"HTML"** tab
2. Make sure "Include children" is checked

**Expected Results:**
```
✅ Tag names (<div>, <h2>, <p>, <button>) are in YELLOW
✅ Attribute names (class, id) are in BLUE
✅ Attribute values ("card", "button") are in GREEN
✅ Closing slashes </div> have red / marks
✅ Angle brackets are colored
```

3. **Uncheck "Include children"**

**Expected Results:**
```
✅ Shows only the parent <div> tag
✅ Still has syntax highlighting
✅ Colors match the pattern above
```

### Test 3: Editor Tab (Live Real-Time Highlighting)

This is the most exciting test - **live syntax highlighting as you type**!

1. Click the **"Editor"** tab
2. You should see the CSS with syntax highlighting

**Initial State Expected Results:**
```
✅ CSS code is fully syntax-highlighted
✅ Same colors as CSS tab
✅ Cursor is visible in the textarea
```

3. **Click anywhere in the editor**
4. **Start typing a new CSS rule at the end:**

Type this slowly, character by character:
```css
.test {
  color: red;
  font-size: 20px;
}
```

**Expected Results While Typing:**

When you type `.test`:
```
✅ ".test" appears in YELLOW (selector color)
```

When you type `{`:
```
✅ Opening brace appears in RED
```

When you type `color`:
```
✅ "color" appears in BLUE (property name)
```

When you type `:`:
```
✅ Colon appears in default color
```

When you type `red`:
```
✅ "red" appears in GREEN (value color)
```

When you type `;`:
```
✅ Semicolon appears in default color
```

When you type `font-size`:
```
✅ "font-size" appears in BLUE
```

When you type `20px`:
```
✅ "20px" appears in ORANGE (number with unit)
```

When you type `}`:
```
✅ Closing brace appears in RED
```

**Overall Results:**
```
✅ Highlighting updates instantly as you type
✅ No lag or delay
✅ Cursor remains visible and functional
✅ All colors match the CSS tab
✅ Professional IDE-like experience
```

5. **Test Scrolling:**

   Add more CSS rules until the editor scrolls, then:
   - **Scroll down** in the editor

   **Expected Results:**
   ```
   ✅ Highlighting scrolls perfectly with text
   �   No separation between text and colors
   ✅ Smooth scrolling
   ```

6. **Test Reset Button:**

   - Modify the CSS
   - Click **"Reset"** button

   **Expected Results:**
   ```
   ✅ CSS reverts to original
   ✅ Syntax highlighting is still present
   ✅ All colors are correct
   ```

## Step 5: Test on Different Elements

Try hovering over different test elements:

### "Nested Structure" (blue boxes)
1. Hover over the outer container
2. Check "Include children CSS"

**Expected Results:**
```
✅ Shows CSS for .nested-structure, .level-1, .level-2, .level-3
✅ All selectors are yellow
✅ All properties are blue
✅ All values are colored appropriately
✅ Multiple rgb() color values are purple
```

### "List Container" (yellow box)
1. Hover over the list container
2. Check "Include children CSS"

**Expected Results:**
```
✅ Shows CSS for .list-container, ul, li
✅ Syntax highlighting on all rules
✅ Easy to see the structure
```

### "Flex Container" (three blue boxes)
1. Hover over the flex container
2. Check "Include children CSS"

**Expected Results:**
```
✅ Shows CSS for .flex-container and .flex-item
✅ All syntax highlighted
✅ flex properties are blue
✅ Values are green/orange
```

## Step 6: Test on Real Websites

Now test on actual websites:

1. **Go to any website** (e.g., github.com, X.com, reddit.com)
2. **Activate CSS Scanner** (`Ctrl+Shift+S` / `Cmd+Shift+S`)
3. **Hover over elements** (buttons, cards, headers, etc.)

**Expected Results:**
```
✅ CSS tab shows syntax-highlighted CSS
✅ HTML tab shows syntax-highlighted HTML
✅ Editor tab has live highlighting
✅ All colors are correct
✅ Easy to read even complex CSS
```

## Common Test Cases

### Test Case 1: Complex Gradient
Hover over an element with a gradient background.

**Expected Results:**
```
✅ background property is blue
✅ linear-gradient(...) value is green
✅ Color values inside gradient are purple
✅ Percentage values are orange
```

### Test Case 2: Multiple Classes
Hover over an element with multiple selectors like `.btn.btn-primary`.

**Expected Results:**
```
✅ Entire selector is yellow
✅ Easy to distinguish from properties
```

### Test Case 3: !important
Find or add CSS with `!important`.

**Expected Results:**
```
✅ !important is bright RED
✅ Stands out clearly
✅ Different from brace red
```

### Test Case 4: Long CSS Files
Hover over complex elements with 20+ CSS properties.

**Expected Results:**
```
✅ All properties are highlighted
✅ No performance lag
✅ Scrolling is smooth
✅ Colors make it easy to scan
```

## Troubleshooting

### Colors Not Showing?

**Problem:** CSS/HTML shows plain white text.

**Solutions:**
1. Reload the extension at `chrome://extensions/`
2. Hard refresh the webpage (`Ctrl+Shift+R` / `Cmd+Shift+R`)
3. Check browser console for errors (F12)
4. Make sure you're using the production version, not diagnostic

### Editor Not Highlighting?

**Problem:** Editor tab shows plain text.

**Solutions:**
1. Check if `.editor-highlight` element exists (inspect with F12)
2. Reload the extension
3. Try typing - should trigger highlighting
4. Check if JavaScript errors in console

### Highlighting Out of Sync?

**Problem:** Colors don't match the text while typing.

**Solutions:**
1. Refresh the page
2. Close and reopen the inspector
3. Check if scroll is synced (scroll should move both layers)

### Performance Slow?

**Problem:** Lag when typing in editor.

**Solutions:**
1. This is very rare, but if CSS is extremely large (5000+ lines):
   - Try "Include children" OFF for smaller output
   - Use simpler selectors
2. Check system resources (CPU/memory)

## Success Criteria

You'll know syntax highlighting is working perfectly when:

✅ **CSS Tab:**
- Selectors are yellow
- Properties are blue
- Values are green/orange/purple
- Braces are red

✅ **HTML Tab:**
- Tag names are yellow
- Attributes are blue
- Attribute values are green
- Closing tags have red /

✅ **Editor Tab:**
- Initial CSS is highlighted
- Typing updates colors instantly
- No lag or flicker
- Scrolling is smooth
- Reset button maintains highlighting

✅ **Overall:**
- Professional appearance
- Easy to read
- Faster to comprehend
- No performance issues

## Performance Benchmarks

Expected performance (on typical systems):

- **Highlighting time:** <1ms for typical CSS (50-100 lines)
- **Typing latency:** <5ms update time
- **Scroll sync:** 60fps smooth
- **Memory:** Negligible impact (<1MB)

## Comparison Test

To really appreciate the improvement:

1. **Disable highlighting:**
   - Comment out the highlighting functions temporarily
   OR
   - Use browser DevTools (which may not have editor highlighting)

2. **Enable highlighting:**
   - Use CSS Scanner Pro

3. **Compare:**
   - Notice how much faster you can scan the code
   - Notice how structure is clearer
   - Notice how errors are more obvious

---

## Final Checklist

Before considering the test complete, verify:

- [ ] CSS tab has syntax highlighting
- [ ] HTML tab has syntax highlighting
- [ ] Editor tab has syntax highlighting
- [ ] Editor highlighting updates while typing
- [ ] Editor scrolling is synced
- [ ] Reset button maintains highlighting
- [ ] All colors match the documented scheme
- [ ] No performance issues
- [ ] Works on test-children.html
- [ ] Works on real websites
- [ ] Professional appearance

---

## What's Next?

After confirming syntax highlighting works:

1. ✅ **Use it regularly** - It will become second nature
2. ✅ **Try different websites** - See how it handles various CSS
3. ✅ **Edit CSS live** - Use the Editor tab with Apply Changes
4. ✅ **Share feedback** - Report any issues on GitHub
5. ✅ **Enjoy!** - Professional CSS inspection is now even better!

---

**Created by Simon Adjatan**

🌐 [adjatan.org](https://adjatan.org/) | 💻 [GitHub](https://github.com/Thecoolsim) | 🐦 [X](https://x.com/adjatan) | 📘 [Facebook](https://www.facebook.com/adjatan)
