const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

// Helper function to clean JSON response - IMPROVED VERSION
function cleanJsonResponse(text) {
    // Remove markdown code blocks - handles ``` json, ```json, etc.
    let cleaned = text.replace(/^```[\s\S]*?\n/i, '').replace(/\n```[\s\S]*?$/i, '')
    return cleaned.trim()
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert interview coach analyzing a candidate for a job position.

CANDIDATE RESUME:
${resume}

CANDIDATE SELF DESCRIPTION:
${selfDescription}

TARGET JOB DESCRIPTION:
${jobDescription}

Generate a comprehensive JSON interview preparation report with the following structure:

{
  "matchScore": 85,
  "title": "Senior React Developer",
  "technicalQuestions": [
    {
      "question": "What is the difference between useState and useReducer?",
      "intention": "Assess understanding of state management patterns in React",
      "answer": "useState is for simple state values with a single update function. useReducer is better for complex state logic with multiple related state updates. useReducer takes a reducer function and initial state, similar to Redux pattern."
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Tell me about a time you had to learn a new technology quickly",
      "intention": "Assess adaptability and learning capability",
      "answer": "Use STAR method - Situation, Task, Action, Result. Focus on how you approach learning, resources used, and outcome achieved."
    }
  ],
  "skillGaps": [
    {
      "skill": "TypeScript",
      "severity": "medium"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "React Fundamentals and Hooks",
      "tasks": ["Review React documentation", "Practice useState and useEffect", "Build a simple component"]
    }
  ]
}

INSTRUCTIONS:
1. matchScore: Analyze how well candidate matches the job. Return a number 0-100.
2. title: Extract the job title from the job description.
3. technicalQuestions: Generate 5-7 relevant technical questions based on job requirements and candidate experience. Each must have question, intention, and answer fields.
4. behavioralQuestions: Generate 5-7 relevant behavioral questions. Each must have question, intention, and answer fields.
5. skillGaps: Identify 3-5 skills the candidate needs to develop. Each with skill name and severity (low/medium/high).
6. preparationPlan: Create a 7-day preparation plan. Each day must have day number, focus area, and array of 3-4 tasks.
7. Return ONLY valid JSON. No markdown, no code blocks, no extra text.
8. All array items MUST be complete objects with all required fields.`

    try {
        console.log('🚀 Starting interview report generation...')
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        })

        console.log('📥 Raw Gemini response received')

        if (!response || !response.text) {
            throw new Error('No text content in Gemini response')
        }

        console.log('📊 Parsing JSON response...')
        let parsed
        try {
            // Clean the response by removing markdown code blocks
            const cleanedText = cleanJsonResponse(response.text)
            parsed = JSON.parse(cleanedText)
        } catch (parseErr) {
            console.error('Failed to parse JSON:', parseErr.message)
            console.error('Response text (first 500 chars):', response.text.substring(0, 500))
            throw new Error('Failed to parse JSON from Gemini response')
        }
        
        console.log('Response structure:', {
            technicalQuestions: parsed.technicalQuestions?.length || 0,
            behavioralQuestions: parsed.behavioralQuestions?.length || 0,
            skillGaps: parsed.skillGaps?.length || 0,
            preparationPlan: parsed.preparationPlan?.length || 0,
            title: parsed.title || 'MISSING',
            matchScore: parsed.matchScore || 0
        })

        // Validate with Zod
        console.log('✔️ Validating against schema...')
        const validated = interviewReportSchema.safeParse(parsed)
        
        if (!validated.success) {
            console.error('❌ Schema validation failed:')
            console.error(JSON.stringify(validated.error.issues.slice(0, 5), null, 2))
            throw new Error(`Schema validation failed: ${validated.error.issues[0]?.message}`)
        }

        console.log('✅ Report generated and validated successfully!')
        return validated.data

    } catch (err) {
        console.error('❌ Error in generateInterviewReport:', err.message)
        throw err
    }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

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

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const prompt = `You are a professional resume writer. Generate a tailored resume HTML for a candidate.

CANDIDATE PROFILE:
Resume: ${resume}
Self Description: ${selfDescription}

TARGET JOB:
${jobDescription}

Create professional, clean HTML resume that:
1. Tailors content for the specific job description
2. Highlights relevant experience and skills
3. Uses professional formatting (CSS included)
4. Fits 1-2 pages when converted to PDF
5. Maintains ATS compatibility
6. Looks natural and not AI-generated
7. Includes proper sections (summary, experience, skills, education)

Return ONLY a JSON object:
{
  "html": "<html>... complete HTML here ...</html>"
}`

    try {
        console.log('📄 Generating resume PDF...')
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt
        })

        let jsonContent
        try {
            // Clean the response by removing markdown code blocks
            const cleanedText = cleanJsonResponse(response.text)
            jsonContent = JSON.parse(cleanedText)
        } catch (parseErr) {
            console.error('Failed to parse resume JSON:', parseErr.message)
            console.error('Response text (first 500 chars):', response.text.substring(0, 500))
            throw new Error('Failed to parse JSON from Gemini response')
        }

        console.log('✓ Resume HTML generated, converting to PDF...')

        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
        console.log('✓ Resume PDF created successfully')

        return pdfBuffer

    } catch (err) {
        console.error('❌ Error in generateResumePdf:', err.message)
        throw err
    }
}

module.exports = { generateInterviewReport, generateResumePdf }