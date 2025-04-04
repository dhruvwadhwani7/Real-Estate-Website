const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'urbanscale.info@gmail.com',
        pass: 'csfy vycr nmgq fhqv' // Use app-specific password
    }
});

router.post('/share-property', async (req, res) => {
    const { senderName, senderEmail, message, propertyDetails } = req.body;

    // Validate required fields
    if (!senderName || !senderEmail || !propertyDetails) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const htmlContent = `
        <h2>Property Sharing Request</h2>
        <p>From: ${senderName} (${senderEmail})</p>
        <p>Message: ${message || 'No additional message'}</p>
        <h3>Property Details:</h3>
        <div style="margin: 20px 0;">
            <img src="${propertyDetails.imageUrl}" alt="Property Image" style="max-width: 300px; display: block; margin-bottom: 15px;">
            <p><strong>Property ID:</strong> ${propertyDetails.id}</p>
            <p><strong>Type:</strong> ${propertyDetails.type}</p>
            <p><strong>Location:</strong> ${propertyDetails.location}</p>
            <p><strong>Price:</strong> ₹${propertyDetails.price.toLocaleString('en-IN')}</p>
            <p><strong>Description:</strong> ${propertyDetails.description}</p>
        </div>
        <p>View more details on our website.</p>
    `;

    const mailOptions = {
        from: 'urbanscale.info@gmail.com',
        to: 'urbanscale.info@gmail.com',
        subject: `Property Inquiry from ${senderName}`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', mailOptions.to);
        res.json({ 
            success: true, 
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending email: ' + error.message 
        });
    }
});

router.post('/share-club', async (req, res) => {
    const { senderName, senderEmail, message, clubDetails } = req.body;

    if (!senderName || !senderEmail || !clubDetails) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const htmlContent = `
        <h2>Club Sharing Request</h2>
        <p>From: ${senderName} (${senderEmail})</p>
        <p>Message: ${message || 'No additional message'}</p>
        <h3>Club Details:</h3>
        <div style="margin: 20px 0;">
            <img src="${clubDetails.mainImage}" alt="Club Image" style="max-width: 300px; display: block; margin-bottom: 15px;">
            <p><strong>Club Name:</strong> ${clubDetails.name}</p>
            <p><strong>Type:</strong> ${clubDetails.type}</p>
            <p><strong>Description:</strong> ${clubDetails.description}</p>
            <p><strong>Operating Hours:</strong> ${clubDetails.operatingHours}</p>
            
            <h4>Facilities:</h4>
            <ul>
                ${Object.entries(clubDetails.facilities)
                    .map(([name, desc]) => `<li><strong>${name}:</strong> ${desc}</li>`)
                    .join('')}
            </ul>
            
            <h4>Services:</h4>
            <ul>
                ${clubDetails.services.map(service => `<li>${service}</li>`).join('')}
            </ul>
        </div>
        <p>View more details on our website.</p>
    `;

    const mailOptions = {
        from: 'urbanscale.info@gmail.com',
        to: 'urbanscale.info@gmail.com',
        subject: `Club Inquiry: ${clubDetails.name}`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ 
            success: true, 
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending email: ' + error.message 
        });
    }
});

module.exports = router;
