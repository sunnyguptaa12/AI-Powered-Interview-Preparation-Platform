const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
Return ONLY valid JSON.

STRICT RULES:
- technicalQuestions MUST be array of objects
- behavioralQuestions MUST be array of objects
- skillGaps MUST be array of objects
- preparationPlan MUST be array of objects
- matchScore MUST be number only

Example format:

{
  "title": "Backend Developer",
  "matchScore": 80,

  "technicalQuestions": [
    {
      "question": "What is event loop?",
      "intention": "Check async knowledge",
      "answer": "Event loop handles async operations"
    }
  ],

  "behavioralQuestions": [
    {
      "question": "Tell me about yourself",
      "intention": "Check communication",
      "answer": "I am a MERN developer"
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
      "focus": "Node.js",
      "tasks": [
        "Learn event loop",
        "Practice APIs"
      ]
    }
  ]
}

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    })

    const text = response.text

    const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()

    const parsedResponse = JSON.parse(cleanedText)

    parsedResponse.matchScore =
        Number(String(parsedResponse.matchScore).replace("%", "")) || 75

    parsedResponse.title =
        parsedResponse.title || "Software Developer"

    return parsedResponse
}

async function generatePdfFromHtml(htmlContent) {

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    const page = await browser.newPage()

    await page.setContent(htmlContent, {
        waitUntil: "networkidle0"
    })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
Generate ATS friendly resume HTML.

Return ONLY valid JSON.

{
  "html": "<html>...</html>"
}

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    })

    const cleanedResumeText = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()

    const jsonContent = JSON.parse(cleanedResumeText)

    const pdfBuffer = await generatePdfFromHtml(
        jsonContent.html
    )

    return pdfBuffer
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
}