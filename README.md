# Darren Local Studio Site

A minimal static personal site with a local-only writing studio.

The public site stays static and deployable to Vercel. The studio runs locally, writes content files into `/content`, then regenerates `/assets/generated-content.js`.

## Commands

```bash
npm run studio
```

Runs the local site and the local writing studio.

- Public site: http://localhost:5173
- Studio: http://localhost:5173/studio

```bash
npm run build
```

Reads every JSON file in `/content` and regenerates:

```txt
assets/generated-content.js
```

## Workflow

```txt
npm run studio
→ open /studio
→ create/edit/preview post
→ save + rebuild
→ git add .
→ git commit -m "add post"
→ git push
→ Vercel deploys
```

No database. No CMS login. No GitHub API. Just local files.

## Content folders

```txt
content/
  posts/
  projects/
  retrospectives/
  features/
  thoughts/
  work/
```

Each item is a JSON file:

```json
{
  "title": "Reading my old Robux Rain code",
  "slug": "robux-rain",
  "collection": "retrospectives",
  "type": "retrospective",
  "date": "2026-05-27",
  "status": "draft",
  "summary": "A look back at an old project.",
  "tags": ["retro", "old-project"],
  "icon": "/images/post-icons/robux-rain.svg",
  "featured": true,
  "sections": [
    {
      "type": "text",
      "heading": "What it was",
      "body": "..."
    }
  ]
}
```

## Replacing the profile image

Replace this file:

```txt
images/profile-placeholder.svg
```

Or add your own image:

```txt
images/profile.jpg
```

Then edit `assets/app.js`:

```js
profileImage: "/images/profile.jpg"
```

## Images in posts

Put images here:

```txt
images/posts/
```

Then use an image section in the studio with a path like:

```txt
/images/posts/robux-rain-screenshot.png
```

## Vercel

This repo includes `vercel.json`.

Use:

```txt
Build Command: npm run build
Output Directory: .
```

The local studio is for your computer only. On Vercel, the public site is static.
