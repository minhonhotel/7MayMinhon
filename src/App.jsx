import { useState } from 'react'
import { askGPT } from './openaiClient'

function App() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')

  const handleSubmit = async () => {
    const result = await askGPT(prompt)
    setResponse(result)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <textarea
          id="prompt"
          className="w-full p-2 border rounded"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
        />
      </div>
      <button
        id="send-btn"
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      >
        Send
      </button>
      <div id="response" className="mt-4 p-4 border rounded">
        {response || 'Response will appear here...'}
      </div>
    </div>
  )
}

export default App 