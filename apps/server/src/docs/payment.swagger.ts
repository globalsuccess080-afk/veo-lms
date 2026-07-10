export const paymentPaths = {
  '/payments/create-order': {
    post: {
      tags: ['Payments'],
      summary: 'Create a new payment order',
      description: 'Requires Authenticated Student.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                courseId: { type: 'string' },
              },
            },
            example: { courseId: '60d0fe4f5311236168a109ca' },
          },
        },
      },
      responses: {
        '200': { description: 'Payment order created' },
        '400': { description: 'Already enrolled or invalid course' },
      },
    },
  },
  '/payments/status/{orderId}': {
    get: {
      tags: ['Payments'],
      summary: 'Get payment status',
      parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'Payment status returned' },
        '404': { description: 'Payment not found' },
      },
    },
  },
  '/payments/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Razorpay webhook receiver',
      responses: {
        '200': { description: 'Webhook accepted' },
        '400': { description: 'Invalid webhook signature' },
      },
    },
  },
}
