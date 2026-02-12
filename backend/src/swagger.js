const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TaskMaster API',
    version: '1.0.0',
    description: 'REST API for user authentication, task management, and admin user control with JWT and role-based access.',
    contact: {
      name: 'Harshith',
      email: 'your-email@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from /api/v1/auth/login (format: Bearer <token>)',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid credentials' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: { type: 'string', example: 'Password must be at least 8 characters' },
                param: { type: 'string', example: 'password' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'harshith' },
          email: { type: 'string', example: 'harshith@example.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
          last_login: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          title: { type: 'string', example: 'Finish project' },
          description: { type: 'string', example: 'Update docs' },
          user_id: { type: 'integer', example: 1 },
          completed: { type: 'boolean', example: false },
          due_date: { type: 'string', format: 'date-time', example: '2026-02-20T18:00:00Z' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - missing or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
  paths: {
    // ── Auth Endpoints ──────────────────────────────────────────────────────
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account (role defaults to USER).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'harshith' },
                  email: { type: 'string', format: 'email', example: 'harshith@example.com' },
                  password: { type: 'string', example: 'securepass123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created successfully' },
          400: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user and get JWT token',
        description: 'Authenticates user and returns JWT token + user info.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'harshith@example.com' },
                  password: { type: 'string', example: 'securepass123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── User Management (Admin only) ────────────────────────────────────────
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'Get list of all users (admin only)',
        description: 'Returns all users with stats (total count, last login, etc.).',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalMembers: { type: 'integer', example: 42 },
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    '/api/v1/users/{id}': {
      put: {
        tags: ['Users'],
        summary: 'Update any user (admin only)',
        description: 'Update username, email, role, or reset password.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'User ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'newusername' },
                  email: { type: 'string', format: 'email', example: 'newemail@example.com' },
                  role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' },
                  password: { type: 'string', example: 'newsecurepass' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User updated successfully' },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },

      delete: {
        tags: ['Users'],
        summary: 'Delete a user (admin only)',
        description: 'Deletes a user account. Cannot delete self.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'User ID',
          },
        ],
        responses: {
          200: { description: 'User deleted successfully' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── Tasks Endpoints ─────────────────────────────────────────────────────
    '/api/v1/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Get all tasks',
        description: 'Admins see all tasks. Regular users see only their own.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },

      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        description: 'Creates a task for the authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Complete project' },
                  description: { type: 'string', example: 'Finish documentation' },
                  due_date: { type: 'string', format: 'date-time', example: '2026-02-20T18:00:00Z' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created' },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    '/api/v1/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get a single task',
        description: 'Returns details of a specific task.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'Task ID',
          },
        ],
        responses: {
          200: {
            description: 'Task details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'Not authorized to view this task' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },

      put: {
        tags: ['Tasks'],
        summary: 'Update a task',
        description: 'Update task details, mark as complete, or change due date.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'Task ID',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Updated title' },
                  description: { type: 'string', example: 'Updated description' },
                  completed: { type: 'boolean', example: true },
                  due_date: { type: 'string', format: 'date-time', example: '2026-02-25T12:00:00Z' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Task updated' },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },

      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        description: 'Deletes a task (only owner or admin can delete).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'integer' },
            description: 'Task ID',
          },
        ],
        responses: {
          200: { description: 'Task deleted' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;