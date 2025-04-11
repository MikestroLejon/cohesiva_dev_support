require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
const OpenAI = require('openai');
const axios = require('axios');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize GitHub client
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Function to read log file
async function readLogFile() {
    try {
        const data = await fs.promises.readFile(process.env.LOG_FILE_PATH, 'utf8');
        return data;
    } catch (error) {
        console.error('Error reading log file:', error);
        return null;
    }
}

// Function to detect errors using OpenAI
async function detectError(logContent) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert at analyzing log files and identifying errors. Analyze the following log content and identify if there are any errors. If there are errors, provide a brief description and suggest a Definition of Done (DOD) for fixing it."
                },
                {
                    role: "user",
                    content: logContent
                }
            ]
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing log with OpenAI:', error);
        return null;
    }
}

// Function to get code owners from GitHub
async function getCodeOwners() {
    try {
        const response = await octokit.repos.getContent({
            owner: process.env.GITHUB_REPO_OWNER,
            repo: process.env.GITHUB_REPO_NAME,
            path: 'CODEOWNERS'
        });

        const content = Buffer.from(response.data.content, 'base64').toString();
        const owners = content.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => line.split('@')[1])
            .filter(Boolean);

        return owners;
    } catch (error) {
        console.error('Error getting code owners:', error);
        return [];
    }
}

// Function to create JIRA ticket
async function createJiraTicket(errorDescription, codeOwners) {
    try {
        const response = await axios.post(
            `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
            {
                fields: {
                    project: {
                        key: process.env.JIRA_PROJECT_KEY
                    },
                    summary: `Error detected in logs: ${errorDescription.split('\n')[0]}`,
                    description: {
                        type: "doc",
                        version: 1,
                        content: [
                            {
                                type: "paragraph",
                                content: [
                                    {
                                        type: "text",
                                        text: errorDescription
                                    }
                                ]
                            }
                        ]
                    },
                    issuetype: {
                        name: "Task"
                    },
                    assignee: {
                        name: codeOwners[0] // Assign to first code owner
                    }
                }
            },
            {
                auth: {
                    username: process.env.JIRA_EMAIL,
                    password: process.env.JIRA_API_TOKEN
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('JIRA ticket created:', response.data.key);
        return response.data;
    } catch (error) {
        console.error('Error creating JIRA ticket:', error);
        return null;
    }
}

// Main function to process logs
async function processLogs() {
    console.log('Checking logs...');
    const logContent = await readLogFile();
    if (!logContent) return;

    const errorAnalysis = await detectError(logContent);
    if (!errorAnalysis || !errorAnalysis.includes('Error')) return;

    const codeOwners = await getCodeOwners();
    if (codeOwners.length === 0) {
        console.log('No code owners found');
        return;
    }

    await createJiraTicket(errorAnalysis, codeOwners);
}

// Schedule the task to run every 10 seconds
cron.schedule('*/10 * * * * *', processLogs);

console.log('Log monitoring agent started...'); 