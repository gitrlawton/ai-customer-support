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
    setMessages((messages) => [
      ...messages,
      {role: "user", content: message},
      {role: "assistant", content: ''}
    ])

    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // We need to define a new array here because the state variables may
      // not update in time to pick up what we added above with setMessages().
      // Send a message with the role being user.
      body: JSON.stringify([...messages, {role: "user", content: message}])
    }).then(async (resp) => {
    if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
    }
      const reader = resp.body.getReader()
      // Decode the encoding we did in the backend.
      const decoder = new TextDecoder()

      let result = ""
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        // Otherwise, keep updating our state variable.
        else {
          // Decode the value if there's a value, otherwise, decode a new array
          // which will end up being an empty string.
          const text = decoder.decode(value || new Int8Array(), {stream: true})

          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1]
            let otherMessages = messages.slice(0, messages.length - 1)

            return [
              ...otherMessages,
              {
                ...lastMessage,
                content: lastMessage.content + text,
              },
            ]
          })

          return reader.read().then(processText)

        }
      })
    }).catch(error => {
        console.error("Error in fetch:", error);
  })
}

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
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: 'green',
                },
              },
            }}
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