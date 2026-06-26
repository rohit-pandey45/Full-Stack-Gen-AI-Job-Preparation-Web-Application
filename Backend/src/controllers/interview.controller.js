const { extractText } = require("unpdf");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service.js");
const interviewReportModel = require("../models/interviewReport.model.js");

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */

async function generateInterViewReportController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "Resume PDF is required. Please upload a file with field name 'resume'.",
      });
    }

    //unpdf usage
    const { text: resumeText } = await extractText(
      new Uint8Array(req.file.buffer),
      { mergePages: true },
    );

    const { selfDescription, jobDescription, title } = req.body;

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });
    console.log("RAW AI RESPONSE:");
    console.log(interViewReportByAi);

    // 1. Ensuring we are dealing with an object (in case the AI returned a raw JSON string)
    let reportData = {};
    try {
      reportData =
        typeof interViewReportByAi === "string"
          ? JSON.parse(interViewReportByAi)
          : interViewReportByAi;
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
    }
    console.log("PARSED REPORT DATA:");
console.log(JSON.stringify(reportData, null, 2));

    // 2. Extract any possible variation of the title key
    const extractedTitle =
      reportData?.title || reportData?.jobTitle || reportData?.job_role;

    // 3. Creating a final fallback so Mongoose NEVER throws a ValidationError
    const finalTitle =
      extractedTitle || `Interview Report - ${new Date().toLocaleDateString()}`;

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      title: finalTitle, // 👈 Guaranteed to have a string value now
      ...reportData,
    });

    res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (err) {

    console.error(err);

    if (err?.status === 429) {
        return res.status(429).json({
            message: "Gemini is overloaded. Please try again later."
        });
    }

    return res.status(500).json({
        message: err.message || "Failed to generate interview report."
    });
}}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res, next) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res, next) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
      );

    res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res, next) {
  try {
    const { interviewReportId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
}
