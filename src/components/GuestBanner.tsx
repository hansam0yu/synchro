export default function GuestBanner() {
  return (
    <div className="guest-banner">
      <span className="guest-banner-icon">⚠</span>
      <span>
        You're using synchro as a guest — your changes won't be saved across sessions.
        Sign in via the sidebar to save your data.
      </span>
    </div>
  );
}
