
import { useState } from 'react';

const API = 'http://localhost:3000/api';

const styles = `
.tracking-page {
  min-height: 100vh;
  background: #f4f7fb;
  color: #17263f;
  font-family: Inter, Arial, sans-serif;
}
.tracking-page * { box-sizing: border-box; }
.tracking-page button,
.tracking-page input { font: inherit; }
.tracking-header {
  padding: 18px 24px;
  background: #122744;
  color: white;
}
.tracking-header-inner {
  max-width: 1050px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}
.tracking-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  text-decoration: none;
}
.tracking-brand-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #f47738;
  font-size: 23px;
}
.tracking-brand strong { display: block; font-size: 16px; }
.tracking-brand small {
  display: block;
  margin-top: 4px;
  color: #bdcce0;
  font-size: 10px;
  letter-spacing: 1.3px;
}
.tracking-back {
  color: white;
  text-decoration: none;
  border: 1px solid #526580;
  border-radius: 9px;
  padding: 10px 13px;
  font-size: 13px;
}
.tracking-main {
  width: min(650px, calc(100% - 28px));
  margin: 55px auto;
}
.tracking-intro { text-align: center; margin-bottom: 25px; }
.tracking-eyebrow {
  display: inline-block;
  padding: 7px 11px;
  border-radius: 25px;
  background: #e4edff;
  color: #2855a0;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
}
.tracking-intro h1 {
  margin: 17px 0 12px;
  font-size: clamp(28px, 5vw, 40px);
  letter-spacing: -1px;
}
.tracking-intro p {
  margin: 0 auto;
  max-width: 480px;
  color: #738096;
  font-size: 14px;
  line-height: 1.8;
}
.tracking-card {
  padding: 27px;
  background: white;
  border: 1px solid #e6ebf2;
  border-radius: 17px;
  box-shadow: 0 14px 40px #1227440d;
}
.tracking-label {
  display: block;
  margin-bottom: 9px;
  color: #34425a;
  font-size: 13px;
  font-weight: 800;
}
.tracking-input {
  width: 100%;
  min-height: 49px;
  padding: 12px 14px;
  border: 1px solid #dce3ec;
  border-radius: 10px;
  outline: none;
  text-transform: uppercase;
}
.tracking-input:focus {
  border-color: #2f64b7;
  box-shadow: 0 0 0 3px #2f64b719;
}
.tracking-button {
  width: 100%;
  margin-top: 14px;
  padding: 14px;
  border: 0;
  border-radius: 10px;
  background: #f47738;
  color: white;
  font-weight: 800;
}
.tracking-button:disabled { opacity: .65; cursor: wait; }
.tracking-alert {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #f2c7c4;
  border-radius: 10px;
  background: #fff0ef;
  color: #a32b25;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.tracking-result {
  margin-top: 22px;
  padding: 20px;
  border: 1px solid #dce6f5;
  border-radius: 12px;
  background: #f8faff;
}
.tracking-result h2 { margin: 0 0 16px; font-size: 18px; }
.tracking-reference {
  margin: 0 0 18px;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: .5px;
  overflow-wrap: anywhere;
}
.tracking-status {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 25px;
  background: #fff0d8;
  color: #895400;
  font-size: 12px;
  font-weight: 800;
}
.tracking-status-progress { background: #e4edff; color: #2855a0; }
.tracking-status-resolved { background: #e0f6e8; color: #17653a; }
.tracking-date {
  margin: 16px 0 0;
  color: #738096;
  font-size: 12px;
}
.tracking-footer {
  padding: 24px;
  text-align: center;
  color: #738096;
  font-size: 12px;
}
.tracking-footer a { color: #2458a8; text-decoration: none; }
@media (max-width: 480px) {
  .tracking-header { padding: 14px; }
  .tracking-brand strong { font-size: 13px; }
  .tracking-brand small { font-size: 8px; }
  .tracking-brand-icon { width: 38px; height: 38px; }
  .tracking-back { padding: 9px; font-size: 11px; }
  .tracking-main { margin: 35px auto; }
  .tracking-card { padding: 19px; }
}
`;

export default function ComplaintTrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setResult(null);

    const code = trackingCode.trim().toUpperCase();

    if (!/^LM-[A-F0-9]{16}$/.test(code)) {
      setError(
        'Please enter the complete reference shown when you submitted your complaint.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/complaints/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: code }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'We could not find that complaint.'
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
        'Unable to connect to Lucky Movers. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const statusClass =
    result?.status === 'Resolved'
      ? 'tracking-status tracking-status-resolved'
      : result?.status === 'In Progress'
        ? 'tracking-status tracking-status-progress'
        : 'tracking-status';

  return (
    <div className="tracking-page">
      <style>{styles}</style>

      <header className="tracking-header">
        <div className="tracking-header-inner">
          <a className="tracking-brand" href="/">
            <span className="tracking-brand-icon" aria-hidden="true">
              🚚
            </span>
            <span>
              <strong>LM LUCKY MOVERS</strong>
              <small>TRUCK HIRE &amp; LOGISTICS</small>
            </span>
          </a>

          <a className="tracking-back" href="/complaint">
            Submit a complaint
          </a>
        </div>
      </header>

      <main className="tracking-main">
        <div className="tracking-intro">
          <span className="tracking-eyebrow">CUSTOMER SUPPORT</span>
          <h1>Track your complaint</h1>
          <p>
            Enter the tracking reference you received after submitting
            your complaint to check its latest recorded status.
          </p>
        </div>

        <section className="tracking-card">
          <form onSubmit={handleSubmit}>
            <label className="tracking-label" htmlFor="trackingCode">
              Complaint tracking reference
            </label>

            <input
              className="tracking-input"
              id="trackingCode"
              name="trackingCode"
              type="text"
              placeholder="LM-0123456789ABCDEF"
              value={trackingCode}
              onChange={(event) => {
                setTrackingCode(event.target.value.toUpperCase());
                setError('');
                setResult(null);
              }}
              maxLength={40}
              autoComplete="off"
              required
            />

            <button
              className="tracking-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Checking status…' : 'Check complaint status →'}
            </button>
          </form>

          {error && (
            <div className="tracking-alert" role="alert">
              {error}
            </div>
          )}

          {result && (
            <div className="tracking-result" role="status">
              <h2>Complaint status</h2>

              <p className="tracking-reference">
                Reference: {result.trackingCode}
              </p>

              <span className={statusClass}>
                {result.status}
              </span>

              {result.submittedAt && (
                <p className="tracking-date">
                  Submitted: {result.submittedAt}
                </p>
              )}

              <p className="tracking-date">
                This is the latest status recorded in the Lucky Movers
                system. Contact customer support if you need further help.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="tracking-footer">
        © {new Date().getFullYear()} Lucky Movers ·{' '}
        <a href="/">Home</a> ·{' '}
        <a href="/complaint">Customer support</a>
      </footer>
    </div>
  );
}
