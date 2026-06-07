import express from 'express';
import Document from '../models/Document.js';
import Timeline from '../models/Timeline.js';
import Notification from '../models/Notification.js';
import Lead from '../models/Lead.js';
import { auth } from '../middleware/auth.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();
router.use(auth);

// Upload document
router.post('/upload', upload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { title, description, leadId, companyId, category, tags } = req.body;

    const document = new Document({
      title: title || req.file.originalname,
      description,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      lead: leadId,
      company: companyId,
      uploadedBy: req.userId,
      category: category || 'other',
      tags: tags ? tags.split(',') : [],
    });

    await document.save();

    // Add document to lead if provided
    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.documents.push(document._id);
        await lead.save();

        // Create timeline entry
        await Timeline.create({
          lead: leadId,
          type: 'document_upload',
          title: 'Document uploaded',
          description: `Document "${title}" uploaded`,
          user: req.userId,
          document: document._id,
        });

        // Create notifications for lead assignee
        if (lead.assignedTo) {
          await Notification.create({
            recipient: lead.assignedTo,
            type: 'document_uploaded',
            title: 'Document Uploaded',
            message: `New document "${title}" added to lead "${lead.firstName} ${lead.lastName}"`,
            lead: leadId,
            document: document._id,
          });
        }
      }
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document,
    });
  } catch (error) {
    console.error('[v0] Upload document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('uploadedBy', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('[v0] Get document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get documents for lead
router.get('/lead/:leadId', async (req, res) => {
  try {
    const documents = await Document.find({ lead: req.params.leadId }).populate('uploadedBy', 'firstName lastName email');

    res.json(documents);
  } catch (error) {
    console.error('[v0] Get lead documents error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download document file
router.get('/file/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('[v0] Download document error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Remove from lead documents array
    if (document.lead) {
      await Lead.updateOne(
        { _id: document.lead },
        { $pull: { documents: document._id } }
      );
    }

    await Document.deleteOne({ _id: req.params.id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('[v0] Delete document error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
