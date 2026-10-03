import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";

const SECTIONS = [
  {
    id: "collect",
    title: "1. What we collect",
    body: [
      "Account data: your name, email, campus, phone number and an optional bio. If you sell, we also collect your business name and the contact details you publish on your store page.",
      "Order data: the items you buy, the delivery address you choose, the delivery method, your order notes and the status history of the order. Payment details are never stored — payments are simulated, and only the card brand and last four digits are kept for display.",
      "Usage data: searches you run, products and stores you save, pages you visit and basic device information such as browser type. We use this to keep search relevant and to spot abuse.",
    ],
  },
  {
    id: "use",
    title: "2. Why we use it",
    body: [
      "To run the marketplace: process orders, arrange deliveries, show your order history, and let sellers fulfil what you bought.",
      "To keep Campora safe: verify stores, moderate reviews, investigate fraud and enforce the terms of use.",
      "To improve the product: understand which categories sell on which campus, fix broken flows and reduce search friction.",
      "We do not sell your personal data, and we do not share it with advertisers.",
    ],
  },
  {
    id: "sharing",
    title: "3. Who sees what",
    body: [
      "The store fulfilling your order sees your name, the items ordered and the delivery address — that is the minimum needed to hand the order over.",
      "Other stores see that you are a shopper on a campus, never your orders, addresses or saved items.",
      "Campora administrators can access account and order records to operate the marketplace, moderate content and resolve disputes.",
      "We do not share data with third-party advertisers or data brokers. If we ever needed to share data with a service provider, we would name them here first.",
    ],
  },
  {
    id: "retention",
    title: "4. How long we keep it",
    body: [
      "Order records are kept for as long as your account exists, because they are your receipts and the store's fulfilment record.",
      "Saved items, recent searches and notification preferences are kept until you clear them or close your account.",
      "When you delete your account, we remove your addresses, saved items and searches within 30 days. Order records required for campus tax and dispute handling are retained in a de-identified form.",
    ],
  },
  {
    id: "security",
    title: "5. Security",
    body: [
      "Passwords are hashed before storage and never sent to the browser again. Sessions use a bearer token kept in your browser's local storage on this device.",
      "Because this build runs entirely on your machine with no external services, there is no third-party analytics, advertising or payment SDK collecting data behind the scenes.",
      "No system is perfect. If you suspect unauthorised access, change your password in Settings and contact us.",
    ],
  },
  {
    id: "rights",
    title: "6. Your rights",
    body: [
      "You can see and edit your profile, addresses, notification preferences and saved items at any time from Account settings.",
      "You can export your data by emailing privacy@campora.market from your account address, and you can request deletion of your account entirely.",
      "You can withdraw store data you published — for example a store bio or contact number — at any time by editing your store page.",
    ],
  },
  {
    id: "cookies",
    title: "7. Local storage, not tracking cookies",
    body: [
      "Campora uses your browser's local storage rather than advertising cookies. We store your auth token, your selected campus, your cart and your recent searches on this device.",
      "Clearing your browser storage signs you out and empties the local cart. Nothing about you is shared across devices except the account data stored on the server.",
    ],
  },
  {
    id: "changes",
    title: "8. Changes",
    body: [
      "If this notice changes materially, we announce it in the app and update this page. Continuing to use Campora after a change means you accept the revised notice.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="stack-lg legal">
      <header className="page-hero page-hero--compact">
        <div className="page-hero__body">
          <p className="eyebrow">Legal</p>
          <h1>Privacy notice</h1>
          <p className="page-hero__lede">
            What Campora stores, why we store it, and what you can do about it. Short version: we only keep
            what the marketplace needs.
          </p>
          <p className="page-hero__badges">
            <span className="badge badge--success">
              <ShieldCheck size={12} aria-hidden="true" /> No ad trackers
            </span>
            <span className="badge badge--success">
              <Lock size={12} aria-hidden="true" /> No third-party sharing
            </span>
          </p>
        </div>
      </header>

      <nav className="legal__toc" aria-label="Table of contents">
        <p className="legal__toc-title">
          <ShieldCheck size={14} aria-hidden="true" /> On this page
        </p>
        <ol>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="legal__body">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      <p className="form-note">
        Questions about your data? <Link to="/contact">Contact our team</Link> or read the{" "}
        <Link to="/terms">terms of use</Link>.
      </p>
    </div>
  );
}
