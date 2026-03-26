import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateSettingsBody } from '../schemas/user.schema';

const router = Router();

/**
 * @swagger
 * /user/settings:
 *   get:
 *     tags: [User]
 *     summary: Get current user settings
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', authenticate, getSettings);

/**
 * @swagger
 * /user/settings:
 *   put:
 *     tags: [User]
 *     summary: Update user settings
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aiProvider:
 *                 type: string
 *                 enum: [openai, gemini, deepseek, openrouter, custom]
 *               aiApiKey:
 *                 type: string
 *                 nullable: true
 *               aiModel:
 *                 type: string
 *                 nullable: true
 *               aiBaseUrl:
 *                 type: string
 *                 nullable: true
 *               hideIntro:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       400:
 *         description: Invalid provider
 *       401:
 *         description: Unauthorized
 */
router.put('/settings', authenticate, validate({ body: updateSettingsBody }), updateSettings);

export default router;
