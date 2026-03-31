const nodemailer = require('nodemailer');

// Create Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your SMTP provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send Booking Confirmation Email
 * @param {Object} booking - Booking data from request/DB
 */
const sendBookingEmail = async (booking) => {
    // If credentials aren't set, skip but log it
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.warn('Email notification skipped: Credentials not configured in .env');
        return;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: booking.email || process.env.ADMIN_EMAIL, // Send to customer if email exists, otherwise admin
            subject: `Booking Confirmation: ${booking.pickupLocation} to ${booking.dropLocation}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #d4af37; text-align: center;">Booking Confirmation</h2>
                    <p>Hello <strong>${booking.name}</strong>,</p>
                    <p>Thank you for choosing <strong>King Taxiwala Travels</strong>. Your booking request has been received.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 10px; border: 1px solid #eee;"><strong>Pickup Location</strong></td>
                            <td style="padding: 10px; border: 1px solid #eee;">${booking.pickupLocation}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee;"><strong>Drop Location</strong></td>
                            <td style="padding: 10px; border: 1px solid #eee;">${booking.dropLocation}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 10px; border: 1px solid #eee;"><strong>Travel Date</strong></td>
                            <td style="padding: 10px; border: 1px solid #eee;">${booking.travelDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #eee;"><strong>Pickup Time</strong></td>
                            <td style="padding: 10px; border: 1px solid #eee;">${booking.pickupTime}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 10px; border: 1px solid #eee;"><strong>Vehicle Type</strong></td>
                            <td style="padding: 10px; border: 1px solid #eee;">${booking.vehicleType}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px;">We will contact you shortly to finalize your trip. For immediate assistance, please call us at <a href="tel:+919642095559">+91 96420 95559</a>.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="text-align: center; color: #888; font-size: 0.8rem;">King Taxiwala Travels - Vijayawada, AP</p>
                </div>
            `
        };

        // Also send a copy to Admin
        const adminOptions = {
            ...mailOptions,
            to: process.env.ADMIN_EMAIL,
            subject: `NEW BOOKING ALERT: ${booking.name} - ${booking.pickupLocation}`
        };

        await transporter.sendMail(mailOptions);
        await transporter.sendMail(adminOptions);
        console.log('Booking emails sent successfully.');
    } catch (error) {
        console.error('Error sending booking emails:', error.message);
    }
};

module.exports = { sendBookingEmail };
