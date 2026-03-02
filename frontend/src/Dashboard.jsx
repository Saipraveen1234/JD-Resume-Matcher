import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';

function Dashboard() {
    const [jobDescription, setJobDescription] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jobDescription || !resumeFile) {
            alert("Please provide both a Job Description and a Resume PDF.");
            return;
        }

        setLoading(true);

        try {
            // 1. Parse Resume
            const formData = new FormData();
            formData.append('resume', resumeFile);

            const parseRes = await fetch('http://localhost:5002/api/parse-resume', {
                method: 'POST',
                body: formData,
            });

            const parseData = await parseRes.json();

            if (!parseData.success) {
                throw new Error(parseData.error || "Failed to parse resume");
            }

            // 2. Match JD and Resume
            const matchRes = await fetch('http://localhost:5002/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeText: parseData.text,
                    jobDescription: jobDescription,
                })
            });

            const matchData = await matchRes.json();

            if (!matchRes.ok || !matchData.success) {
                throw new Error(matchData.error || "Failed to analyze match score");
            }

            // 3. Navigate to results page with data
            const pdfUrl = URL.createObjectURL(resumeFile);
            navigate('/results', { state: { results: matchData, resumeText: parseData.text, pdfUrl: pdfUrl } });

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-indigo-500/30 font-sans">
            {loading && <LoadingScreen />}
            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">ATS Optimizer</h1>
                            <p className="text-xs text-neutral-400 font-medium tracking-wide">AI-Powered Resume Matching</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-10">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold tracking-tight mb-4">Analyze your fit.</h2>
                        <p className="text-lg text-neutral-400">Paste the job description and upload your resume to see how well you match the ATS criteria.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 bg-white/[0.02] border border-white/5 p-8 rounded-3xl shadow-xl">
                        {/* JD Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300 ml-1">Job Description</label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the full job description here..."
                                className="w-full h-72 bg-white/5 border border-white/10 rounded-2xl p-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                                required
                            />
                        </div>

                        {/* Resume Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300 ml-1">Your Resume (PDF)</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    required
                                />
                                <div className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${resumeFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 bg-white/5 group-hover:border-white/20 group-hover:bg-white/10'}`}>
                                    {resumeFile ? (
                                        <div className="flex items-center gap-3 text-indigo-400">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="font-medium text-lg">{resumeFile.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500/10 transition-colors">
                                                <svg className="w-6 h-6 text-neutral-400 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                            </div>
                                            <p className="text-base text-neutral-400 font-medium">Click or drag PDF to upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing Match with AI...
                                </>
                            ) : (
                                'Scan Resume vs JD'
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
