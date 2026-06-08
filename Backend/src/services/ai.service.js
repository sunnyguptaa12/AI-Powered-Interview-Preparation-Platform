const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

/**
 * Retry wrapper for Gemini API calls.
 * Handles 503 "model overloaded" errors with exponential backoff.
 */
async function callGeminiWithRetry(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt
            })
            return response
        } catch (err) {
            const isOverloaded =
                err?.status === 503 ||
                err?.message?.includes("UNAVAILABLE") ||
                err?.message?.includes("high demand")

            if (isOverloaded && i < retries - 1) {
                const waitMs = (i + 1) * 3000 // 3s, 6s, 9s
                console.log(`Gemini overloaded, retrying in ${waitMs / 1000}s... (attempt ${i + 1}/${retries})`)
                await new Promise(res => setTimeout(res, waitMs))
            } else {
                throw err
            }
        }
    }
}

/**
 * Safely extract JSON from Gemini response text.
 */
function extractJson(text) {
    let cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim()

    try {
        return JSON.parse(cleaned)
    } catch (_) {}

    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start !== -1 && end !== -1 && end > start) {
        try {
            return JSON.parse(cleaned.slice(start, end + 1))
        } catch (_) {}
    }

    throw new Error("Could not extract valid JSON from AI response")
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `
Return ONLY valid JSON. No markdown, no explanation, no extra text.

Format:
{
  "title": "Job Title",
  "matchScore": 80,
  "technicalQuestions": [
    { "question": "What is event loop?", "intention": "Check async knowledge", "answer": "Event loop handles async operations in JS" }
  ],
  "behavioralQuestions": [
    { "question": "Tell me about yourself", "intention": "Check communication skills", "answer": "I am a developer with X years experience" }
  ],
  "skillGaps": [
    { "skill": "Docker", "severity": "medium" }
  ],
  "preparationPlan": [
    { "day": 1, "focus": "Node.js Fundamentals", "tasks": ["Learn event loop", "Practice REST APIs"] }
  ]
}

Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}
`

    const response = await callGeminiWithRetry(prompt)
    const parsedResponse = extractJson(response.text)

    parsedResponse.matchScore =
        Number(String(parsedResponse.matchScore || "75").replace("%", "")) || 75
    parsedResponse.title = parsedResponse.title || "Software Developer"
    parsedResponse.technicalQuestions = parsedResponse.technicalQuestions || []
    parsedResponse.behavioralQuestions = parsedResponse.behavioralQuestions || []
    parsedResponse.skillGaps = parsedResponse.skillGaps || []
    parsedResponse.preparationPlan = parsedResponse.preparationPlan || []

    return parsedResponse
}

/**
 * Generate resume PDF using PDFKit — pure Node.js, no browser/Chromium needed.
 * Works on Render.com and all serverless environments.
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const prompt = `
Return ONLY valid JSON. No markdown, no extra text.

Extract and structure resume information:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91 XXXXXXXXXX",
  "location": "City, Country",
  "summary": "2-3 sentence professional summary tailored to the job",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2022 - Present",
      "points": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "University Name",
      "year": "2020"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "tech": ["React", "Node.js"]
    }
  ]
}

Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}
`

    const response = await callGeminiWithRetry(prompt)
    const data = extractJson(response.text)

    // Build PDF using PDFKit — no Chromium required
    const PDFDocument = require("pdfkit")
    const { Writable } = require("stream")

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: "A4" })
        const buffers = []

        const writable = new Writable({
            write(chunk, _, cb) {
                buffers.push(chunk)
                cb()
            }
        })

        writable.on("finish", () => resolve(Buffer.concat(buffers)))
        writable.on("error", reject)
        doc.pipe(writable)

        const colors = {
            primary: "#1a1f27",
            accent: "#4f46e5",
            muted: "#6b7280",
            line: "#e5e7eb"
        }

        // Header
        doc.fontSize(24).fillColor(colors.primary).font("Helvetica-Bold")
            .text(data.name || "Candidate Name", { align: "center" })

        const contactParts = [data.email, data.phone, data.location].filter(Boolean)
        doc.fontSize(10).fillColor(colors.muted).font("Helvetica")
            .text(contactParts.join("  |  "), { align: "center" })

        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(colors.accent).lineWidth(2).stroke()
        doc.moveDown(0.8)

        const sectionHeader = (title) => {
            doc.fontSize(13).fillColor(colors.accent).font("Helvetica-Bold").text(title.toUpperCase())
            doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor(colors.line).lineWidth(1).stroke()
            doc.moveDown(0.5)
        }

        // Summary
        if (data.summary) {
            sectionHeader("Professional Summary")
            doc.fontSize(10).fillColor(colors.primary).font("Helvetica")
                .text(data.summary, { lineGap: 3 })
            doc.moveDown(0.8)
        }

        // Skills
        if (data.skills?.length) {
            sectionHeader("Skills")
            doc.fontSize(10).fillColor(colors.primary).font("Helvetica")
                .text(data.skills.join("  •  "), { lineGap: 3 })
            doc.moveDown(0.8)
        }

        // Experience
        if (data.experience?.length) {
            sectionHeader("Experience")
            data.experience.forEach(exp => {
                doc.fontSize(11).fillColor(colors.primary).font("Helvetica-Bold")
                    .text(exp.title || "", { continued: true })
                doc.fontSize(10).fillColor(colors.muted).font("Helvetica")
                    .text(`  —  ${exp.company || ""}  (${exp.duration || ""})`)
                exp.points?.forEach(point => {
                    doc.fontSize(10).fillColor(colors.primary).font("Helvetica")
                        .text(`• ${point}`, { indent: 10, lineGap: 2 })
                })
                doc.moveDown(0.5)
            })
            doc.moveDown(0.3)
        }

        // Projects
        if (data.projects?.length) {
            sectionHeader("Projects")
            data.projects.forEach(proj => {
                doc.fontSize(11).fillColor(colors.primary).font("Helvetica-Bold")
                    .text(proj.name || "")
                if (proj.tech?.length) {
                    doc.fontSize(9).fillColor(colors.accent).font("Helvetica")
                        .text(proj.tech.join(", "))
                }
                doc.fontSize(10).fillColor(colors.primary).font("Helvetica")
                    .text(proj.description || "", { lineGap: 2 })
                doc.moveDown(0.5)
            })
            doc.moveDown(0.3)
        }

        // Education
        if (data.education?.length) {
            sectionHeader("Education")
            data.education.forEach(edu => {
                doc.fontSize(11).fillColor(colors.primary).font("Helvetica-Bold")
                    .text(edu.degree || "", { continued: true })
                doc.fontSize(10).fillColor(colors.muted).font("Helvetica")
                    .text(`  —  ${edu.institution || ""}  (${edu.year || ""})`)
                doc.moveDown(0.4)
            })
        }

        doc.end()
    })
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
}
