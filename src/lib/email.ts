import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const FROM_EMAIL = "orders@createandsource.com";
const FROM_NAME = "Create & Source";

// Order confirmation email to employee
export async function sendOrderConfirmation(params: {
  to: string;
  employeeName: string;
  storeName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; size: string; color: string; price: number }>;
  total: number;
  shippingAddress: { name: string; line1: string; city: string; state: string; zip: string };
}) {
  const { to, employeeName, storeName, orderId, items, total, shippingAddress } = params;

  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #F5F2EE;">${i.name}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #F5F2EE; color: #7A6A5B;">${i.color} / ${i.size}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #F5F2EE; text-align: center;">${i.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #F5F2EE; text-align: right; font-weight: 600;">$${((i.price * i.quantity) / 100).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Order Confirmed — ${storeName}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #000;">
          <!-- Header -->
          <div style="background: #000; padding: 24px 32px; text-align: center;">
            <p style="color: #C4A882; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;">
              ${storeName}
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 32px;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Order Confirmed</h1>
            <p style="color: #7A6A5B; font-size: 14px; margin: 0 0 32px;">
              Thanks ${employeeName}! Your merch is on its way to production.
            </p>

            <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B; margin: 0 0 8px;">
              Order #${orderId.slice(0, 8)}
            </p>

            <!-- Items -->
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0 24px;">
              <thead>
                <tr style="border-bottom: 2px solid #000;">
                  <th style="text-align: left; padding: 8px 0; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B;">Item</th>
                  <th style="text-align: left; padding: 8px 0; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B;">Details</th>
                  <th style="text-align: center; padding: 8px 0; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B;">Qty</th>
                  <th style="text-align: right; padding: 8px 0; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <!-- Total -->
            <div style="text-align: right; padding: 16px 0; border-top: 2px solid #000;">
              <span style="font-size: 12px; color: #7A6A5B; text-transform: uppercase; letter-spacing: 0.1em;">Total</span>
              <span style="font-size: 20px; font-weight: 700; margin-left: 16px;">$${(total / 100).toFixed(2)}</span>
            </div>

            <!-- Shipping -->
            <div style="background: #F5F2EE; padding: 20px; margin: 24px 0;">
              <p style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B; margin: 0 0 8px;">Shipping To</p>
              <p style="margin: 0; font-size: 14px;">${shippingAddress.name}</p>
              <p style="margin: 0; font-size: 14px; color: #7A6A5B;">${shippingAddress.line1}</p>
              <p style="margin: 0; font-size: 14px; color: #7A6A5B;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
            </div>

            <p style="color: #7A6A5B; font-size: 13px; line-height: 1.6;">
              We'll send you another email with tracking info once your order ships.
              Most orders ship within 5-7 business days.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #000; padding: 20px 32px; text-align: center;">
            <p style="color: #7A6A5B; font-size: 11px; margin: 0;">
              Powered by <span style="color: #C4A882;">Create & Source</span>
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("Email send failed:", e);
    return false;
  }
}

// Shipping notification with tracking
export async function sendShippingNotification(params: {
  to: string;
  employeeName: string;
  storeName: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl: string | null;
  carrier: string;
}) {
  const { to, employeeName, storeName, orderId, trackingNumber, trackingUrl, carrier } = params;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Your Order Has Shipped — ${storeName}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #000;">
          <div style="background: #000; padding: 24px 32px; text-align: center;">
            <p style="color: #C4A882; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;">${storeName}</p>
          </div>

          <div style="padding: 40px 32px;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Your Order Has Shipped!</h1>
            <p style="color: #7A6A5B; font-size: 14px; margin: 0 0 32px;">
              ${employeeName}, your merch is on its way.
            </p>

            <div style="background: #F5F2EE; padding: 24px; text-align: center; margin: 0 0 24px;">
              <p style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7A6A5B; margin: 0 0 12px;">Tracking Number</p>
              ${trackingUrl
                ? `<a href="${trackingUrl}" style="font-size: 18px; font-weight: 700; color: #000; text-decoration: none; border-bottom: 2px solid #C4A882;">${trackingNumber}</a>`
                : `<p style="font-size: 18px; font-weight: 700; margin: 0;">${trackingNumber}</p>`
              }
              <p style="font-size: 12px; color: #7A6A5B; margin: 8px 0 0; text-transform: uppercase;">${carrier}</p>
            </div>

            <p style="font-size: 11px; color: #7A6A5B; margin: 0;">Order #${orderId.slice(0, 8)}</p>
          </div>

          <div style="background: #000; padding: 20px 32px; text-align: center;">
            <p style="color: #7A6A5B; font-size: 11px; margin: 0;">Powered by <span style="color: #C4A882;">Create & Source</span></p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("Shipping email failed:", e);
    return false;
  }
}

// Credit assignment notification
export async function sendCreditNotification(params: {
  to: string;
  employeeName: string;
  storeName: string;
  amount: number;
  reason: string;
  storeUrl: string;
}) {
  const { to, employeeName, storeName, amount, reason, storeUrl } = params;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `You've received $${(amount / 100).toFixed(2)} in merch credits — ${storeName}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #000;">
          <div style="background: #000; padding: 24px 32px; text-align: center;">
            <p style="color: #C4A882; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;">${storeName}</p>
          </div>

          <div style="padding: 40px 32px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">You Got Merch Credits!</h1>
            <p style="color: #7A6A5B; font-size: 14px; margin: 0 0 32px;">
              ${employeeName}, your company just loaded credits to your account.
            </p>

            <div style="background: #F5F2EE; padding: 32px; margin: 0 0 24px;">
              <p style="font-size: 42px; font-weight: 700; margin: 0;">$${(amount / 100).toFixed(2)}</p>
              <p style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #7A6A5B; margin: 8px 0 0;">${reason}</p>
            </div>

            <a href="${storeUrl}" style="display: inline-block; background: #000; color: #fff; padding: 16px 40px; text-decoration: none; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">
              Shop Now
            </a>
          </div>

          <div style="background: #000; padding: 20px 32px; text-align: center;">
            <p style="color: #7A6A5B; font-size: 11px; margin: 0;">Powered by <span style="color: #C4A882;">Create & Source</span></p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error("Credit email failed:", e);
    return false;
  }
}
