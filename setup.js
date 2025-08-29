#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🎥 Video Chat App Setup\n');
console.log('This script will help you configure the application.\n');

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setup() {
    try {
        // Check if .env already exists
        if (fs.existsSync('.env')) {
            const overwrite = await question('A .env file already exists. Do you want to overwrite it? (y/N): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('Setup cancelled.');
                rl.close();
                return;
            }
        }

        console.log('\n📝 Configuration Setup\n');

        // Server configuration
        const port = await question('Server port (default: 3001): ') || '3001';
        const nodeEnv = await question('Environment (development/production, default: development): ') || 'development';

        // Azure OpenAI configuration
        console.log('\n🔑 Azure OpenAI Configuration');
        console.log('You need to set up Azure OpenAI service first:');
        console.log('1. Go to Azure Portal');
        console.log('2. Create an Azure OpenAI resource');
        console.log('3. Deploy a model (e.g., GPT-4, GPT-3.5-turbo)');
        console.log('4. Get your API key and endpoint\n');

        const apiKey = await question('Azure OpenAI API Key: ');
        const endpoint = await question('Azure OpenAI Endpoint (e.g., https://your-resource.openai.azure.com/): ');
        const deploymentName = await question('Model Deployment Name: ');

        // File upload configuration
        console.log('\n📁 File Upload Configuration');
        const maxFileSize = await question('Maximum file size in bytes (default: 100000000 = 100MB): ') || '100000000';
        const uploadPath = await question('Upload directory (default: ./uploads): ') || './uploads';
        const allowedTypes = await question('Allowed video types (default: mp4,webm,avi,mov,mkv): ') || 'mp4,webm,avi,mov,mkv';

        // Create .env content
        const envContent = `# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=${apiKey}
AZURE_OPENAI_ENDPOINT=${endpoint}
AZURE_OPENAI_DEPLOYMENT_NAME=${deploymentName}

# File Upload Configuration
MAX_FILE_SIZE=${maxFileSize}
UPLOAD_PATH=${uploadPath}
ALLOWED_VIDEO_TYPES=${allowedTypes}

# Database Configuration (if needed later)
# DATABASE_URL=your_database_url_here

# JWT Secret (if authentication is added later)
# JWT_SECRET=your_jwt_secret_here
`;

        // Write .env file
        fs.writeFileSync('.env', envContent);

        // Create uploads directory if it doesn't exist
        const uploadDir = uploadPath.replace('./', '');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`✅ Created uploads directory: ${uploadDir}`);
        }

        console.log('\n✅ Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Review the .env file and update any values if needed');
        console.log('2. Run "npm install" to install dependencies');
        console.log('3. Run "npm start" to start the server');
        console.log('4. Open http://localhost:' + port + ' in your browser');
        console.log('\n🚀 Happy video chatting!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

setup();
