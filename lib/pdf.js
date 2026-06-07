import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

async function fetchBuffer(src) {
  try {
    if (!src) return null;
    if (src.startsWith('data:image')) {
      return Buffer.from(src.split(',')[1], 'base64');
    }
    const r = await fetch(src);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; }
}

export async function generateNewsPDF(news, baseUrl, ads = [], reporter = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header band
      doc.rect(0, 0, 595, 80).fill('#dc2626');
      doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('IC News', 40, 25);
      doc.fontSize(11).font('Helvetica').text('Satya ki Awaaz - The Voice of Truth', 40, 58);

      doc.fillColor('black').moveDown(3);

      doc.rect(40, 100, 515, 25).fill('#000');
      doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold')
        .text(`${(news.category || '').toUpperCase()}  |  ${news.state || ''} > ${news.district || ''}  |  ${new Date(news.createdAt).toLocaleDateString('en-IN')}`, 50, 108);

      doc.fillColor('black').fontSize(20).font('Helvetica-Bold')
        .text(news.headline || '', 40, 140, { width: 515, align: 'left' });

      if (news.summary) {
        doc.moveDown(0.5).fontSize(12).font('Helvetica-Oblique').fillColor('#444')
          .text(news.summary, { width: 515, align: 'justify' });
      }

      const y = doc.y + 10;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#dc2626').lineWidth(2).stroke();

      // Split content for middle ad injection
      const paragraphs = (news.content || '').split(/\n+/).filter(Boolean);
      const middleIdx = Math.min(2, Math.floor(paragraphs.length / 2));
      const middleAd = ads.find(a => a.type === 'middle');
      const bottomAd = ads.find(a => a.type === 'bottom');

      doc.moveDown(1).fillColor('black').fontSize(11).font('Helvetica');
      for (let i = 0; i < paragraphs.length; i++) {
        doc.text(paragraphs[i], { width: 515, align: 'justify', lineGap: 3 });
        doc.moveDown(0.5);
        if (i === middleIdx) {
          // Middle ad / placeholder
          const adBuf = middleAd ? await fetchBuffer(middleAd.banner) : null;
          doc.rect(40, doc.y, 515, 90).fillAndStroke('#f5f5f5', '#dc2626');
          if (adBuf) {
            try { doc.image(adBuf, 40, doc.y - 90, { width: 515, height: 90 }); } catch {}
          } else {
            doc.fillColor('#dc2626').fontSize(14).font('Helvetica-Bold')
              .text('विज्ञापन के लिए संपर्क करें', 40, doc.y - 75, { width: 515, align: 'center' });
            doc.fillColor('#666').fontSize(10).font('Helvetica')
              .text(`Reporter: ${reporter?.name || news.reporterName || 'Reporter'}`, 40, doc.y - 50, { width: 515, align: 'center' })
              .text(`Mobile: ${reporter?.mobile || '—'}`, 40, doc.y - 35, { width: 515, align: 'center' });
          }
          doc.moveDown(7).fillColor('black').fontSize(11).font('Helvetica');
        }
      }

      // Bottom ad placeholder/banner area
      const bottomY = 700;
      const bAdBuf = bottomAd ? await fetchBuffer(bottomAd.banner) : null;
      if (bAdBuf) {
        try { doc.image(bAdBuf, 40, bottomY, { width: 515, height: 70 }); } catch {}
      } else {
        doc.rect(40, bottomY, 515, 70).fillAndStroke('#fef3c7', '#dc2626');
        doc.fillColor('#dc2626').fontSize(13).font('Helvetica-Bold')
          .text('विज्ञापन के लिए संपर्क करें', 40, bottomY + 14, { width: 515, align: 'center' });
        doc.fillColor('#666').fontSize(9).font('Helvetica')
          .text(`Contact: ${reporter?.name || news.reporterName || ''} • ${reporter?.mobile || ''}`, 40, bottomY + 38, { width: 515, align: 'center' });
      }

      // Reporter footer + QR
      const qrData = `${baseUrl}/news/${news.id}`;
      const qrPng = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
      const qrBuf = Buffer.from(qrPng.split(',')[1], 'base64');

      doc.rect(40, 790, 515, 22).fill('#000');
      doc.fillColor('#dc2626').fontSize(8).font('Helvetica-Bold')
        .text(`Reporter: ${news.reporterName || ''} | Mobile: ${reporter?.mobile || '—'} | Views: ${(news.views || 0).toLocaleString()} | indiancrimenews.in`, 50, 798);

      doc.image(qrBuf, 510, 745, { width: 40, height: 40 });

      doc.save().rotate(-30, { origin: [300, 400] })
        .fontSize(70).fillColor('#dc2626').opacity(0.06)
        .font('Helvetica-Bold').text('ICN VERIFIED', 100, 380).restore();

      doc.end();
    } catch (e) { reject(e); }
  });
}

