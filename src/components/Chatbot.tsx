import React, { useState, useRef } from 'react';

interface Message {
  text: string;
  audioUrl?: string;
  sender: 'user' | 'bot';
  explanation?: string;
}

const Header: React.FC<{ toggleTheme: () => void, isDarkMode: boolean }> = ({ toggleTheme, isDarkMode }) => {
    return (
    <>
      <header className="header">
        <img src="/klu.png" alt="Left Logo" className="logo" />
        <button
          className="theme-toggle-button"
          onClick={toggleTheme}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = isDarkMode
              ? "#cccccc"
              : "#256D85")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = isDarkMode
              ? "#ffffff"
              : "#47B5FF")
          }
          onMouseDown={(e) =>
            (e.currentTarget.style.backgroundColor = isDarkMode
              ? "#999999"
              : "#06283D")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.backgroundColor = isDarkMode
              ? "#cccccc"
              : "#256D85")
          }
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <img src="/klug.png" alt="Right Logo" className="logo" />
      </header>
      <style jsx>{`
        .header {
          background-color: ${isDarkMode ? "#333333" : "#DFF6FF"};
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: row;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          padding: 4px 4px;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
        }
        .logo {
          height: 40px;
        }
        .theme-toggle-button {
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background-color: ${isDarkMode ? "#ffffff" : "#47B5FF"};
          color: ${isDarkMode ? "#000000" : "white"};
          transition: background-color 0.3s;
        }
      `}</style>
    </>
  );
};

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const formData = new FormData();
      formData.append('type', 'text');
      formData.append('query_message', input);

      const response = await fetch('https://qpc28cj1-8000.inc1.devtunnels.ms/get-response', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      const botMessage: Message = {
        text: data.data,
        audioUrl: data.audio,
        explanation: data.explanation, // Include explanation field
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    }
    setInput('');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('type', 'audio');
    formData.append('audio', file);

    try {
      const response = await fetch('https://qpc28cj1-8000.inc1.devtunnels.ms/audio_trans', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      const botMessage: Message = {
        text: data.message,
        // audioUrl: data.audio,
        // explanation: data.explanation, // Include explanation field
        sender: 'bot',
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks: BlobPart[] = [];
        chunksRef.current = chunks;

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob); // Create URL for the recorded audio
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recorded_audio.wav'); // Ensure correct key is used
        
          try {
            const response = await fetch('https://qpc28cj1-8000.inc1.devtunnels.ms/audio_trans', { 
              method: 'POST',
              body: formData,
            });
        
            const data = await response.json();
            console.log('API Response:', data); // Debugging log
        
            const botMessage: Message = {
              text: data.data,
              audioUrl: data.audio,
              explanation: data.explanation, 
              sender: 'user',
            };
            setMessages((prev) => [...prev, botMessage]);
            const audiorespastext = new FormData();
            audiorespastext.append('type', 'text');
            audiorespastext.append('query_message', data.data);
            
            // Send the response to another API
            const secondApiResponse = await fetch('https://qpc28cj1-8000.inc1.devtunnels.ms/get-response', {
              method: 'POST',
              body: audiorespastext ,
            });

            const secondApiData = await secondApiResponse.json();
            console.log('Second API Response:', secondApiData);
            const botMessage2: Message = {
              text: secondApiData.data,
              // audioUrl: data.audio,
              explanation: secondApiData.explanation, 
              sender: 'bot',
            };
            setMessages((prevMessages) => [...prevMessages, botMessage2]);
          } catch (error) {
            console.error('Error sending audio:', error);
          }

          // Add the recorded audio message to the chat
          const recordedMessage: Message = {
            text: 'Recorded audio',
            audioUrl: audioUrl,
            sender: 'user',
          };
          setMessages((prevMessages) => [...prevMessages, recordedMessage]);
        };
        

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const showExplanation = (index: number) => {
    const explanationMessage: Message = {
      text: messages[index].explanation || 'No explanation provided.',
      sender: 'bot',
    };
    setMessages((prevMessages) => [...prevMessages, explanationMessage]);
  };

    return (
    <>
      <div className="chatbot-container">
        <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender}`}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}
              >
                <p>{msg.text}</p>
                {msg.audioUrl && <audio controls src={msg.audioUrl}></audio>}
                {msg.explanation && msg.sender === "bot" && (
                  <button
                    className="explain-button"
                    onClick={() => showExplanation(index)}
                  >
                    Explain
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={toggleRecording}>
              {isRecording ? "Stop" : "Record"}
            </button>
            <input type="file" onChange={handleFileUpload} className="file-input" />
          </div>
        </div>
      </div>
      <style jsx>{`
        .chatbot-container {
          background-color: ${isDarkMode ? "#1a202c" : "#f7fafc"};
          color: ${isDarkMode ? "#ffffff" : "#000000"};
          display: flex;
          flex-direction: column;
          width: 100%;
          align-items: center;
          justify-content: flex-start;
          height: 100vh;
          margin: 0;
          overflow: hidden; /* Prevent body scroll */
        }
        .chat-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 800px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 15px;
          background-color: ${isDarkMode ? "#333333" : "#ffffff"};
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          flex: 1;
          margin-top: 50px; /* Adjust for header height */
          margin-bottom: 0;
          overflow: hidden; /* Prevent container scroll */
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: ${isDarkMode ? "#444444" : "#f7f7f7"};
        }
        .message {
          margin-bottom: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          color: #ffffff;
          background-color: ${isDarkMode ? "#256D85" : "#47B5FF"};
        }
        .message.user {
          background-color: #47b5ff;
        }
        .message.bot {
          background-color: #256d85;
        }
        .explain-button {
          margin-top: 5px;
          padding: 5px 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          background-color: #06283d;
          color: white;
          font-size: 12px;
        }
        .input-container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .input-container input[type="text"] {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 14px;
          background-color: ${isDarkMode ? "#444444" : "#ffffff"};
          color: ${isDarkMode ? "#ffffff" : "#000000"};
        }
        .input-container button {
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background-color: ${isDarkMode ? "#ffffff" : "#47B5FF"};
          color: ${isDarkMode ? "#000000" : "white"};
          transition: background-color 0.3s;
        }
        .file-input {
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background-color: ${isDarkMode ? "#ffffff" : "#47B5FF"};
          color: ${isDarkMode ? "#000000" : "white"};
          transition: background-color 0.3s;
        }
      `}</style>
    </>
  );
};

export default Chatbot;
