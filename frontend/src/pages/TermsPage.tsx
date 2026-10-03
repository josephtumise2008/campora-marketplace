import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const TERMS_SECTIONS = [
  {
    id: "agreement",
    title: "1. The agreement",
    body: [
      "These Terms govern your use of Campora, the campus marketplace operated for students, sellers and campus partners. By creating an account, browsing the marketplace, listing a product or placing an order, you agree to these Terms.",
      "If you do not agree, do not use Campora. If you use Campora on behalf of a store or organisation, you confirm you are authorised to act for it.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and eligibility",
    body: [
      "You must be at least 18 years old to open a seller account, and you must use a campus email or a verified student identity where a store requires one. You are responsible for keeping your password safe and for activity that happens under your account.",
      "We may suspend or disable accounts that are used for fraud, harassment, resale of prohibited goods or repeated policy violations. Suspension does not erase order records you are responsible for.",
    ],
  },
  {
    id: "marketplace",
    title: "3. The marketplace",
    body: [
      "Campora is a marketplace, not a retailer. Products are listed and sold by independent stores. We do not own the inventory, set the prices, or guarantee that a listing is accurate, and we are not a party to the contract between you and a store.",
      "Sellers must have the right to sell what they list, must keep stock counts accurate, and must remove sold-out or restricted items promptly. Listings that mislead students may be removed without notice.",
    ],
  },
  {
    id: "orders",
    title: "4. Orders, delivery and cancellation",
    body: [
      "An order is an agreement between you and the store. The store confirms the order, prepares the items and delivers or hands them over according to the window shown at checkout.",
      "You may cancel while an order is Pending. After a store confirms it, contact the store directly. If an order cannot be fulfilled, the store will cancel it and any amount paid is refunded to the original payment method.",
      "Delivery windows are estimates. If an order is materially late, contact the store and then support. Repeated failures to deliver may lead to account suspension.",
    ],
  },
  {
    id: "payments",
    title: "5. Payments and fees",
    body: [
      "In this build, payments are simulated. No real card is charged, no payment processor is contacted, and no money moves between students and stores. The demo card 4242 4242 4242 4242 completes any checkout.",
      "The service fee funds campus operations including verification, moderation and support. Delivery fees are set by each store. Refunds return to the original payment method and appear on the order timeline.",
    ],
  },
  {
    id: "returns",
    title: "6. Returns and substitutions",
    body: [
      "Returns, refunds and substitutions are governed by the policy published on each store's page, and that policy is part of your agreement with that store. Where a store policy conflicts with these Terms, the store policy governs the return itself.",
      "Damaged or incorrect items should be reported within 24 hours of delivery with a photo, so the store can make it right.",
    ],
  },
  {
    id: "reviews",
    title: "7. Reviews and content",
    body: [
      "Only verified buyers can review a product. Reviews must describe your own experience. No fake reviews, no reviews for competitors, no harassment, and no content that is unlawful or defamatory.",
      "We may remove reviews that break these rules and may suspend accounts that abuse the review system.",
    ],
  },
  {
    id: "conduct",
    title: "8. Acceptable use",
    body: [
      "Do not use Campora to sell alcohol, tobacco, nicotine products, prescription medication, weapons, counterfeit goods, or anything prohibited by your campus. Do not scrape, resell data, or attempt to access other users' accounts.",
      "We may remove listings, restrict search visibility, or suspend accounts that violate this section.",
    ],
  },
  {
    id: "liability",
    title: "9. Disclaimers and liability",
    body: [
      "Campora is provided on an as-is basis for a campus marketplace demonstration. We do not warrant that listings, stock, delivery times or prices will always be accurate or available.",
      "To the extent permitted by law, our aggregate liability for any claim arising from your use of Campora is limited to the amount you actually paid for the relevant order. We are not liable for indirect or consequential losses.",
    ],
  },
  {
    id: "changes",
    title: "10. Changes to these Terms",
    body: [
      "We may update these Terms as the marketplace evolves. Material changes are announced in the app and on this page, with the updated date. Continuing to use Campora after a change means you accept the revised Terms.",
      "These Terms were last updated for the current Campora release.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="stack-lg legal">
      <header className="page-hero page-hero--compact">
        <div className="page-hero__body">
          <p className="eyebrow">Legal</p>
          <h1>Terms of use</h1>
          <p className="page-hero__lede">
            The rules of the Campora marketplace, in plain language. Questions?{" "}
            <Link to="/contact" className="link-arrow">
              Contact us
            </Link>
            .
          </p>
        </div>
      </header>

      <nav className="legal__toc" aria-label="Table of contents">
        <p className="legal__toc-title">
          <FileText size={14} aria-hidden="true" /> On this page
        </p>
        <ol>
          {TERMS_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="legal__body">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      <p className="form-note">
        See also our <Link to="/privacy">privacy notice</Link> and the{" "}
        <Link to="/help">help centre</Link>.
      </p>
    </div>
  );
}
