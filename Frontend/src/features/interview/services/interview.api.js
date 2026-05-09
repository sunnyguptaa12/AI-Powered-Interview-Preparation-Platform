import axios from "axios"

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000"

console.log("🔧 API Base URL:", API_BASE_URL)

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
})


// Generate Interview Report
export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile
}) => {

    const formData = new FormData()

    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)

    const response = await api.post(
        "/api/interview/",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    )

    return response.data
}


// Get All Interview Reports
export const getAllInterviewReports = async () => {

    const response = await api.get("/api/interview/")

    return response.data
}


// Get Single Interview Report
export const getInterviewReportById = async (interviewId) => {

    const response = await api.get(
        `/api/interview/report/${interviewId}`
    )

    return response.data
}


// Generate Resume PDF
export const generateResumePdf = async ({
    interviewReportId
}) => {

    const response = await api.post(
        `/api/interview/resume/pdf/${interviewReportId}`,
        null,
        {
            responseType: "blob"
        }
    )

    return response.data
}

export default api