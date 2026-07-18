# Cassandra 90-second demo

Use the controlled pages in `fixtures/urban-trees/` and keep the GPT-5.6 model label plus manual Send action visible.

## Script

- **0–12s:** “Most AI tools start with an empty prompt. Cassandra starts with looking.” Create: **How do urban trees affect summer temperatures?**
- **12–42s:** Visit all three fixture pages. Capture one short item from each and add a distinct relevance note.
- **42–58s:** Open the evidence trail. Show `[S1]`–`[S3]`, source links, learner notes, and a metadata/diversity warning.
- **58–72s:** Preview the readable Markdown packet and click **Fill ChatGPT composer**.
- **72–84s:** Review the filled prompt, then click Send manually. Show that the answer uses source IDs and distinguishes evidence from inference.
- **84–90s:** “Cassandra doesn't browse or think for you. It helps you bring better evidence to AI. Don't just be right. Bring the evidence.”

## Automated boundary

Chromium automates question creation, the three captures, required reflections, trail verification, and packet preview. Sending remains deliberately manual, and response extraction is never part of the test.
