"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentPaths = void 0;
exports.paymentPaths = {
    '/payments/create': {
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
    '/payments/verify': {
        post: {
            tags: ['Payments'],
            summary: 'Verify Razorpay payment',
            description: 'Server verifies Razorpay signature. Do not change implementation. Documentation only.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                razorpay_order_id: { type: 'string' },
                                razorpay_payment_id: { type: 'string' },
                                razorpay_signature: { type: 'string' },
                                courseId: { type: 'string' },
                            },
                        },
                        example: {
                            razorpay_order_id: 'order_IluGWxBm9U8zJ8',
                            razorpay_payment_id: 'pay_IluGqW3m9U8zJ8',
                            razorpay_signature: 'signature_string',
                            courseId: '60d0fe4f5311236168a109ca',
                        },
                    },
                },
            },
            responses: {
                '200': { description: 'Payment verified successfully and enrollment created' },
                '400': { description: 'Invalid signature' },
            },
        },
    },
};
