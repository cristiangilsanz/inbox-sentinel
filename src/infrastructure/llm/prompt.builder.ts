import { CATEGORY_DEFINITIONS, CATEGORY_NAMES } from '../../domain/categories.js';
import { EmailMessage } from '../../domain/types.js';

export class PromptBuilder {
  // Build classification prompt with taxonomy and operative rules
  static buildClassificationPrompt(email: EmailMessage, needsJsonInstruction: boolean = false): string {
    const categoryDescriptions = CATEGORY_DEFINITIONS.map(
      (c) => `- **${c.name}**: ${c.description}`
    ).join('\n');
    const categoryNames = CATEGORY_NAMES.join(', ');

    let prompt = `You are a high-precision executive email classification engine. Your task is to analyze the email below and classify it into EXACTLY ONE category from this mutually exclusive taxonomy:

${categoryDescriptions}

=== OPERATIVE CLASSIFICATION RULES & BOUNDARIES ===

1. SHOPPING & COURIER LOGISTICS (CRITICAL PRIORITY):
   Classify as Shopping ANY communication involving:
   - Physical or digital consumer goods purchases, e-commerce orders, checkout confirmations, and delivery updates (e.g. Amazon, AliExpress, Zara, Shein, eBay, El Corte Inglés, Apple Store, supermarkets).
   - Package tracking, parcel couriers, and postal logistics across all European and global carriers:
     * Couriers: Correos, Correos Express, SEUR, MRW, GLS, DHL, UPS, FedEx, Paack, CTT Express, InPost, Nacex, Boyacá, Amazon Logistics / Delivery, DPD, Hermes, Mondial Relay, Cainiao.
     * Core terms & actions (Spanish & English): "seguimiento de envío", "localizador", "número de seguimiento", "número de envío", "tu paquete está en camino", "en reparto", "ha salido del almacén", "entregado", "intento de entrega", "punto de recogida", "Citypaq", "Locker", "oficina de Correos", "albarán", "package tracking", "out for delivery", "shipped", "order dispatched", "delivery attempt", "parcel locker".
   - Retail purchase receipts, order summaries, return requests, and refund confirmations for consumer goods.

2. FINANCE VS. SHOPPING DISAMBIGUATION:
   - Consumer goods orders that mention a price, order total, or invoice belong to SHOPPING, NOT Finance.
   - Classify as FINANCE ONLY:
     * Monetary institutions, banks (BBVA, Santander, CaixaBank, Revolut, N26, Wise, Sabadell, ING, Bankinter).
     * Fiscal authorities and tax filings (Agencia Tributaria / AEAT, IRS, Hacienda).
     * Bank account movements, wire transfers, credit/debit card alerts, loan/mortgage statements.
     * Investment brokerages, crypto exchanges, and merchant payment processing payouts (Stripe, PayPal account balances).
     * Recurring essential utility bills (electricity, water, natural gas, home internet/telecom contracts: Iberdrola, Endesa, Naturgy, Movistar, Vodafone, Orange).

3. CAREER & DEVELOPER INFRASTRUCTURE:
   - Employment recruiting, job listings, interview coordination, and professional networks (LinkedIn).
   - Software engineering, developer toolchains, and hosting infrastructure: GitHub, GitLab, Docker, AWS, GCP, Vercel, Supabase, Cloudflare, Datadog, Sentry.
   - Workplace collaboration, business contracts, payroll, and B2B SaaS operations.

4. WELLNESS & HEALTHCARE:
   - Medical clinics, doctors, dentists, clinical appointments, laboratory test results, hospital portals, health insurance authorizations (Sanitas, Adeslas, DKV, Asisa), pharmacy prescriptions, and biometric fitness tracking (Strava, Garmin).

5. ENTERTAINMENT & LEISURE:
   - Spectator tickets (cinema, theater, live concerts, festivals), digital streaming entertainment (Netflix, Spotify, HBO/Max, Disney+, YouTube Premium), and video gaming services (Steam, PlayStation, Nintendo, Xbox).

6. ADMINISTRATION & CIVIC GOVERNANCE:
   - Government notifications, public records, digital certificates (FNMT, Cl@ve, DGT, Seguridad Social), municipal taxes (IBI, padrón), legal agreements, and corporate terms of service / privacy policy updates.

7. EDUCATION & PEDAGOGY:
   - Academic universities, schools, structured learning curricula, online education platforms (Coursera, Udemy, edX), student registries, and certification exams.

8. TRAVEL & PASSENGER TRANSIT:
   - Passenger transit tickets (airlines: Iberia, Ryanair, Vueling; railways: Renfe, Ouigo, Iryo; buses: Alsa), lodging bookings (Booking.com, Airbnb), vehicle rentals, and boarding passes.

9. MISC (STRICT RESIDUAL FALLBACK ONLY):
   - Use Misc ONLY when an email is a completely generic multi-topic digest, ambiguous broadcast, or system alert entirely devoid of an identifiable domain.
   - MANDATORY RESTRICTION: NEVER classify as Misc if the email mentions order numbers, package tracking, couriers, shipments, purchases, travel bookings, job alerts, or medical appointments.

=== TAXONOMY INTEGRITY & ENFORCEMENT ===
- Output exactly ONE category from: ${categoryNames}.
- Output a factual, high-density 1-sentence summary identifying the merchant/courier/organization, locator/tracking IDs, items or amounts, and current delivery/action status.`;

    if (needsJsonInstruction) {
      prompt += `\n\nReturn strictly valid JSON adhering to: { "category": "CategoryName", "summary": "One sentence summary" }. Do not add markdown fences or auxiliary prose.`;
    }

    prompt += `\n\n=== INCOMING EMAIL METADATA & CONTENT ===
SENDER: ${email.from}${email.to ? `\nTO: ${email.to}` : ''}${email.replyTo ? `\nREPLY-TO: ${email.replyTo}` : ''}${email.listId ? `\nLIST-ID: ${email.listId}` : ''}
SUBJECT: ${email.subject}${email.date ? `\nDATE: ${email.date}` : ''}

BODY CONTENT:
${email.bodySnippet}
=========================================`;

    return prompt;
  }
}
