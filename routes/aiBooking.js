
const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        message: 'AI is not configured. Check your .env file.'
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: 'Please enter a message.'
      });
    }

    const safeMessages = messages
      .filter(
        (item) =>
          item &&
          ['user', 'assistant'].includes(item.role) &&
          typeof item.content === 'string'
      )
      .slice(-12)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 2000)
      }));

    if (
      safeMessages.length === 0 ||
      safeMessages[safeMessages.length - 1].role !== 'user'
    ) {
      return res.status(400).json({
        message: 'Please send a customer message.'
      });
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          temperature: 0.4,
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content: `
You are LuckyBot, the friendly AI booking assistant
for Lucky Movers in Uganda.

Your job is to help customers request truck hire
and transportation services.

Collect these details:
1. Customer full name
2. Phone number
3. Email address
4. Pickup location
5. Destination
6. Pickup date
7. Required truck type
8. Description of goods
9. Offered price, if any

Rules:
- Greet customers warmly.
- Use simple English.
- Ask one question at a time.
- Accept details in any order.
- Do not repeatedly ask for details already provided.
- Do not invent prices or claim trucks are available.
- Do not claim a booking has been saved.
- Do not claim a driver has accepted a booking.
- Never ask for passwords or payment PINs.
- Summarize the details when enough information is collected.
- Ask the customer to review and confirm the details
  on the website before submitting a booking.
- If details are missing, ask for the next missing detail.
- Keep replies concise and friendly.
              `
            },
            ...safeMessages
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        'Groq error:',
        data.error?.message || response.status
      );

      return res.status(502).json({
        message: 'AI is temporarily unavailable. Please try again.'
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        message: 'The AI assistant returned no response.'
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('AI booking error:', error.message);

    return res.status(500).json({
      message: 'Something went wrong. Please try again.'
    });
  }
});

module.exports = router;

