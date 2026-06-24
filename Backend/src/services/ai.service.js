const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const withRetry = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (err) {
    const isRetryable = err?.status === 429 || err?.status === 503;
    if (isRetryable && retries > 0) {
      const wait = 4000 * Math.pow(2, 3 - retries);
      console.log(`Gemini status ${err.status}. Retrying in ${wait}ms...`);
      await delay(wait);
      return withRetry(fn, retries - 1);
    }
    //throw err;
    if (isRetryable) {
      throw {
        status: err.status,
        message: "Gemini is currently overloaded or experiencing timeouts. Please try again later.",
      };
    }

    throw err;
  }
};

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
Generate an interview preparation report.

IMPORTANT:
Return ONLY valid JSON matching the schema.

technicalQuestions MUST be:

[
  {
    "question":"...",
    "intention":"...",
    "answer":"..."
  }
]

behavioralQuestions MUST be:

[
  {
    "question":"...",
    "intention":"...",
    "answer":"..."
  }
]

skillGaps MUST be:

[
  {
    "skill":"...",
    "severity":"low"
  }
]

preparationPlan MUST be:

[
  {
    "day":1,
    "focus":"...",
    "tasks":["...","..."]
  }
]

Requirements:
- matchScore between 0 and 100
- 10 technical questions
- 5 behavioral questions
- at least 3 skill gaps
- 7 day preparation plan
- title should be job title

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    }),
  );
  // const response = await ai.models.generateContent({
  //   model: "gemini-2.5-flash",
  //   contents: prompt,
  //   config: {
  //     responseMimeType: "application/json",
  //     //responseSchema: zodToJsonSchema(interviewReportSchema),
  //   },
  // });

  console.log("GEMINI RAW RESPONSE:");
  console.log(response.text);

  const json = JSON.parse(response.text);

  console.log("FIELDS RECEIVED:");
  console.log(Object.keys(json));

  // Fix Gemini returning strings instead of objects

  if (
    json.technicalQuestions &&
    typeof json.technicalQuestions[0] === "string"
  ) {
    json.technicalQuestions = json.technicalQuestions.map((q) => ({
      question: q,
      intention: "Generated by AI",
      answer: "Prepare a detailed answer covering fundamentals and examples.",
    }));
  }

  if (
    json.behavioralQuestions &&
    typeof json.behavioralQuestions[0] === "string"
  ) {
    json.behavioralQuestions = json.behavioralQuestions.map((q) => ({
      question: q,
      intention: "Generated by AI",
      answer:
        "Use the STAR method (Situation, Task, Action, Result) while answering.",
    }));
  }

  if (json.skillGaps && typeof json.skillGaps[0] === "string") {
    json.skillGaps = json.skillGaps.map((skill) => ({
      skill,
      severity: "medium",
    }));
  }

  if (json.preparationPlan && typeof json.preparationPlan[0] === "string") {
    json.preparationPlan = json.preparationPlan.map((item, index) => ({
      day: index + 1,
      focus: item,
      tasks: [item],
    }));
  }

  // const parsed = interviewReportSchema.safeParse(json);

  // if (!parsed.success) {
  //   console.log("ZOD ERROR:");
  //   console.log(parsed.error);
  //   throw new Error("Invalid Gemini response");
  // }

  // return parsed.data;
  return json;
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `;

  // const response = await ai.models.generateContent({
  //   model: "gemini-2.5-flash",
  //   contents: prompt,
  //   config: {
  //     responseMimeType: "application/json",
  //     responseSchema: zodToJsonSchema(resumePdfSchema),
  //   },
  // });
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(resumePdfSchema),
      },
    }),
  );
  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
