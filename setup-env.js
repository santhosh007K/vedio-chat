const fs = require('fs');
const path = require('path');

console.log('🔧 Azure OpenAI Configuration Setup');
console.log('=====================================\n');

// Read existing .env if it exists
let envContent = '';
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📁 Found existing .env file');
} else {
    console.log('📁 Creating new .env file');
}

// Default configuration
const defaultConfig = {
    PORT: '3001',
    NODE_ENV: 'development',
    AZURE_OPENAI_API_KEY: 'your_azure_openai_api_key_here',
    AZURE_OPENAI_ENDPOINT: 'https://openai-central-india.openai.azure.com/',
    AZURE_OPENAI_DEPLOYMENT_NAME: 'gpt-4o-india',
    AZURE_OPENAI_API_VERSION: '2024-08-01-preview',
    MAX_FILE_SIZE: '100000000',
    UPLOAD_PATH: './uploads',
    ALLOWED_VIDEO_TYPES: 'mp4,webm,avi,mov,mkv'
};

// Parse existing .env content
const envVars = {};
if (envContent) {
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });
}

console.log('📝 Please provide your Azure OpenAI credentials:\n');

// Get API Key
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('🔑 Enter your Azure OpenAI API Key: ', (apiKey) => {
    if (apiKey.trim()) {
        envVars.AZURE_OPENAI_API_KEY = apiKey.trim();
    }
    
    // Generate new .env content
    let newEnvContent = '';
    
    Object.keys(defaultConfig).forEach(key => {
        const value = envVars[key] || defaultConfig[key];
        newEnvContent += `${key}=${value}\n`;
    });
    
    // Add comments
    newEnvContent = `# Server Configuration
${newEnvContent}
# Database Configuration (if needed later)
# DATABASE_URL=your_database_url_here

# JWT Secret (if authentication is added later)
# JWT_SECRET=your_jwt_secret_here
`;
    
    // Write .env file
    fs.writeFileSync(envPath, newEnvContent);
    
    console.log('\n✅ .env file created/updated successfully!');
    console.log('🚀 You can now start the server with: npm start');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Server Port: ${envVars.PORT || defaultConfig.PORT}`);
    console.log(`   Azure OpenAI Endpoint: ${envVars.AZURE_OPENAI_ENDPOINT || defaultConfig.AZURE_OPENAI_ENDPOINT}`);
    console.log(`   Azure OpenAI Model: ${envVars.AZURE_OPENAI_DEPLOYMENT_NAME || defaultConfig.AZURE_OPENAI_DEPLOYMENT_NAME}`);
    console.log(`   API Version: ${envVars.AZURE_OPENAI_API_VERSION || defaultConfig.AZURE_OPENAI_API_VERSION}`);
    
    rl.close();
});
