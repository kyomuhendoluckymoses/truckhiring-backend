import React, { useState, useEffect, useRef } from 'react';

export default function LuckyBotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! 👋 I'm LuckyBot. How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    // Simulate Bot Typing and Response
    setTimeout(() => {
      let botReply = "I'm not sure about that. Please contact our support at +256 742 502 154.";
      
      const lowerInput = userMessage.toLowerCase();
      
      if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('money')) {
        botReply = "Our prices depend on the distance and truck type. You can book a truck to get an exact quote from our drivers!";
      } else if (lowerInput.includes('book') || lowerInput.includes('hire')) {
        botReply = "To book a truck, simply click on 'Book a Truck' in the top menu, fill in your details, and submit!";
      } else if (lowerInput.includes('track') || lowerInput.includes('where')) {
        botReply = "You can track your truck live on the 'My History' page once a driver has accepted your booking.";
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
        botReply = "Hi there! How can I assist you with your cargo transport today?";
      } else if (lowerInput.includes('driver')) {
        botReply = "Our drivers are highly trained professionals. Once you confirm a price, they will be on their way!";
      } else if (lowerInput.includes('thank')) {
        botReply = "You're very welcome! Is there anything else I can help you with?";
      }

      setIsTyping(false);
      setMessages((prev) => [...prev, { text: botReply, sender: 'bot' }]);
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
      
      {/* CHAT WINDOW */}
      {isOpen && (
        <div style={{ 
          width: '350px', 
          height: '500px', 
          backgroundColor: 'white', 
          borderRadius: '20px', 
          boxShadow: '0 15px 40px rgba(0,0,0,0.15)', 
          display: 'flex', 
          flexDirection: 'column',
          marginBottom: '20px',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {/* Chat Header */}
          <div style={{ backgroundColor: '#2D1B69', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#FFA500', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0 }}>LuckyBot</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#10b981' }}>● Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  maxWidth: '80%', 
                  padding: '12px 16px', 
                  borderRadius: msg.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                  backgroundColor: msg.sender === 'user' ? '#4A3AFF' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#071D3A',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '20px 20px 20px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <span style={{ color: '#64748B' }}>LuckyBot is typing...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} style={{ padding: '15px', backgroundColor: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Type your message..." 
              style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#FFA500', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      )}

      {/* FLOATING CHAT BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          backgroundColor: '#4A3AFF', 
          color: 'white', 
          border: 'none', 
          boxShadow: '0 10px 25px rgba(74, 58, 255, 0.4)', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '28px',
          transition: 'transform 0.2s'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

    </div>
  );
}