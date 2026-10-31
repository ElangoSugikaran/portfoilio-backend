import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { AuthController } from '../../modules/auth/controller.js';
import { updatePasswordSchema, updateProfileSchema } from '../../modules/auth/schema.js';
import { SkillsController } from '../../modules/skills/controller.js';
import { createSkillSchema, updateSkillSchema, skillParamSchema } from '../../modules/skills/schema.js';
import { ExperienceController } from '../../modules/experience/controller.js';
import { createExperienceSchema, updateExperienceSchema, experienceParamSchema } from '../../modules/experience/schema.js';
import { CertificatesController } from '../../modules/certificates/controller.js';
import { createCertificateSchema, updateCertificateSchema, certificateParamSchema } from '../../modules/certificates/schema.js';
import { ProjectController } from '../../modules/project/controller.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamSchema,
  projectListQuerySchema,
} from '../../modules/project/schema.js';
import { SettingsController } from '../../modules/settings/controller.js';
import { updateSettingsSchema } from '../../modules/settings/schema.js';
import { AboutController } from '../../modules/about/controller.js';
import { updateAboutSchema } from '../../modules/about/schema.js';
import { MediaController } from '../../modules/media/controller.js';
import { deleteMediaParamsSchema } from '../../modules/media/schema.js';
import { EducationController } from '../../modules/education/controller.js';
import {
  createEducationSchema,
  updateEducationSchema,
  educationParamSchema,
  reorderEducationSchema,
  educationListQuerySchema,
} from '../../modules/education/schema.js';
import { MessageController } from '../../modules/messages/controller.js';
import { updateMessageSchema, messageParamSchema } from '../../modules/messages/schema.js';
import { DashboardController } from '../../modules/dashboard/controller.js';
import { CvController } from '../../modules/cv/controller.js';
import { cvParamSchema } from '../../modules/cv/schema.js';

/**
 * Dedicated admin API router.
 * Mounted at /api/v1/admin. The authentication hook is registered once here
 * so a new admin route cannot accidentally be left unprotected.
 */
