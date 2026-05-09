import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

/**
 * Generate Interview Report
 */
export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile
}) => {

    const formData = new FormData();

    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);

    if (resumeFile) {
        formData.append("resume", resumeFile);
    }

    const response = await api.post(
        "/api/interview",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data;
};

/**
 * Get Interview Report By ID
 */
export const getInterviewReportById = async (interviewId) => {

    const response = await api.get(
        `/api/interview/report/${interviewId}`
    );

    return response.data;
};

/**
 * Get All Interview Reports
 */
export const getAllInterviewReports = async () => {

    const response = await api.get("/api/interview");

    return response.data;
};

/**
 * Generate Resume PDF
 */
export const generateResumePdf = async ({ interviewReportId }) => {

    const response = await api.post(
        `/api/interview/resume/pdf/${interviewReportId}`,
        {},
        {
            responseType: "blob",
        }
    );

    return response.data;
};

export default api;