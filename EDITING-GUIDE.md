# Airspace Website Editing Guide

## For Non-Technical Team Members Using Claude Projects

This guide shows you how to make changes to the new Airspace website (`new.airspace.com`) using Claude Projects and GitHub's web interface.

---

## Overview

**What you'll use:**
- **GitHub** (web interface) - to create branches, upload files, and create pull requests
- **Claude Projects** (claude.ai) - to make edits with AI assistance and preview changes
- **Your browser** - that's it!

**The workflow:**
1. Download current website files from GitHub
2. Upload files to a Claude Project
3. Make edits with Claude's help
4. Preview your changes in Claude
5. Download the edited files
6. Upload back to GitHub and create a pull request

---

## Step-by-Step Instructions

### Step 1: Create a New Branch on GitHub

1. Go to the repository: https://github.com/AirspaceTechnologies/airspace-website-redesign

2. Click the branch dropdown (says "main" by default)

3. Type a name for your branch in the text field:
   - Use descriptive names like: `update-hero-text` or `add-new-testimonial`
   - Use hyphens, not spaces
   - Keep it short and clear

4. Click "Create branch: your-branch-name from 'main'"

✅ **Done!** You now have your own workspace to make changes.

---

### Step 2: Download the Website Files

1. Make sure you're on your new branch (check the branch dropdown shows your branch name)

2. Click the green **"Code"** button

3. Click **"Download ZIP"**

4. Extract the ZIP file to a folder on your computer

✅ **Done!** You have a local copy of all the website files.

---

### Step 3: Create a Claude Project and Upload Files