export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preValidation', app.authenticate);

  const authController = new AuthController(app);
  const skillsController = new SkillsController(app);
  const experienceController = new ExperienceController(app);
  const certificatesController = new CertificatesController(app);
  const projectController = new ProjectController(app);
  const settingsController = new SettingsController(app);
  const aboutController = new AboutController(app);
  const mediaController = new MediaController(app);
  const educationController = new EducationController(app);
  const messageController = new MessageController(app);
  const dashboardController = new DashboardController(app);
  const cvController = new CvController(app);

  // ── Auth ─────────────────────────────────────────────────────────────
  app.get('/auth/profile', {
    schema: { tags: ['Admin Auth'], summary: 'Get current admin profile' },
  }, authController.getProfile);

  app.get('/auth/me', {
    schema: { tags: ['Admin Auth'], summary: 'Alias for /auth/profile' },
  }, authController.getProfile);

  app.put('/auth/password', {
    schema: {
      tags: ['Admin Auth'],
      summary: 'Update admin password',
      body: updatePasswordSchema,
    },
  }, authController.updatePassword);

  app.put('/auth/profile', {
    schema: {
      tags: ['Admin Auth'],
      summary: 'Update admin profile information',
      body: updateProfileSchema,
    },
  }, authController.updateProfile);

  // ── Skills / technologies ────────────────────────────────────────────
  app.get('/skills', {
    schema: { tags: ['Admin Skills'], summary: 'Get all skills / technologies' },
  }, skillsController.getAll);

  app.get('/skills/:id', {
    schema: { tags: ['Admin Skills'], summary: 'Get a skill by ID', params: skillParamSchema },
  }, skillsController.getById);

  app.post('/skills', {
    schema: { tags: ['Admin Skills'], summary: 'Create a skill', body: createSkillSchema },
  }, skillsController.create);

  app.put('/skills/:id', {
    schema: {
      tags: ['Admin Skills'],
      summary: 'Update a skill',
      params: skillParamSchema,
      body: updateSkillSchema,
    },
  }, skillsController.update);

  app.delete('/skills/:id', {
    schema: { tags: ['Admin Skills'], summary: 'Delete a skill', params: skillParamSchema },
  }, skillsController.delete);

  // ── Experience ───────────────────────────────────────────────────────
  app.get('/experience', {
    schema: { tags: ['Admin Experience'], summary: 'Get all experience entries' },
  }, experienceController.getAll);

  app.get('/experience/:id', {
    schema: { tags: ['Admin Experience'], summary: 'Get an experience entry', params: experienceParamSchema },
  }, experienceController.getById);

  app.post('/experience', {
    schema: { tags: ['Admin Experience'], summary: 'Create experience', body: createExperienceSchema },
  }, experienceController.create);

  app.put('/experience/:id', {
    schema: {
      tags: ['Admin Experience'],
      summary: 'Update experience',
      params: experienceParamSchema,
      body: updateExperienceSchema,
    },
  }, experienceController.update);

  app.delete('/experience/:id', {
    schema: { tags: ['Admin Experience'], summary: 'Delete experience', params: experienceParamSchema },
  }, experienceController.delete);

  // ── Certificates ─────────────────────────────────────────────────────
  app.get('/certificates', {
    schema: { tags: ['Admin Certificates'], summary: 'Get all certificates (including hidden)' },
  }, certificatesController.getAll);

  app.get('/certificates/:id', {
    schema: { tags: ['Admin Certificates'], summary: 'Get a certificate', params: certificateParamSchema },
  }, certificatesController.getById);

  app.post('/certificates', {
    schema: { tags: ['Admin Certificates'], summary: 'Create a certificate', body: createCertificateSchema },
  }, certificatesController.create);

  app.put('/certificates/:id', {
    schema: {
      tags: ['Admin Certificates'],
      summary: 'Update a certificate',
      params: certificateParamSchema,
      body: updateCertificateSchema,
    },
  }, certificatesController.update);

  app.delete('/certificates/:id', {
    schema: { tags: ['Admin Certificates'], summary: 'Delete a certificate', params: certificateParamSchema },
  }, certificatesController.delete);

  // ── Projects ─────────────────────────────────────────────────────────
  app.get('/projects', {
    schema: {
      tags: ['Admin Projects'],
      summary: 'Get projects (add ?all=true to include drafts)',
      querystring: projectListQuerySchema,
    },
  }, projectController.getAll);

  app.get('/projects/:id', {
    schema: {
      tags: ['Admin Projects'],
      summary: 'Get a project by ID or slug (add ?all=true to include drafts)',
      params: projectParamSchema,
    },
  }, projectController.getById);

  app.post('/projects', {
    schema: { tags: ['Admin Projects'], summary: 'Create a project', body: createProjectSchema },
  }, projectController.create);

  app.put('/projects/:id', {
    schema: {
      tags: ['Admin Projects'],
      summary: 'Update a project',
      params: projectParamSchema,
      body: updateProjectSchema,
    },
  }, projectController.update);

  app.delete('/projects/:id', {
    schema: { tags: ['Admin Projects'], summary: 'Delete a project', params: projectParamSchema },
  }, projectController.delete);

  // ── Settings ─────────────────────────────────────────────────────────
  app.get('/settings', {
    schema: { tags: ['Admin Settings'], summary: 'Get site-wide settings' },
  }, settingsController.getSettings);

  app.put('/settings', {
    schema: {
      tags: ['Admin Settings'],
      summary: 'Update site-wide settings',
      body: updateSettingsSchema,
    },
  }, settingsController.updateSettings);

  // ── About ────────────────────────────────────────────────────────────
  app.get('/about', {
    schema: { tags: ['Admin About'], summary: 'Get the About Me profile and gallery' },
  }, aboutController.getAbout);

  app.put('/about', {
    schema: {
      tags: ['Admin About'],
      summary: 'Update About Me profile, social links, gallery and legacy CVs',
      body: updateAboutSchema,
    },
  }, aboutController.updateAbout);

  // ── Media (images, videos, certificate PDFs) ─────────────────────────
  app.post('/media/upload', {
    schema: { tags: ['Admin Media'], summary: 'Upload an image, video or PDF' },
  }, mediaController.upload);

  app.delete('/media/:id', {
    schema: {
      tags: ['Admin Media'],
      summary: 'Delete a media asset and its Cloudinary file',
      params: deleteMediaParamsSchema,
    },
  }, mediaController.delete);

  // ── Education ────────────────────────────────────────────────────────
  app.get('/education', {
    schema: {
      tags: ['Admin Education'],
      summary: 'Get education entries (add ?all=true to include hidden)',
      querystring: educationListQuerySchema,
    },
  }, educationController.getAll);

  app.get('/education/:id', {
    schema: { tags: ['Admin Education'], summary: 'Get an education entry', params: educationParamSchema },
  }, educationController.getById);

  app.put('/education/reorder', {
    schema: { tags: ['Admin Education'], summary: 'Reorder education entries', body: reorderEducationSchema },
  }, educationController.reorder);

  app.post('/education', {
    schema: { tags: ['Admin Education'], summary: 'Create education', body: createEducationSchema },
  }, educationController.create);

  app.put('/education/:id', {
    schema: {
      tags: ['Admin Education'],
      summary: 'Update education',
      params: educationParamSchema,
      body: updateEducationSchema,
    },
  }, educationController.update);

  app.delete('/education/:id', {
    schema: { tags: ['Admin Education'], summary: 'Delete education', params: educationParamSchema },
  }, educationController.delete);

  // ── Messages ─────────────────────────────────────────────────────────
  app.get('/messages', {
    schema: { tags: ['Admin Messages'], summary: 'Get all messages' },
  }, messageController.getAll);

  app.get('/messages/:id', {
    schema: { tags: ['Admin Messages'], summary: 'Get a message', params: messageParamSchema },
  }, messageController.getById);

  app.patch('/messages/:id', {
    schema: {
      tags: ['Admin Messages'],
      summary: 'Update message status',
      params: messageParamSchema,
      body: updateMessageSchema,
    },
  }, messageController.update);

  app.delete('/messages/:id', {
    schema: { tags: ['Admin Messages'], summary: 'Delete a message', params: messageParamSchema },
  }, messageController.delete);

  // ── Dashboard ────────────────────────────────────────────────────────
  app.get('/dashboard', {
    schema: { tags: ['Admin Dashboard'], summary: 'Get dashboard overview' },
  }, dashboardController.getOverview);

  // ── CVs ──────────────────────────────────────────────────────────────
  app.get('/cvs', {
    schema: { tags: ['Admin CVs'], summary: 'List all CV documents' },
  }, cvController.list);

  app.post('/cvs', {
    schema: { tags: ['Admin CVs'], summary: 'Upload a PDF CV' },
  }, cvController.upload);

  app.put('/cvs/:id', {
    schema: { tags: ['Admin CVs'], summary: 'Update or replace a CV', params: cvParamSchema },
  }, cvController.update);

  app.patch('/cvs/:id/primary', {
    schema: { tags: ['Admin CVs'], summary: 'Set the primary CV', params: cvParamSchema },
  }, cvController.setPrimary);

  app.delete('/cvs/:id', {
    schema: { tags: ['Admin CVs'], summary: 'Delete a CV and Cloudinary asset', params: cvParamSchema },
  }, cvController.delete);

  app.get('/cvs/:id/download', {
    schema: { tags: ['Admin CVs'], summary: 'Download a CV as application/pdf', params: cvParamSchema },
  }, cvController.download);
};
