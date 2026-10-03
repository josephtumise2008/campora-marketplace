import { useState } from "react";
import { Camera, KeyRound, LogOut, Save, Trash2, User as UserIcon } from "lucide-react";
import { authService } from "../../services/marketplace";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useUniversity } from "../../context/UniversityContext";
import { AVATARS } from "../../data/images";
import type { User } from "../../types";
import { PageHeader } from "../../components/common/SectionHeader";
import { Avatar } from "../../components/ui/SmartImage";
import { Spinner } from "../../components/ui/Feedback";
import { cx } from "../../utils/format";

export default function AccountSettingsPage() {
  const { user, updateUser, logout, refresh } = useAuth();
  const { universities, university, setUniversity } = useUniversity();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    university: user?.university?.code || university?.code || "",
    avatar: user?.avatar || AVATARS[0],
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [prefs, setPrefs] = useState({
    orderUpdates: user?.notificationPrefs?.orderUpdates ?? true,
    deals: user?.notificationPrefs?.deals ?? true,
    priceDrops: user?.notificationPrefs?.priceDrops ?? false,
    campusDigest: user?.notificationPrefs?.campusDigest ?? true,
  });

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        bio: profile.bio.trim(),
        avatar: profile.avatar,
        university: profile.university,
      });
      updateUser({ ...user, ...updated } as User);
      if (profile.university) setUniversity(profile.university);
      toast.success("Profile updated", "Your details are saved.");
    } catch (err) {
      toast.error("We could not update your profile", err instanceof Error ? err.message : undefined);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePrefs = async () => {
    try {
      const updated = await authService.updateProfile({ notificationPrefs: prefs });
      updateUser({ ...user, ...updated } as User);
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error("We could not save those preferences", err instanceof Error ? err.message : undefined);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("Both new passwords need to match");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password updated", "Use your new password next time you log in.");
    } catch (err) {
      toast.error("We could not change your password", err instanceof Error ? err.message : undefined);
    } finally {
      setSavingPassword(false);
    }
  };

  const switchAccount = async () => {
    await refresh();
    toast.info("Session refreshed");
  };

  return (
    <div className="stack-lg">
      <PageHeader title="Settings" description="Manage your profile, campus and notification preferences." />

      <section className="panel">
        <header className="panel__head">
          <h2>
            <UserIcon size={17} aria-hidden="true" /> Profile
          </h2>
        </header>

        <div className="settings-avatar">
          <Avatar src={profile.avatar} name={profile.name || "You"} size={72} />
          <div>
            <p className="field__label">
              <Camera size={13} aria-hidden="true" /> Choose an avatar
            </p>
            <div className="avatar-picker">
              {AVATARS.slice(0, 8).map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  className={cx("avatar-picker__item", profile.avatar === avatar && "is-active")}
                  onClick={() => setProfile({ ...profile, avatar })}
                  aria-label={`Use avatar ${avatar.split("-").pop()?.replace(".jpg", "")}`}
                  aria-pressed={profile.avatar === avatar}
                >
                  <img src={avatar} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <form className="form-stack" onSubmit={saveProfile}>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Full name</span>
              <input
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                autoComplete="name"
              />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input value={user?.email || ""} disabled />
              <span className="field__hint">Email changes are disabled in this build.</span>
            </label>
            <label className="field">
              <span className="field__label">Phone</span>
              <input
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                inputMode="tel"
              />
            </label>
            <label className="field">
              <span className="field__label">Campus</span>
              <select
                value={profile.university}
                onChange={(event) => setProfile({ ...profile, university: event.target.value })}
              >
                <option value="">Not set</option>
                {universities.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.name}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </label>
            <label className="field field--wide">
              <span className="field__label">Bio</span>
              <textarea
                rows={3}
                maxLength={200}
                value={profile.bio}
                onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                placeholder="Tell campus sellers a little about you"
              />
            </label>
          </div>

          <div className="panel__actions">
            <button type="submit" className="btn btn--primary" disabled={savingProfile}>
              {savingProfile ? <Spinner size={15} /> : <Save size={15} aria-hidden="true" />}
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>Notifications</h2>
        </header>
        <ul className="preference-list">
          {[
            { key: "orderUpdates" as const, label: "Order updates", hint: "Every status change on your orders" },
            { key: "deals" as const, label: "Deals and promos", hint: "When a store you follow marks something on sale" },
            { key: "priceDrops" as const, label: "Price drops", hint: "When something in your saved list gets cheaper" },
            { key: "campusDigest" as const, label: "Weekly campus digest", hint: "A Monday round-up of what is selling nearby" },
          ].map((item) => (
            <li key={item.key}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={(event) => {
                    setPrefs({ ...prefs, [item.key]: event.target.checked });
                  }}
                />
                <span>
                  <strong>{item.label}</strong>
                  <em>{item.hint}</em>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="panel__actions">
          <button type="button" className="btn btn--primary" onClick={savePrefs}>
            <Save size={15} aria-hidden="true" />
            Save preferences
          </button>
        </div>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>
            <KeyRound size={17} aria-hidden="true" /> Password
          </h2>
        </header>
        <form className="form-stack" onSubmit={changePassword}>
          <div className="form-grid">
            <label className="field field--wide">
              <span className="field__label">Current password</span>
              <input
                type="password"
                required
                value={passwords.current}
                onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                autoComplete="current-password"
              />
            </label>
            <label className="field">
              <span className="field__label">New password</span>
              <input
                type="password"
                required
                value={passwords.next}
                onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                autoComplete="new-password"
              />
            </label>
            <label className="field">
              <span className="field__label">Confirm new password</span>
              <input
                type="password"
                required
                value={passwords.confirm}
                onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                autoComplete="new-password"
              />
            </label>
          </div>
          <div className="panel__actions">
            <button type="submit" className="btn btn--primary" disabled={savingPassword}>
              {savingPassword ? <Spinner size={15} /> : <KeyRound size={15} aria-hidden="true" />}
              Update password
            </button>
          </div>
        </form>
      </section>

      <section className="panel panel--danger">
        <header className="panel__head">
          <h2>
            <LogOut size={17} aria-hidden="true" /> Session
          </h2>
        </header>
        <p className="panel__text">
          Signed in as <strong>{user?.email}</strong>
          {user?.role ? ` as ${user.role}` : ""}. Your cart and saved items stay on this device.
        </p>
        <div className="panel__actions">
          <button type="button" className="btn btn--secondary" onClick={switchAccount}>
            Refresh session
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              logout();
              toast.info("Logged out", "See you on campus.");
            }}
          >
            <Trash2 size={15} aria-hidden="true" />
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