1. Go to [Claude.ai](https://claude.ai)

2. Create a new Project:
   - Click "Projects" in the sidebar
   - Click "Create Project"
   - Name it something like "Airspace Website - [Your Name]" or "Airspace - [Feature Name]"

3. Add custom instructions (optional but helpful):
   ```
   This is the Airspace website redesign project. Help me edit the HTML, CSS,
   and JavaScript files for new.airspace.com. When I ask for changes, make them
   and show me what you modified.
   ```

4. Upload the key files to your project:
   - Drag and drop these files into the chat:
     - `index.html`
     - `airspace-homepage.css`
     - `nav.js`
     - Any other files you plan to edit

   Or tell Claude:
   ```
   I'm going to upload the website files. I'll be making changes to the homepage.
   ```
   Then attach the files.

✅ **Done!** Claude now has access to your website files.

---

### Step 4: Make Your Changes with Claude

Now you can ask Claude to make changes to the website. Here are some examples:

**Example requests:**

- *"Can you update the hero headline in index.html to say 'Lightning-fast shipping made simple'?"*

- *"Add a new testimonial to the testimonials section from John Smith, CEO of Acme Corp who said 'Airspace reduced our shipping time by 50%'"*

- *"Change all 'Request a Demo' button text to 'Get Started'"*

- *"Update the phone number in the footer to 555-0123"*

- *"Change the background color of the hero section to a darker blue"*

**Tips:**
- Be specific about what you want to change
- You can make multiple changes in the same conversation
- Ask Claude to show you what it changed
- Claude will provide the updated file content

✅ **Done!** Claude has made the edits to your files.

---

### Step 5: Preview Your Changes in Claude

Ask Claude to help you preview the changes:

**For quick visual checks:**
- *"Can you show me what the updated hero section will look like?"*
- Claude can display rendered HTML/CSS
- Good for checking layout and text changes

**For full testing:**
- *"Can you provide the complete updated HTML file so I can preview it locally?"*
- Claude will give you the full file content
- Copy the content and save it as an HTML file
- Open it in your browser to see exactly how it will look

**What to check:**
- Text reads correctly
- Images display properly
- Layout looks good on different screen sizes
- Links work
- Colors and styling match your expectations

✅ **Done!** You've verified your changes look good.

---

### Step 6: Download the Updated Files from Claude

1. Ask Claude:
   ```
   Can you provide the complete updated files that I need to upload to GitHub?
   ```

2. Claude will display the full content of each file you changed

3. For each file:
   - Copy the entire file content
   - Open a text editor (like Notepad on Windows, TextEdit on Mac, or VS Code)
   - Paste the content
   - Save with the exact same filename (e.g., `index.html`, `airspace-homepage.css`)

**Alternative: Use Claude's download feature**
- Some responses may have a download button
- Click to download the file directly

✅ **Done!** You have the updated files ready to upload.

---

### Step 7: Upload Changes to GitHub

1. Go to your repository: https://github.com/AirspaceTechnologies/airspace-website-redesign

2. Make sure you're on your branch (check the dropdown)

3. Navigate to the file you want to update:
   - Click on the filename (e.g., `index.html`)

4. Click the pencil icon (✏️) to edit, or if replacing:
   - Click the three dots menu (...)
   - Select "Delete file"
   - Commit the deletion
   - Then click "Add file" → "Upload files"

5. **For editing directly on GitHub:**
   - Click the pencil icon
   - Delete all content
   - Paste your new content from Claude
   - Scroll down to "Commit changes"
   - Add a commit message (e.g., "Update hero section headline")
   - Select "Commit directly to [your-branch-name]"
   - Click "Commit changes"

6. **For uploading files:**
   - Click "Add file" → "Upload files"
   - Drag and drop your updated files
   - Add a commit message describing your changes
   - Select "Commit directly to [your-branch-name]"
   - Click "Commit changes"

7. Repeat for each file you modified

✅ **Done!** Your changes are now on GitHub.

---

### Step 8: Create a Pull Request

A Pull Request (PR) is how you propose your changes to be published to the live site.

1. Go to the main repository page: https://github.com/AirspaceTechnologies/airspace-website-redesign

2. You'll see a yellow banner that says "Compare & pull request"
   - Click the green **"Compare & pull request"** button

   If you don't see the banner:
   - Click the "Pull requests" tab
   - Click "New pull request"
   - Select your branch from the "compare" dropdown

3. Fill out the Pull Request form:
   - **Title**: Brief description (e.g., "Update hero section copy")
   - **Description**: Explain what you changed and why
     ```
     ## Changes
     - Updated hero headline to be more direct
     - Changed CTA button text from "Request Demo" to "Get Started"

     ## Preview
     Please review the hero section on mobile and desktop.
     ```

4. Click **"Create pull request"**

🎉 **Automatic Preview URL**: Vercel will automatically create a preview deployment! Look for a comment from the Vercel bot (usually appears within 1-2 minutes) with a link like:
   ```
   ✅ Preview: https://airspace-website-redesign-abc123.vercel.app
   ```

   This is a fully working version of the site with your changes. Share this link with your team to review!

✅ **Done!** Your changes are ready for review.

---

### Step 9: Review and Merge

**Getting Review:**
- Tag team members in the PR comments (use @username)
- Share the Vercel preview URL with stakeholders
- If you need to make changes after feedback:
  - Go back to Step 3 (create a new Claude chat or continue in the same project)
  - Make the additional edits
  - Upload the files to GitHub again (Step 7)
  - The PR will automatically update

**Merging (Publishing to Live Site):**

Once approved:

1. Click the green **"Merge pull request"** button on GitHub

2. Click **"Confirm merge"**

3. Optionally delete the branch (GitHub will prompt you)

4. Vercel will automatically deploy your changes to `new.airspace.com` (takes ~30-60 seconds)

🚀 **Done!** Your changes are now live!

---

## Quick Reference

### Common Claude Requests

| What you want to do | What to say to Claude |
|---------------------|----------------------|
| Update text | "Change the headline in the hero section to '[new text]'" |
| Add content | "Add a new testimonial after the existing ones with this content: [paste content]" |
| Change styling | "Make the hero section background darker blue" |
| Update a button | "Change all 'Contact Us' buttons to say 'Get in Touch'" |
| See what changed | "Can you show me a summary of all the changes you made?" |
| Get updated files | "Please provide the complete updated HTML file" |
| Preview | "Show me what the hero section will look like with these changes" |

---

## Tips & Best Practices

### ✅ Do's
- **Create a new branch** for each set of related changes
- **Use descriptive branch names** like `update-pricing-page` not `changes`
- **Keep your Claude Project** - you can reuse it for future edits
- **Test the Vercel preview URL** before merging
- **Add images to Claude** by uploading them directly in the chat
- **Save your work** - keep the downloaded files organized in folders
- **Name commits meaningfully** (e.g., "Update hero headline" not "changes")

### ❌ Don'ts
- **Don't edit the `main` branch directly** - always create a branch first
- **Don't forget to switch to your branch** before uploading files
- **Don't mix unrelated changes** (e.g., updating both pricing and contact page - use separate branches)
- **Don't skip the preview** - always check the Vercel URL before merging
- **Don't lose track** of which files you changed - ask Claude for a summary

---

## File Reference

**Main files you might edit:**

- **`index.html`** - All the homepage content (text, structure, sections)
- **`airspace-homepage.css`** - Styling (colors, fonts, spacing, layout)
- **`nav.js`** - Navigation menu behavior
- **`illustrations-lab.js`** - Animated graphics and visual effects
- **`assets/`** folder - Images and logos

**What each file controls:**

| File | What it does |
|------|--------------|
| `index.html` | Page content: headlines, paragraphs, buttons, testimonials |
| `airspace-homepage.css` | Visual design: colors, fonts, spacing, animations |
| `nav.js` | Navigation menu: mobile menu, dropdowns |
| `hero-line-network-svg.js` | Hero section animated network graphic |
| `illustrations-lab.js` | Service section animations |
| `assets/logos/` | Customer logos in the trust section |
| `assets/airspace-logo.png` | Main Airspace logo in header |

---

## Troubleshooting

### "I can't find the Download ZIP option"
- Make sure you're on your branch (check the branch dropdown)
- The Code button should be green
- Click it and look for "Download ZIP" at the bottom

### "My changes aren't showing in the preview URL"
- Wait 1-2 minutes for Vercel to build the preview
- Make sure you uploaded files to your branch, not main
- Check that the PR shows your latest commits
- Try hard-refreshing the preview URL (Ctrl+Shift+R or Cmd+Shift+R)

### "Claude won't show me the full file"
- Say: "Please provide the complete contents of index.html from start to finish"
- If it's still truncated, ask: "Continue from where you left off"
- Or: "Show me the file in sections - first give me lines 1-200"

### "I uploaded the wrong file"
- You can edit or delete it on GitHub
- Or just upload the correct version again (same filename will replace it)

### "The PR says there are conflicts"
- This means someone else changed the same parts
- Ask a technical team member for help merging
- Or close the PR, download fresh files from main, and start over

### "I want to make more changes after creating the PR"
- Go back to your Claude Project
- Make additional edits
- Download and upload the files again to the same branch
- The PR will automatically update

---

## Example Full Workflow

Here's a real example from start to finish:

**Goal**: Update the hero section headline and button text

1. **GitHub**: Create branch `update-hero-cta`

2. **GitHub**: Download ZIP of the branch

3. **Claude Project**:
   - Create project "Airspace Hero Update"
   - Upload `index.html`
   - "Change the hero headline to 'Time-critical shipping that never lets you down'"
   - "Change the 'Request a Demo' button to say 'Get Started Today'"
   - "Show me a preview of these changes"
   - *(looks good!)*
   - "Please provide the complete updated index.html file"
   - Copy the file content

4. **Save locally**: Paste content into `index.html`, save file

5. **GitHub**:
   - Navigate to `index.html` on the `update-hero-cta` branch
   - Click edit (pencil icon)
   - Replace all content
   - Commit with message: "Update hero headline and CTA button text"

6. **GitHub**:
   - Create Pull Request
   - Add description: "Updated hero section for clarity and stronger CTA"
   - Wait for Vercel preview URL
   - Share preview with marketing team

7. **After approval**:
   - Merge Pull Request
   - Changes go live at new.airspace.com in ~1 minute

**Total time**: 10-15 minutes ⚡

---

## Getting Help

- **For Claude questions**: Try rephrasing your request or starting a new chat in your project
- **For GitHub questions**: Ask a technical team member or check GitHub's help docs
- **For urgent website issues**: Contact [your technical lead]
- **Preview not working**: Check the #dev Slack channel or contact DevOps

---

## Repository Information

- **Live Site**: https://new.airspace.com
- **Repository**: https://github.com/AirspaceTechnologies/airspace-website-redesign
- **Vercel Dashboard**: [To be added - where you can see deployment history]

---

**Happy editing! 🚀**

---

**Last Updated**: February 2026
