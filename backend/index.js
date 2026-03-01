const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up Multer for handling file uploads (in memory for parsing)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ATS Resume Matcher API is running.' });
});

// Endpoint: Parse a PDF Resume
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Currently only supporting PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported at this time.' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    res.json({ success: true, text: text });

  } catch (error) {
    console.error("Error parsing resume:", error);
    res.status(500).json({ error: 'Failed to parse resume.' });
  }
});

const { GoogleGenAI } = require('@google/genai');

// Endpoint: Match Resume with JD
app.post('/api/match', async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Both resumeText and jobDescription are required.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
        You are an expert ATS (Applicant Tracking System), senior technical recruiter, and career mentor. 
        Your task is to evaluate the following Resume against the provided Job Description.

        Job Description:
        """${jobDescription}"""

        Resume Text:
        """${resumeText}"""

        Based on the Job Description, provide a strict ATS Match Score (0-100) and extract FOUND vs MISSING ATS skills.
        
        Crucially, instead of generic recommendations, you must provide:
        1. "exactChanges": Specific, actionable sentences or bullet points the user MUST change or add to their resume to exactly match the JD.
        2. "suggestedProjects": A list of 2-3 specific, realistic project ideas relevant to the role that the user should build and add to their resume to strengthen their profile.
        3. "projectOverviews": A brief overview explaining how to talk about these suggested projects in an interview setting, highlighting the technical decisions that matter for this specific Job Description.

        Return ONLY a raw JSON object with this exact structure (do not include markdown wrapping like \`\`\`json):
        {
           "matchScore": number,
           "atsKeywordsFound": ["keyword1", "keyword2"],
           "atsKeywordsMissing": ["keyword3", "keyword4"],
           "exactChanges": ["change 1", "change 2"],
           "suggestedProjects": [{"title": "Project Name", "description": "Brief description"}],
           "projectOverviews": "Overview text on how to discuss these projects in an interview."
        }
        `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    // The response text is guaranteed to be JSON due to responseMimeType
    const rawText = response.text || "{}";
    let resultData;

    try {
      // In case there are subtle wrapping issues despite the config
      const cleanedText = rawText.replace(/^```json/g, '').replace(/```$/g, '').trim();
      resultData = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse LLM JSON:", rawText);
      // fallback object
      resultData = {
        matchScore: 0,
        atsKeywordsFound: [],
        atsKeywordsMissing: [],
        exactChanges: ["Error parsing changes."],
        suggestedProjects: [],
        projectOverviews: "Error analyzing projects."
      };
    }

    let optimizedResumeText = null;

    if (resultData.matchScore < 90) {
      console.log("Score below 90. Generating ATS-optimized ready resume...");
      try {
        const rewritePrompt = `
        You are an elite executive resume writer and ATS specialist. The candidate's resume scored below 90 on an ATS check for the following Job Description.
        Your task is to completely rewrite and optimize the candidate's resume so it is guaranteed to score 90+ on modern Applicant Tracking Systems.
        
        Job Description:
        """${jobDescription}"""

        Original Resume:
        """${resumeText}"""
        
        Strict Guidelines:
        1. Preserve the candidate's actual job titles, companies, dates, degrees, and core truth. Do not invent fake experience.
        2. Vigorously rephrase summary and experience bullet points to natively embed the specific keywords and phrasing required by the Job Description.
        3. Quantify achievements where plausible based on original text.
        4. You MUST return ONLY the final, polished, ready-to-use resume formatted STRICTLY using the exact HTML template below. Do NOT use markdown. Do NOT wrap it in \`\`\`html tags. Just return the raw HTML string.

        <div class="resume-container">
            <div class="header">
                <h1>[Full Name]</h1>
                <p>[City, Country] | [Email] | [LinkedIn/GitHub]</p>
            </div>
            
            <div class="section">
                <h2>SUMMARY</h2>
                <div class="hr"></div>
                <p>[A powerful 3-4 line summary highlighting key ATS keywords and total experience]</p>
            </div>

            <div class="section">
                <h2>TECHNICAL SKILLS</h2>
                <div class="hr"></div>
                <p><strong>Programming Languages:</strong> [Skills]</p>
                <p><strong>Frameworks & Libraries:</strong> [Skills]</p>
                <p><strong>Databases:</strong> [Skills]</p>
                <p><strong>Cloud & DevOps:</strong> [Skills]</p>
            </div>

            <div class="section">
                <h2>EXPERIENCE</h2>
                <div class="hr"></div>
                
                <div class="item">
                    <div class="item-header">
                        <span class="bold">[Job Title]</span>
                        <span>[Month Year] – [Month Year/Present]</span>
                    </div>
                    <div class="item-sub">
                        <span class="italic">[Company Name]</span>
                        <span class="italic">[Location]</span>
                    </div>
                    <ul>
                        <li>[Achievement/Responsibility 1 with metrics and ATS keywords]</li>
                        <li>[Achievement/Responsibility 2 with metrics and ATS keywords]</li>
                    </ul>
                </div>
                <!-- Repeat for other roles -->
            </div>

            <div class="section">
                <h2>PROJECTS</h2>
                <div class="hr"></div>
                
                <div class="item">
                    <div class="item-header">
                        <span><strong class="bold">[Project Name]</strong> | <em class="italic">[Tech Stack]</em></span>
                        <span>[Year]</span>
                    </div>
                    <ul>
                        <li>[Project details highlighting ATS keywords]</li>
                    </ul>
                </div>
            </div>

            <div class="section">
                <h2>EDUCATION</h2>
                <div class="hr"></div>
                
                <div class="item">
                    <div class="item-header">
                        <span class="bold">[Degree Name]</span>
                        <span>[Date Range]</span>
                    </div>
                    <div class="item-sub">
                        <span class="italic">[University Name]</span>
                        <span class="italic">[Location]</span>
                    </div>
                </div>
            </div>
        </div>
        `;

        const rewriteResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: rewritePrompt,
        });

        optimizedResumeText = rewriteResponse.text;
      } catch (rewriteErr) {
        console.error("Failed to generate optimized resume:", rewriteErr);
      }
    }

    res.json({
      success: true,
      matchScore: resultData.matchScore || 0,
      atsKeywordsFound: resultData.atsKeywordsFound || [],
      atsKeywordsMissing: resultData.atsKeywordsMissing || [],
      exactChanges: resultData.exactChanges || [],
      suggestedProjects: resultData.suggestedProjects || [],
      projectOverviews: resultData.projectOverviews || "",
      optimizedResumeText: optimizedResumeText
    });

  } catch (llmError) {
    console.error("LLM Error:", llmError);
    res.status(500).json({ error: 'AI Matching Failed. Did you set your API key?' });
  }
});
const puppeteer = require('puppeteer');

// Endpoint: Generate PDF from HTML using Puppeteer
app.post('/api/generate-pdf', async (req, res) => {
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res.status(400).json({ error: 'htmlContent is required.' });
  }

  try {
    const launchOptions = {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new'
    };

    // If running in Alpine Docker, use the installed chromium
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate true text PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' }
    });

    await browser.close();

    res.contentType("application/pdf");
    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
