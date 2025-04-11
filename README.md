# AI Log Monitoring Agent

This application monitors log files for errors and automatically creates JIRA tickets when errors are detected. It uses OpenAI to analyze logs and GitHub to identify code owners.

## Features

- Monitors log files every 10 seconds
- Uses OpenAI to detect and analyze errors
- Automatically creates JIRA tickets
- Assigns tickets to code owners from GitHub
- Provides error description and Definition of Done (DOD)

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- GitHub personal access token
- JIRA API token
- A CODEOWNERS file in your GitHub repository

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   OPENAI_API_KEY=your-openai-api-key
   GITHUB_TOKEN=your-github-token
   GITHUB_REPO_OWNER=your-repo-owner
   GITHUB_REPO_NAME=your-repo-name
   JIRA_API_TOKEN=your-jira-api-token
   JIRA_EMAIL=your-jira-email
   JIRA_DOMAIN=your-domain.atlassian.net
   JIRA_PROJECT_KEY=your-project-key
   LOG_FILE_PATH=path/to/your/log/file.log
   ```

## Usage

1. Start the application:
   ```bash
   node index.js
   ```

2. The application will:
   - Monitor the specified log file every 10 seconds
   - Use OpenAI to analyze the logs for errors
   - When an error is detected, create a JIRA ticket
   - Assign the ticket to the appropriate code owner
   - Include error description and DOD in the ticket

## Notes

- Make sure your GitHub repository has a CODEOWNERS file
- The JIRA API token should have permissions to create issues
- The GitHub token should have access to read repository contents
- The OpenAI API key should have access to the GPT-3.5-turbo model 