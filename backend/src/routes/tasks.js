const { Router } = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/tasksController');

const router = Router();

// All task routes require a valid JWT
router.use(authMiddleware);

const statusValues = ['todo', 'in-progress', 'done'];

const createRules = [
  body('title').trim().escape().notEmpty().withMessage('Title is required.'),
  body('description').optional().trim().escape(),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage('Status must be todo, in-progress, or done.'),
];

const updateRules = [
  body('title').optional().trim().escape().notEmpty().withMessage('Title cannot be empty.'),
  body('description').optional().trim().escape(),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage('Status must be todo, in-progress, or done.'),
];

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createRules, validate, createTask);
router.put('/:id', updateRules, validate, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
