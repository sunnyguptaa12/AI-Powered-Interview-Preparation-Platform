import axios from "axios";

const api = axios.create({
    baseURL: "https://ai-powered-interview-preparation-platform-so7d.onrender.com/api",
    withCredentials: true,
});

console.log("INTERVIEW API FILE EXECUTED");

/**
 * Generate interview report
 */
export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
}) => {

    const token = localStorage.getItem("token");

    console.log("TOKEN =", token);

    const formData = new FormData();

    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);

    if (resumeFile) {
        formData.append("resume", resumeFile);
    }

    const response = await api.post(
        "/interview/",
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

/**
 * Get interview report by interviewId
 */
export const getInterviewReportById = async (interviewId) => {

    const token = localStorage.getItem("token");

    const response = await api.get(
        `/interview/report/${interviewId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

/**
 * Get all interview reports
 */
export const getAllInterviewReports = async () => {

    const token = localStorage.getItem("token");

    const response = await api.get(
        "/interview/",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

/**
 * Generate resume PDF
 */
export const generateResumePdf = async ({
    interviewReportId,
}) => {

    const token = localStorage.getItem("token");

    const response = await api.post(
        `/interview/resume/pdf/${interviewReportId}`,
        null,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: "blob",
        }
    );

    return response.data;
};

export default api;