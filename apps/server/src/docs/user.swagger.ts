export const userPaths = {
  '/users/profile': {
    get: {
      tags: ['Users'],
      summary: 'Get user profile',
      responses: {
        '200': {
          description: 'User profile fetched successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiResponse',
              },
            },
          },
        },
      },
    },
    put: {
      tags: ['Users'],
      summary: 'Update user profile',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
            example: { name: 'Jane Doe', avatar: 'https://example.com/avatar.jpg' },
          },
        },
      },
      responses: {
        '200': { description: 'Profile updated successfully' },
        '400': { description: 'Validation failed' },
      },
    },
  },
  '/users/change-password': {
    post: {
      tags: ['Users'],
      summary: 'Change password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string' },
              },
            },
            example: { currentPassword: 'oldpassword', newPassword: 'newpassword123' },
          },
        },
      },
      responses: {
        '200': { description: 'Password changed successfully' },
        '400': { description: 'Incorrect current password' },
      },
    },
  },
}
