import axios from "axios";

const api = axios.create({
    baseURL: "https://ai-powered-interview-preparation-platform-so7d.onrender.com/api",
    withCredentials: true,
});

// Add token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Generate interview report
 */
export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
}) => {
    const formData = new FormData();

    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);

    if (resumeFile) {
        formData.append("resume", resumeFile);
    }

    const response = await api.post("/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};

/**
 * Get interview report by interviewId
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(
        `/interview/report/${interviewId}`
    );

    return response.data;
};

/**
 * Get all interview reports
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/interview/");

    return response.data;
};

/**
 * Generate resume PDF
 */
export const generateResumePdf = async ({
    interviewReportId,
}) => {
    const response = await api.post(
        `/interview/resume/pdf/${interviewReportId}`,
        null,
        {
            responseType: "blob",
        }
    );

    return response.data;
};

export default api;