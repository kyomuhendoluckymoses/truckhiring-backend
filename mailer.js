async function sendCustomerBookingEmail(to, subject, message) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !apiKey.startsWith('re_')) {
    console.error('Resend API key is missing or invalid.');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Lucky Movers <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`,
        to: [to],
        subject,
        text: message
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', response.status, result);
      return false;
    }

    console.log('Email accepted by Resend:', result.id);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
}



const sendVerificationCodeEmail = async (to, code) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Lucky Movers <${process.env.RESEND_FROM}>`,
        to: [to],
        subject: 'Your Verification Code - Lucky Movers',
        text: `Welcome to Lucky Movers!\n\nYour verification code is: ${code}\n\nPlease enter this code in the app to verify your account.`
      })
    });

    if (!response.ok) {
      console.error('Resend error:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

module.exports = { sendCustomerBookingEmail, sendVerificationCodeEmail };
