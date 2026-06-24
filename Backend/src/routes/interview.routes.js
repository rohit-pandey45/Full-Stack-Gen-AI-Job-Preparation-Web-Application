const express = require("express")
const multer = require("multer")
const authMiddleware = require("../middlewares/auth.middleware.js")
const interviewController = require("../controllers/interview.controller.js")
const upload = require("../middlewares/file.middleware.js")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
// interviewRouter.post("/", authMiddleware.authUser, (req, res, next) => {
//   // Execute the upload single file middleware manually
//   upload.single("resume")(req, res, function (err) {
//     if (err instanceof multer.MulterError) {
//       // Catch the explicit size limit exception defined in your multer file
//       if (err.code === "LIMIT_FILE_SIZE") {
//         return res.status(413).json({ 
//           success: false, 
//           message: "File is too large. Maximum size allowed is 3MB." 
//         });
//       }
//       return res.status(400).json({ success: false, message: err.message });
//     } else if (err) {
//       // Catch any unexpected non-multer errors during upload
//       return res.status(500).json({ success: false, message: "An error occurred during file upload." });
//     }

//     // Everything passed successfully! Pass control back to your controller
//     interviewController.generateInterViewReportController(req, res, next);
//   });
// });
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)



module.exports = interviewRouter