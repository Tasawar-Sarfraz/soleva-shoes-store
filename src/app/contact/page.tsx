import { getSettings } from "@/server/store";
import { ContactForm } from "@/components/contact-form";
export const metadata = { title: "Contact the atelier" };
export default function ContactPage() {
  const config = getSettings();
  return (
    <div className="section">
      <div className="page-heading">
        <span className="eyebrow">A CONVERSATION STARTS HERE</span>
        <h1>Hello, from the atelier.</h1>
        <p>Questions about a design, an order, or your next move?</p>
      </div>
      <div className="contact-layout">
        <div>
          <h2>Let’s talk.</h2>
          <p>
            Our contact form saves your enquiry to the database, where the store
            administrator can read it.
          </p>
          <p className="small muted">
            The default contact details below are fictional. They can be
            replaced in administration settings. No email or SMS provider is
            connected.
          </p>
          <a className="contact-link" href={`mailto:${config.email}`}>
            {config.email} ↗
          </a>
          <a
            className="contact-link"
            href={`tel:${config.phone.replaceAll(" ", "")}`}
          >
            {config.phone}
          </a>
          <p>{config.address}</p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
