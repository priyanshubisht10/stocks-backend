const nodemailer = require("nodemailer");
require('dotenv').config();

async function sendEmail(emailData) {
  const { email, full_name, username, pan_number, createdat, email_type } = emailData;
    console.log(process.env.MAIL_USERNAME,process.env.MAIL_PASSWORD);
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io", 
    port: 2525, 
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  let subject, text;

  if (email_type === "welcome_mail") {
    subject = "Welcome to Our Platform!";
    text = `Hi ${full_name} (${username}),
      
Welcome to our platform! We are excited to have you on board.

Here are some details you provided:
- PAN Number: ${pan_number}
- Registration Date: ${new Date(createdat).toLocaleString()}

Thank you for registering!

Best regards,
Your App Team`;
  } else {
    subject = "Notification from Our Platform";
    text = `Hello ${full_name},
    
This is a default notification. Please contact support for further assistance.

Thank you!`;
  }

  const mailOptions = {
    from: '"Mailtrap Testing" <test@mailtrap.io>',
    to: email,
    subject: subject,
    text: text,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${email}`);
}

module.exports = { sendEmail };