export async function generateIDCardPDF(user, baseUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [350, 220], margin: 0 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Background
      doc.rect(0, 0, 350, 220).fill('#000');
      doc.rect(0, 0, 350, 50).fill('#dc2626');

      doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
        .text('IC News', 15, 12);
      doc.fontSize(8).font('Helvetica').text('PRESS ID CARD', 15, 32);

      // QR
      const qrPng = await QRCode.toDataURL(`${baseUrl}/reporter/${user.id}`, { width: 60, margin: 1 });
      const qrBuf = Buffer.from(qrPng.split(',')[1], 'base64');
      doc.image(qrBuf, 280, 8, { width: 50, height: 50 });

      // Body
      doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
        .text((user.name || '').toUpperCase(), 15, 70);
      doc.fontSize(9).font('Helvetica').fillColor('#dc2626')
        .text(user.designation || 'Reporter', 15, 92);

      doc.fillColor('white').fontSize(8)
        .text(`State:   ${user.state || ''}`, 15, 115)
        .text(`District: ${user.district || ''}`, 15, 130)
        .text(`Mobile:  ${user.mobile || ''}`, 15, 145)
        .text(`Code:    ${user.referralCode || ''}`, 15, 160);

      doc.fontSize(7).fillColor('#888')
        .text('VALID UNTIL: ' + new Date(Date.now() + 365 * 24 * 3600000).toLocaleDateString('en-IN'), 15, 195);

      doc.end();
    } catch (e) { reject(e); }
  });
}

export async function generateCertificatePDF(user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, layout: 'landscape' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.rect(0, 0, 842, 595).fill('#000');
      doc.rect(20, 20, 802, 555).strokeColor('#dc2626').lineWidth(4).stroke();
      doc.rect(35, 35, 772, 525).strokeColor('#dc2626').lineWidth(1).stroke();

      doc.fillColor('#dc2626').fontSize(48).font('Helvetica-Bold')
        .text('CERTIFICATE OF APPOINTMENT', 0, 90, { align: 'center', width: 842 });

      doc.fillColor('white').fontSize(14).font('Helvetica')
        .text('IC News - National Media Network', 0, 155, { align: 'center', width: 842 });

      doc.fontSize(16).text('This is to certify that', 0, 230, { align: 'center', width: 842 });

      doc.fillColor('#dc2626').fontSize(36).font('Helvetica-Bold')
        .text((user.name || '').toUpperCase(), 0, 270, { align: 'center', width: 842 });

      doc.fillColor('white').fontSize(14).font('Helvetica')
        .text(`has been appointed as ${user.designation || 'Reporter'}`, 0, 330, { align: 'center', width: 842 })
        .text(`for ${user.district || ''}, ${user.state || ''}`, 0, 355, { align: 'center', width: 842 });

      doc.fontSize(12).fillColor('#888')
        .text(`Reporter ID: ${user.referralCode || ''}`, 0, 410, { align: 'center', width: 842 })
        .text(`Issue Date: ${new Date().toLocaleDateString('en-IN')}`, 0, 430, { align: 'center', width: 842 });

      doc.fillColor('#dc2626').fontSize(20).font('Helvetica-Bold')
        .text('सच्चाई की आवाज़', 0, 490, { align: 'center', width: 842 });

      doc.end();
    } catch (e) { reject(e); }
  });
}
