

import { useState } from 'react';

const API = 'http://localhost:3000/api';

const initialForm = {
  customerName: '',
  customerPhone: '',
  subject: '',
  message: '',
};

const categories = [
  'Late delivery or arrival',
  'Driver behaviour',
  'Damaged or missing goods',
  'Payment or pricing issue',
  'Booking problem',
  'Poor customer service',
  'Other',
];

const styles = `
.complaint-page {
  min-height: 100vh;
  background: #f4f7fb;
  color: #17263f;
  font-family: Inter, Arial, sans-serif;
}
.complaint-page * { box-sizing: border-box; }
.complaint-page button,
.complaint-page input,
.complaint-page select,
.complaint-page textarea { font: inherit; }
.complaint-page button { cursor: pointer; }
.complaint-header {
  background: #122744;
  color: white;
  padding: 18px 24px;
}
.complaint-header-inner {
  max-width: 1160px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.complaint-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: white;
}
.complaint-brand-icon {
  display: grid;
  place-items: center;
  width: 45px;
  height: 45px;
  background: #f47738;
  border-radius: 12px;
  font-size: 23px;
}
.complaint-brand strong {
  display: block;
  font-size: 17px;
  letter-spacing: .4px;
}
.complaint-brand small {
  display: block;
  margin-top: 4px;
  color: #bdcce0;
  font-size: 10px;
  letter-spacing: 1.5px;
}
.complaint-back {
  color: white;
  text-decoration: none;
  border: 1px solid #526580;
  padding: 10px 15px;
  border-radius: 9px;
  font-size: 13px;
}
.complaint-back:hover { background: #203b5f; }
.complaint-hero {
  background: linear-gradient(115deg, #142b4b, #214b7a);
  color: white;
  padding: 45px 24px 76px;
}
.complaint-hero-inner {
  max-width: 960px;
  margin: auto;
}
.complaint-eyebrow {
  display: inline-block;
  padding: 7px 11px;
  background: #ffffff16;
  border: 1px solid #ffffff35;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
}
.complaint-hero h1 {
  margin: 20px 0 12px;
  max-width: 700px;
  font-size: clamp(30px, 5vw, 47px);
  line-height: 1.13;
  letter-spacing: -1.5px;
}
.complaint-hero p {
  margin: 0;
  max-width: 620px;
  color: #d9e4f3;
  font-size: 15px;
  line-height: 1.8;
}
.complaint-content {
  width: min(960px, calc(100% - 32px));
  margin: -39px auto 0;
  position: relative;
  padding-bottom: 45px;
}
.complaint-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(230px, .85fr);
  gap: 22px;
  align-items: start;
}
.complaint-card {
  background: white;
  border: 1px solid #e6ebf2;
  border-radius: 17px;
  box-shadow: 0 14px 40px #1227440d;
  overflow: hidden;
}
.complaint-form-heading {
  padding: 23px 25px;
  border-bottom: 1px solid #edf0f5;
}
.complaint-form-heading h2 {
  margin: 0;
  font-size: 21px;
  letter-spacing: -.5px;
}
.complaint-form-heading p {
  margin: 8px 0 0;
  color: #738096;
  font-size: 13px;
  line-height: 1.6;
}
.complaint-form-body { padding: 24px 25px; }
.complaint-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 19px;
}
.complaint-field label {
  color: #34425a;
  font-size: 12px;
  font-weight: 750;
}
.complaint-field input,
.complaint-field select,
.complaint-field textarea {
  width: 100%;
  min-width: 0;
  background: white;
  border: 1px solid #dce3ec;
  border-radius: 10px;
  padding: 12px 13px;
  color: #18253b;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.complaint-field input,
.complaint-field select { min-height: 46px; }
.complaint-field textarea {
  min-height: 135px;
  resize: vertical;
  line-height: 1.6;
}
.complaint-field input:focus,
.complaint-field select:focus,
.complaint-field textarea:focus {
  border-color: #2f64b7;
  box-shadow: 0 0 0 3px #2f64b719;
}
.complaint-field input::placeholder,
.complaint-field textarea::placeholder { color: #9aa5b5; }
.complaint-field small {
  color: #8490a2;
  font-size: 11px;
  line-height: 1.5;
}
.complaint-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.complaint-submit {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 14px 18px;
  background: #f47738;
  color: white;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 6px 15px #f4773828;
  transition: background .15s, transform .15s;
}
.complaint-submit:hover:not(:disabled) {
  background: #dd6128;
  transform: translateY(-1px);
}
.complaint-submit:disabled {
  opacity: .65;
  cursor: wait;
}
.complaint-privacy {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 17px;
  color: #7d899b;
  font-size: 11px;
  line-height: 1.6;
}
.complaint-side { display: grid; gap: 16px; }
.complaint-side-card {
  background: white;
  border: 1px solid #e6ebf2;
  border-radius: 15px;
  padding: 21px;
}
.complaint-side-card h3 {
  margin: 0 0 13px;
  font-size: 15px;
}
.complaint-side-card p {
  margin: 0;
  color: #738096;
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.complaint-help-item {
  display: flex;
  gap: 11px;
  margin-top: 17px;
  align-items: flex-start;
}
.complaint-help-icon {
  flex: 0 0 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: #edf3ff;
  color: #2855a0;
  border-radius: 10px;
  font-size: 16px;
}
.complaint-help-item strong {
  display: block;
  font-size: 12px;
  margin-bottom: 5px;
}
.complaint-help-item span {
  display: block;
  color: #77849a;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.complaint-contact-link {
  color: #2458a8;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.complaint-contact-link:hover { text-decoration: underline; }
.complaint-alert {
  padding: 14px 15px;
  margin-bottom: 18px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.complaint-alert-success {
  background: #eaf8ef;
  border-color: #b8e7c8;
  color: #17653a;
}
.complaint-alert-error {
  background: #fff0ef;
  border-color: #f2c7c4;
  color: #a32b25;
}
.complaint-footer {
  background: #122744;
  color: #d8e1ee;
  padding: 25px 24px;
}
.complaint-footer-inner {
  max-width: 960px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  line-height: 1.7;
}
.complaint-footer a { color: white; text-decoration: none; }
.complaint-footer a:hover { text-decoration: underline; }
@media (max-width: 720px) {
  .complaint-layout { grid-template-columns: 1fr; }
  .complaint-side { grid-template-columns: 1fr 1fr; }
  .complaint-hero { padding: 34px 20px 65px; }
  .complaint-header { padding: 14px 16px; }
  .complaint-content { width: calc(100% - 24px); }
  .complaint-form-body { padding: 19px; }
  .complaint-form-heading { padding: 20px 19px; }
}
@media (max-width: 480px) {
  .complaint-side { grid-template-columns: 1fr; }
  .complaint-row { grid-template-columns: 1fr; gap: 0; }
  .complaint-brand strong { font-size: 14px; }
  .complaint-brand small { font-size: 9px; }
  .complaint-brand-icon { width: 39px; height: 39px; }
  .complaint-back { padding: 9px 10px; font-size: 11px; }
  .complaint-hero h1 { letter-spacing: -.8px; }
}
`;

