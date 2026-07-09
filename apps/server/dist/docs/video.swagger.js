"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoPaths = void 0;
exports.videoPaths = {
    '/videos/upload': {
        post: {
            tags: ['Videos'],
            summary: 'Upload a video (Admin/Instructor)',
            description: 'Document multipart/form-data properly. Video upload endpoint should show video as binary.',
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                video: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Video file to upload',
                                },
                                lessonId: {
                                    type: 'string',
                                    description: 'ID of the lesson to attach this video to',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                '200': { description: 'Video uploaded successfully' },
                '400': { description: 'Bad request or missing file' },
            },
        },
    },
    '/videos/{id}/stream': {
        get: {
            tags: ['Videos'],
            summary: 'Stream a video',
            description: 'Requires Enrollment before access unless the lesson is marked as free.',
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            ],
            responses: {
                '200': { description: 'Video stream started', content: { 'video/mp4': {} } },
                '206': { description: 'Partial Content' },
                '403': { description: 'Forbidden - Requires Enrollment' },
            },
        },
    },
};
