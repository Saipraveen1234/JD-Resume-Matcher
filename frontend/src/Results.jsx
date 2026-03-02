import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { marked } from "marked";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;
  const resumeText = location.state?.resumeText || "No text available.";
  const pdfUrl = location.state?.pdfUrl;
  const initialTab = results?.optimizedResumeText ? "optimized" : "parsed";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          No results found
        </h2>
        <p className="text-gray-500 mb-8">
          Please scan a resume first to view results.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium shadow-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!results.optimizedResumeText) return;
    setIsDownloading(true);

    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: "Times New Roman", Times, serif;
                        font-size: 10.5pt;
                        line-height: 1.3;
                        color: #000;
                        background: #fff;
                    }
                    .resume-container {
                        padding: 20px 30px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header { text-align: center; margin-bottom: 12px; }
                    .header h1 { font-size: 24pt; font-weight: normal; margin: 0 0 4px 0; font-family: "Georgia", serif; letter-spacing: 0.5px; }
                    .header p { font-size: 9.5pt; margin: 0; }
                    
                    .section { margin-bottom: 12px; }
                    .section h2 { 
                        font-size: 10.5pt; 
                        font-weight: normal; 
                        text-transform: uppercase; 
                        margin: 0 0 2px 0; 
                        letter-spacing: 1px;
                        font-variant: small-caps;
                    }
                    .hr { border-bottom: 1px solid #000; margin-bottom: 6px; }
                    
                    .section p { margin: 0 0 4px 0; text-align: justify; }
                    
                    .item { margin-bottom: 8px; }
                    .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
                    .item-sub { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
                    
                    .bold { font-weight: bold; }
                    .italic { font-style: italic; }
                    
                    ul { margin: 0; padding-left: 18px; }
                    li { margin-bottom: 3px; text-align: justify; }
                </style>
            </head>
            <body>
                ${results.optimizedResumeText.replace(/<mark[^>]*>|<\/mark>/g, "")}
            </body>
            </html>
        `;

    try {
      const response = await fetch("http://localhost:5002/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent }),
      });

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "Optimized_ATS_Resume.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate SVG Circle offset for Score
  const currentScore = results.matchScore || 0;
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  // Format score color based on value
  const isGoodScore = currentScore >= 75;
  const scoreColor = isGoodScore
    ? "#10b981"
    : currentScore >= 50
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-[60px] bg-[#1e1e38] text-white flex items-center px-6 justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <span className="font-bold tracking-wide text-[15px]">
            ATS Optimizer
          </span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-indigo-500 hover:bg-indigo-600 px-5 py-2 rounded-md text-white font-medium text-sm transition-colors shadow-sm"
        >
          Start New Scan
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-60px)]">
        {/* Main Content - Analysis */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
          <div className="max-w-4xl mx-auto">
            {/* Greeting Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-[#111827] mb-2 tracking-tight">
                Your Action Plan
              </h1>
              <p className="text-gray-500 text-[15px]">
                Here is your detailed ATS optimization strategy based on the
                provided Job Description.
              </p>
            </div>

            {/* Score Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-8 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Score Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke={scoreColor}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={
                      2 * Math.PI * 60 -
                      (currentScore / 100) * (2 * Math.PI * 60)
                    }
                    className="transition-all duration-1000 ease-out stroke-current"
                    style={{ color: scoreColor }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black text-gray-800 tabular-nums leading-none tracking-tight">
                    {currentScore}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                    Match
                  </span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Your resume scored {currentScore} out of 100.
                </h2>
                <p className="text-gray-600 text-[15px] leading-relaxed mb-6">
                  {isGoodScore
                    ? "You have a strong foundation! Your resume overlaps well with the job description. Review the minor tweaks below to guarantee you pass the strictest ATS filters."
                    : "Your resume is currently missing crucial exact-match criteria from the Job Description. The ATS is likely to filter it out. Follow the exact steps below to dramatically improve your match rate."}
                </p>
                <div className="bg-[#fff9e6] border border-amber-200 p-4 rounded-lg flex gap-3 text-left">
                  <svg
                    className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-[13px] text-gray-700 font-medium">
                    This score is highly strict. Ensure you incorporate the
                    exact changes outlined below to optimize for automated
                    recruiter screenings.
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Report */}
            <div className="space-y-6">
              {/* Missing Keywords Box */}
              {results.atsKeywordsMissing &&
                results.atsKeywordsMissing.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-[16px] font-bold text-red-900 tracking-wide">
                        Missing Exact Match Keywords
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-[14px] text-gray-600 mb-4">
                        The ATS scanner will look for these verbatim phrases
                        from the Job Description. You must include them
                        naturally in your experience section.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {results.atsKeywordsMissing.map((kw, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm text-gray-800 text-[13px] font-semibold rounded-md"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Exact Changes Needed */}
              {results.exactChanges && results.exactChanges.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-[16px] font-bold text-indigo-900 tracking-wide">
                      Mandatory Resume Fixes
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {results.exactChanges.map((change, i) => (
                      <div
                        key={i}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-gray-800 text-[15px] leading-relaxed">
                          {change}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Projects Box */}
              {results.suggestedProjects &&
                results.suggestedProjects.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-[16px] font-bold text-emerald-900 tracking-wide">
                        Recommended Projects to Build
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {results.suggestedProjects.map((proj, i) => (
                        <div key={i} className="p-6">
                          <h4 className="text-[16px] font-bold text-gray-900 mb-2">
                            {proj.title}
                          </h4>
                          <p className="text-gray-600 text-[14px] leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Interview Overview */}
              {results.projectOverviews && (
                <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden mb-8">
                  <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-[16px] font-bold text-purple-900 tracking-wide">
                      Interview Prep Tracker
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
                      <p className="text-gray-700 text-[15px] italic leading-relaxed">
                        "{results.projectOverviews}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Resume Viewer (Side-by-Side) */}
        <aside className="w-[800px] lg:w-[1000px] bg-[#f8fafc] border-l border-gray-200 shrink-0 hidden lg:flex flex-col overflow-hidden">
          <div className="h-[60px] bg-white border-b border-gray-200 flex items-center px-4 shrink-0 justify-between">
            <span className="text-sm font-bold text-gray-800 flex items-center gap-2 px-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Resume Comparison
            </span>

            <div className="flex items-center gap-2">
              {results.optimizedResumeText && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  title="Download Optimized PDF"
                >
                  {isDownloading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  Download Optimized
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex divide-x divide-gray-200">
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  Original Uploaded PDF
                </p>
              </div>
              <div className="flex-1 overflow-hidden w-full h-full bg-neutral-100/50">
                {pdfUrl ? (
                    <iframe 
                      src={`${pdfUrl}#toolbar=0&navpanes=0`} 
                      className="w-full h-full border-none" 
                      title="Original PDF Resume"
                    />
                ) : (
                    <div className="font-mono text-[12px] leading-relaxed text-gray-700 whitespace-pre-wrap break-words p-4 overflow-y-auto w-full h-full">
                      {resumeText.trim()}
                    </div>
                )}
              </div>
            </div>

            {/* Right Column: Optimized */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
              <div className="p-3 bg-indigo-50 border-b border-indigo-100 shrink-0">
                <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI-Optimized (90+ ATS Score)
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                {results.optimizedResumeText ? (
                  <div
                    className="w-full max-w-[650px] bg-white border border-gray-200 shadow-sm p-6 shrink-0"
                    style={{
                      fontFamily: '"Times New Roman", Times, serif',
                      fontSize: "11px",
                      lineHeight: "1.4",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: results.optimizedResumeText
                        .replace(
                          /class="hr"/g,
                          'style="border-bottom: 1px solid #000; margin-bottom: 4px;"',
                        )
                        .replace(
                          /class="header"/g,
                          'style="text-align: center; margin-bottom: 8px;"',
                        )
                        .replace(
                          /<h1/g,
                          '<h1 style="font-size: 18px; margin: 0; font-family: Georgia, serif;"',
                        )
                        .replace(
                          /<h2/g,
                          '<h2 style="font-size: 12px; text-transform: uppercase; font-variant: small-caps; margin: 0 0 2px 0;"',
                        )
                        .replace(
                          /class="section"/g,
                          'style="margin-bottom: 10px;"',
                        )
                        .replace(/class="item"/g, 'style="margin-bottom: 6px;"')
                        .replace(
                          /class="item-header"/g,
                          'style="display: flex; justify-content: space-between; align-items: baseline;"',
                        )
                        .replace(
                          /class="item-sub"/g,
                          'style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;"',
                        )
                        .replace(/class="bold"/g, 'style="font-weight: bold;"')
                        .replace(
                          /class="italic"/g,
                          'style="font-style: italic;"',
                        )
                        .replace(
                          /<ul/g,
                          '<ul style="margin: 0; padding-left: 20px;"',
                        )
                        .replace(
                          /<p/g,
                          '<p style="margin: 0 0 2px 0; text-align: justify;"',
                        )
                        .replace(
                          /<li/g,
                          '<li style="margin-bottom: 2px; text-align: justify;"',
                        ),
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm flex items-center justify-center h-full">
                    No optimized version available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Results;
