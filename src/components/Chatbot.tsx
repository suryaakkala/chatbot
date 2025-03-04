import React, { useState, useRef } from 'react';
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

interface Message {
  text: string;
  audioUrl?: string;
  sender: 'user' | 'bot';
  explanation?: string;
}

const Header: React.FC<{ toggleTheme: () => void, isDarkMode: boolean }> = ({ toggleTheme, isDarkMode }) => {
  return (
    <header
      style={{
        width: "98%",
        backgroundColor: isDarkMode ? "#333333" : "#DFF6FF",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
      }}
    >
      <img src="/klu.png" alt="Left Logo" style={{ height: "40px" }} />
      <button
        onClick={toggleTheme}
        style={{
          padding: "10px 15px",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
          backgroundColor: isDarkMode ? "#ffffff" : "#47B5FF",
          color: isDarkMode ? "#000000" : "white",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? "#cccccc" : "#256D85")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? "#ffffff" : "#47B5FF")}
        onMouseDown={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? "#999999" : "#06283D")}
        onMouseUp={(e) => (e.currentTarget.style.backgroundColor = isDarkMode ? "#cccccc" : "#256D85")}
      >
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <img src="/klug.png" alt="Right Logo" style={{ height: "40px" }} />
    </header>
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

      const response = await fetch('https://rwhmdthc-5000.inc1.devtunnels.ms/get-response', {
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
      const response = await fetch('https://rwhmdthc-5000.inc1.devtunnels.ms/audio_trans', {
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
            const response = await fetch('https://rwhmdthc-5000.inc1.devtunnels.ms/audio_trans', { 
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
            const secondApiResponse = await fetch('https://rwhmdthc-5000.inc1.devtunnels.ms/get-response', {
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
    <div 
      className={`min-h-screen ${inter.className}`}
        style={{
          backgroundColor: isDarkMode ? '#1a202c' : '#f7fafc',
          color: isDarkMode ? '#ffffff' : '#000000',
        }}
      >
      <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <p>{msg.text}</p>
              {msg.audioUrl && <audio controls src={msg.audioUrl}></audio>}
              {msg.explanation && msg.sender === 'bot' && (
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
          <button onClick={toggleRecording}>{isRecording ? 'Stop' : 'Record'}</button>
          <input type="file" onChange={handleFileUpload} className="file-input" />
        </div>
        <style jsx>{`
          .chat-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 500px;
            margin: 20px auto;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 15px;
            background-color: ${isDarkMode ? '#333333' : '#ffffff'};
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: ${isDarkMode ? '#444444' : '#f7f7f7'};
          }
          .message {
            margin-bottom: 12px;
            padding: 8px 12px;
            border-radius: 8px;
          }
          .message.user {
            align-self: flex-end;
            text-align: right;
            color: #ffffff;
            background-color: #47B5FF;
          }
          .message.bot {
            align-self: flex-start;
            text-align: left;
            color: #ffffff;
            background-color: #256D85;
          }
          .explain-button {
            margin-top: 5px;
            padding: 5px 10px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            background-color: #06283D;
            color: white;
            font-size: 12px;
          }
          .explain-button:hover {
            background-color: #256D85;
          }
          .input-container {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .input-container input[type='text'] {
            flex: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 14px;
            background-color: ${isDarkMode ? '#444444' : '#ffffff'};
            color: ${isDarkMode ? '#ffffff' : '#000000'};
          }
          .input-container button {
            padding: 10px 15px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            background-color: ${isDarkMode ? '#ffffff' : '#47B5FF'};
            color: ${isDarkMode ? '#000000' : 'white'};
            transition: background-color 0.3s;
          }
          .input-container button:hover {
            background-color: ${isDarkMode ? '#cccccc' : '#256D85'};
          }
          .input-container button:active {
            background-color: ${isDarkMode ? '#999999' : '#06283D'};
          }
          .input-container input[type='file'] {
            border: none;
            font-size: 14px;
            padding: 10px;
            border-radius: 8px;
            background-color: #DFF6FF;
            cursor: pointer;
          }
          .input-container input[type='file']::file-selector-button {
            padding: 10px 15px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            background-color: ${isDarkMode ? '#ffffff' : '#47B5FF'};
            color: ${isDarkMode ? '#000000' : 'white'};
            transition: background-color 0.3s;
          }
          .input-container input[type='file']::file-selector-button:hover {
            background-color: ${isDarkMode ? '#cccccc' : '#256D85'};
          }
          .input-container input[type='file']::file-selector-button:active {
            background-color: ${isDarkMode ? '#999999' : '#06283D'};
          }
        `}</style>
      </div>
    </div>
  );
};

export default Chatbot;
