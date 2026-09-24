import nodemailer from "nodemailer";

const escapeHtml = value => String(value ?? "").replace(/[&<>"\']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "\'": "&#39;" }[char]));

let transporter;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return transporter;
};

export const sendBookingEmail = async ({ to, name, booking, paid = false }) => {
  const mailer = getTransporter();
  if (!mailer || !to) return false;
  const hotelName = escapeHtml(booking.hotel?.name || "QuickStay Hotel");
  const roomName = escapeHtml(booking.room?.roomType || "Room");
  const safeName = escapeHtml(name || "Guest");
  const safeStatus = escapeHtml(booking.status);
  const subject = paid ? `Booking confirmed — ${hotelName}` : `Booking received — ${hotelName}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2>${paid ? "Your booking is confirmed" : "Your booking has been received"}</h2>
      <p>Hello ${safeName},</p>
      <p>${paid ? "Your payment was verified successfully." : "We received your booking request."}</p>
      <p><strong>Hotel:</strong> ${hotelName}<br>
      <strong>Room:</strong> ${roomName}<br>
      <strong>Check-in:</strong> ${new Date(booking.checkInDate).toDateString()}<br>
      <strong>Check-out:</strong> ${new Date(booking.checkOutDate).toDateString()}<br>
      <strong>Guests:</strong> ${booking.guests}<br>
      <strong>Total:</strong> ${booking.totalPrice}<br>
      <strong>Status:</strong> ${safeStatus}</p>
      <p>Thank you for choosing QuickStay.</p>
    </div>`;
  await mailer.sendMail({ from: process.env.SENDER_EMAIL || process.env.SMTP_USER, to, subject, html });
  return true;
};
