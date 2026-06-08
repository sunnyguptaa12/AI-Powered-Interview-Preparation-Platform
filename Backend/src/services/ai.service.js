const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

/**
 * Safely extract JSON from Gemini response text.
 * Handles markdown fences and extra text around JSON.
 */
function extractJson(text) {
    // Remove markdown fences
    let cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim()

    // Try direct parse first
    try {
        return JSON.parse(cleaned)
    } catch (_) {}

    // Find the first { ... } block
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start !== -1 && end !== -1 && end > start) {
        try {
            return JSON.parse(cleaned.slice(start, end + 1))
        } catch (_) {}
    }

    throw new Error("Could not extract valid JSON from AI response")
}

async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
Return ONLY valid JSON. No markdown, no explanation, no extra text.

Format:
{
  "title": "Job Title",
  "matchScore": 80,
  "technicalQuestions": [
    {
      "question": "What is event loop?",
      "intention": "Check async knowledge",
      "answer": "Event loop handles async operations in JS"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Tell me about yourself",
      "intention": "Check communication skills",
      "answer": "I am a developer with X years experience"
    }
  ],
  "skillGaps": [
    {
      "skill": "Docker",
      "severity": "medium"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "Node.js Fundamentals",
      "tasks": [
        "Learn event loop",
        "Practice REST APIs"
      ]
    }
  ]
}

Resume:
${resume || "Not provided"}

Self Description:
${selfDescription || "Not provided"}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    })

    const parsedResponse = extractJson(response.text)

    // Sanitize matchScore
    parsedResponse.matchScore =
        Number(String(parsedResponse.matchScore || "75").replace("%", "")) || 75

    parsedResponse.title = parsedResponse.title || "Software Developer"

    // Ensure arrays exist
    parsedResponse.technicalQuestions = parsedResponse.technicalQuestions || []
    parsedResponse.behavioralQuestions = parsedResponse.behavioralQuestions || []
    parsedResponse.skillGaps = parsedResponse.skillGaps || []
    parsedResponse.preparationPlan = parsedResponse.preparationPlan || []

    return parsedResponse
}

/**
 * Generate resume HTML using Gemini, then convert to PDF using html-pdf-node.
 * Puppeteer is NOT used — it requires a Chrome binary which is unavailable on Render.com.
 */
async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
Generate a clean, ATS-friendly resume in HTML format.

Return ONLY valid JSON. No markdown, no extra text.

Format:
{
  "html": "<html><head><style>body{font-family:Arial,sans-serif;margin:40px;color:#222;} h1{font-size:24px;} h2{font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;} p,li{font-size:13px;line-height:1.6;}</style></head><body>...</body></html>"
}

Resume content:
${resume || "Not provided"}

Self Description:
${selfDescription || "Not provided"}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    })

    const jsonContent = extractJson(response.text)

    if (!jsonContent.html) {
        throw new Error("AI did not return HTML for resume")
    }

    // Use html-pdf-node (works on Render.com without Chrome binary)
    const htmlPdf = require("html-pdf-node")

    const file = { content: jsonContent.html }
    const options = {
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        printBackground: true
    }

    const pdfBuffer = await htmlPdf.generatePdf(file, options)

    return pdfBuffer
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
}