export default function ComplaintPage() {
  const [form, setForm] = useState(initialForm);
  const [category, setCategory] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
    setSent(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSent(false);

    const phone = form.customerPhone.trim();
    const phoneDigits = phone.replace(/\D/g, '');

    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      setError('Please enter a valid phone number, including your country code if needed.');
      return;
    }

    if (form.customerName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (form.subject.trim().length < 3) {
      setError('Please enter a short subject for your complaint.');
      return;
    }

    if (form.message.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`${API}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: phone,
          subject: category
            ? `${category}: ${form.subject.trim()}`
            : form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'We could not submit your complaint. Please try again.'
        );
      }

      setSent(true);
      setTrackingCode(data.trackingCode || '');
      setForm(initialForm);
      setCategory('');
    } catch (err) {
      setError(
        err.message ||
        'Unable to connect to Lucky Movers. Please check your connection and try again.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="complaint-page">
      <style>{styles}</style>

      <header className="complaint-header">
        <div className="complaint-header-inner">
          <a className="complaint-brand" href="/" aria-label="Lucky Movers home">
            <span className="complaint-brand-icon" aria-hidden="true">🚚</span>
            <span>
              <strong>LM LUCKY MOVERS</strong>
              <small>TRUCK HIRE &amp; LOGISTICS</small>
            </span>
          </a>
          <a className="complaint-back" href="/">← Back to Home</a>
        </div>
      </header>

      <section className="complaint-hero">
        <div className="complaint-hero-inner">
          <span className="complaint-eyebrow">CUSTOMER CARE</span>
          <h1>We're here to help.</h1>
          <p>
            Your experience matters to us. Tell us about a problem with
            your booking, delivery, driver, or payment so our team can
            review your concerns.
          </p>
        </div>
      </section>

      <main className="complaint-content">
        <div className="complaint-layout">
          <section className="complaint-card">
            <div className="complaint-form-heading">
              <h2>Submit a complaint</h2>
              <p>
                Complete the form below. Please provide accurate details
                to help us understand what happened.
              </p>
            </div>

            <div className="complaint-form-body">
              {sent && (
                <div className="complaint-alert complaint-alert-success" role="status">
                  <strong>Complaint submitted successfully!</strong>
                  <p>
                    Thank you for contacting Lucky Movers. We have received
                    your complaint.
                  </p>

                  {trackingCode ? (
                    <>
                      <p><strong>Your complaint tracking reference:</strong></p>
                      <p style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        overflowWrap: 'anywhere',
                      }}>
                        {trackingCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(trackingCode).catch(() => {
                            setError('Please copy your tracking reference manually.');
                          });
                        }}
                        style={{
                          padding: '9px 13px',
                          border: '1px solid #17653a',
                          borderRadius: '7px',
                          background: '#ffffff',
                          color: '#17653a',
                          fontWeight: 700,
                        }}
                      >
                        Copy tracking reference
                      </button>
                      <p>
                        Keep this reference safe. You will need it to check
                        your complaint status.
                      </p>
                      <a
                        href="/track-complaint"
                        style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          color: '#17653a',
                          fontWeight: 800,
                        }}
                      >
                        Track your complaint →
                      </a>
                    </>
                  ) : (
                    <p>
                      Your complaint was submitted, but the tracking reference
                      was not returned. Please contact our support team.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="complaint-alert complaint-alert-error" role="alert">
                  <strong>Unable to submit</strong>
                  <br />
                  {error}
                </div>
              )}

              {!sent && (
              <form onSubmit={handleSubmit}>
                <div className="complaint-field">
                  <label htmlFor="customerName">Full name *</label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.customerName}
                    onChange={handleChange}
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="complaint-row">
                  <div className="complaint-field">
                    <label htmlFor="customerPhone">Phone number *</label>
                    <input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      placeholder="+256 7XX XXX XXX"
                      value={form.customerPhone}
                      onChange={handleChange}
                      autoComplete="tel"
                      maxLength={20}
                      required
                    />
                    <small>Include your country code if possible.</small>
                  </div>

                  <div className="complaint-field">
                    <label htmlFor="category">Complaint category</label>
                    <select
                      id="category"
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        setSent(false);
                      }}
                    >
                      <option value="">Select a category</option>
                      {categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <small>Choose the category that best fits your issue.</small>
                  </div>
                </div>

                <div className="complaint-field">
                  <label htmlFor="subject">Complaint subject *</label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="e.g. My delivery arrived late"
                    value={form.subject}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="complaint-field">
                  <label htmlFor="message">Describe what happened *</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Please tell us what happened, when it happened, and how we can help..."
                    value={form.message}
                    onChange={handleChange}
                    minLength={10}
                    maxLength={3000}
                    required
                  />
                  <small>
                    Include relevant booking details, dates, and locations.
                    Avoid sharing passwords or bank PINs.
                    <span style={{ float: 'right' }}>
                      {form.message.length}/3000
                    </span>
                  </small>
                </div>

                <button
                  className="complaint-submit"
                  type="submit"
                  disabled={sending}
                >
                  {sending ? 'Submitting your complaint…' : 'Submit complaint →'}
                </button>

                <div className="complaint-privacy">
                  <span aria-hidden="true">🔒</span>
                  <span>
                    Your information is submitted to Lucky Movers for
                    complaint handling. Please provide only information
                    relevant to your concern.
                  </span>
                </div>
              </form>
              )}

              {sent && (
                <button
                  type="button"
                  className="complaint-submit"
                  onClick={() => {
                    setForm(initialForm);
                    setCategory('');
                    setSent(false);
                    setTrackingCode('');
                    setError('');
                  }}
                >
                  Submit Another Complaint →
                </button>
              )}
            </div>
          </section>

          <aside className="complaint-side">
            <section className="complaint-side-card">
              <h3>What happens next?</h3>
              <p>
                We use the information you provide to understand your
                concern and determine the next steps.
              </p>

              <div className="complaint-help-item">
                <div className="complaint-help-icon">01</div>
                <div>
                  <strong>We receive your message</strong>
                  <span>Your complaint is sent to our support system.</span>
                </div>
              </div>

              <div className="complaint-help-item">
                <div className="complaint-help-icon">02</div>
                <div>
                  <strong>We review the issue</strong>
                  <span>Our team can investigate the details you provide.</span>
                </div>
              </div>

              <div className="complaint-help-item">
                <div className="complaint-help-icon">03</div>
                <div>
                  <strong>We follow up</strong>
                  <span>We may contact you using the phone number you supplied.</span>
                </div>
              </div>
            </section>

            <section className="complaint-side-card">
              <h3>Need assistance?</h3>
              <p>
                For urgent transport enquiries, contact Lucky Movers
                directly using the details below.
              </p>

              <div className="complaint-help-item">
                <div className="complaint-help-icon">☎</div>
                <div>
                  <strong>Call us</strong>
                  <span>
                    <a className="complaint-contact-link" href="tel:+256742502154">
                      +256 742 502 154
                    </a>
                  </span>
                </div>
              </div>

              <div className="complaint-help-item">
                <div className="complaint-help-icon">✉</div>
                <div>
                  <strong>Email us</strong>
                  <span>
                    <a className="complaint-contact-link" href="mailto:info@luckymovers.ug">
                      info@luckymovers.ug
                    </a>
                  </span>
                </div>
              </div>

              <div className="complaint-help-item">
                <div className="complaint-help-icon">⌖</div>
                <div>
                  <strong>Location</strong>
                  <span>Kampala, Uganda</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="complaint-footer">
        <div className="complaint-footer-inner">
          <span>© {new Date().getFullYear()} Lucky Movers. All rights reserved.</span>
          <span>
            <a href="/">Home</a>
            {' · '}
            <a href="/book">Book a truck</a>
            {' · '}
            <a href="/track-complaint">Track complaint</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
