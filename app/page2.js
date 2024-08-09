// This file is the frontend.

'use client' // Needed when using state.
import {useState} from "react";
import { Box, Stack, TextField, Button } from "@mui/material"

export default function Home() {
  // All the messages.
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Hi, I'm the Headstarter Support Agent, how can I help you today?`
  }])

  // The message we're typing in the text box.
  const [message,setMessage] = useState('')

  // Helper function to send our messages array to the backend and
  // return the response.
  const sendMessage = async () => {
    setMessage('');
    setMessages((prevMessages) => [
      ...prevMessages,
      {role: "user", content: message},
      {role: "assistant", content: ''}
    ]);
  
    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([...messages, {role: "user", content: message}])
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: data.content[0].text
        };
        return newMessages;
      });
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {role: "system", content: `Error: ${error.message}. Please try again.`}
      ]);
    }
  };

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        {/** Stack for messages. */}
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {/** Display our messages. */}
          {
            messages.map((message, index) => (
              <Box
                key={index}
                display="flex" 
                /** Set the value of JC (msg on left or right) depending on the role. */
                justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}
              >
                {/** Container for our message. */}
                <Box
                  bgcolor={message.role === "assistant" ? "primary.main" : "secondary.main"}
                  color="white"
                  borderRadius={16}
                  p={3}
                >
                  {/** Display the message. */}
                  {message.content}
                </Box>
              </Box>
            ))
          }
        </Stack>
        <Stack
          direction="row"
          spacing={2}
        >
          <TextField
            label="message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
