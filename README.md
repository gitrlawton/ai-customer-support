# AI Support Bot

## Overview

This project is a web application that serves as a customer support bot. The application utilizes AWS Bedrock for natural language processing and Pinecone for vector storage, enabling it to provide accurate and context-aware responses to user inquiries.

## Features

- **Interactive Chat**: Users can engage in a conversation with the AI support bot to get assistance with their queries.
- **Contextual Responses**: The bot retrieves relevant context from a knowledge base to provide informed answers.
- **User-Friendly Interface**: The frontend is built using React and Material-UI, ensuring a responsive and intuitive user experience.
- **Error Handling**: The application includes robust error handling to manage API request failures gracefully.

## Installation

To set up the project, ensure you have Node.js and npm installed on your machine. Then, follow these steps:

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the required packages:

   ```bash
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the root directory and adding your AWS credentials and Pinecone index name:

   ```plaintext
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   PINECONE_INDEX_NAME=your_pinecone_index_name
   ```

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your web browser and navigate to `http://localhost:3000` to access the application.

3. Interact with the AI support bot by typing your questions in the provided text field.

## File Descriptions

- **app/page.js**: The main frontend component that handles user interactions and displays messages.
- **app/api/chat/route.js**: The backend API route that processes user messages, retrieves context, and generates responses using AWS Bedrock.

## Dependencies

- **React**: For building the user interface.
- **Material-UI**: For UI components and styling.
- **@pinecone-database/pinecone**: For interacting with the Pinecone vector database.
- **@langchain/aws**: For embedding queries using AWS Bedrock.
- **@aws-sdk/client-bedrock-runtime**: For making requests to the AWS Bedrock runtime.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.
