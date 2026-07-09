import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    otp: string;
}, {
    name: string;
    email: string;
    password: string;
    otp: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
    newPassword: string;
}, {
    email: string;
    otp: string;
    newPassword: string;
}>;
export declare const createCourseSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    shortDescription: z.ZodString;
    thumbnail: z.ZodOptional<z.ZodString>;
    trailerUrl: z.ZodOptional<z.ZodString>;
    instructor: z.ZodObject<{
        name: z.ZodString;
        bio: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        avatar: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        bio: string;
        avatar: string;
    }, {
        name: string;
        bio?: string | undefined;
        avatar?: string | undefined;
    }>;
    price: z.ZodNumber;
    originalPrice: z.ZodOptional<z.ZodNumber>;
    category: z.ZodString;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    level: z.ZodDefault<z.ZodEnum<["beginner", "intermediate", "advanced"]>>;
    language: z.ZodDefault<z.ZodString>;
    isFeatured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isPublished: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    shortDescription: string;
    instructor: {
        name: string;
        bio: string;
        avatar: string;
    };
    price: number;
    category: string;
    tags: string[];
    level: "beginner" | "intermediate" | "advanced";
    language: string;
    isFeatured: boolean;
    isPublished: boolean;
    thumbnail?: string | undefined;
    trailerUrl?: string | undefined;
    originalPrice?: number | undefined;
}, {
    title: string;
    description: string;
    shortDescription: string;
    instructor: {
        name: string;
        bio?: string | undefined;
        avatar?: string | undefined;
    };
    price: number;
    category: string;
    thumbnail?: string | undefined;
    trailerUrl?: string | undefined;
    originalPrice?: number | undefined;
    tags?: string[] | undefined;
    level?: "beginner" | "intermediate" | "advanced" | undefined;
    language?: string | undefined;
    isFeatured?: boolean | undefined;
    isPublished?: boolean | undefined;
}>;
export declare const updateCourseSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    thumbnail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    trailerUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    instructor: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        bio: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        avatar: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        bio: string;
        avatar: string;
    }, {
        name: string;
        bio?: string | undefined;
        avatar?: string | undefined;
    }>>;
    price: z.ZodOptional<z.ZodNumber>;
    originalPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    level: z.ZodOptional<z.ZodDefault<z.ZodEnum<["beginner", "intermediate", "advanced"]>>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    isFeatured: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    isPublished: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    thumbnail?: string | undefined;
    trailerUrl?: string | undefined;
    instructor?: {
        name: string;
        bio: string;
        avatar: string;
    } | undefined;
    price?: number | undefined;
    originalPrice?: number | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    level?: "beginner" | "intermediate" | "advanced" | undefined;
    language?: string | undefined;
    isFeatured?: boolean | undefined;
    isPublished?: boolean | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    thumbnail?: string | undefined;
    trailerUrl?: string | undefined;
    instructor?: {
        name: string;
        bio?: string | undefined;
        avatar?: string | undefined;
    } | undefined;
    price?: number | undefined;
    originalPrice?: number | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    level?: "beginner" | "intermediate" | "advanced" | undefined;
    language?: string | undefined;
    isFeatured?: boolean | undefined;
    isPublished?: boolean | undefined;
}>;
export declare const createSectionSchema: z.ZodObject<{
    title: z.ZodString;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    order: number;
}, {
    title: string;
    order: number;
}>;
export declare const createLessonSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    order: z.ZodNumber;
    duration: z.ZodDefault<z.ZodNumber>;
    isPreview: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    youtubeUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    fileUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    resources: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }, {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    order: number;
    duration: number;
    isPreview: boolean;
    resources: {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }[];
    youtubeUrl?: string | undefined;
    fileUrl?: string | undefined;
}, {
    title: string;
    order: number;
    description?: string | undefined;
    duration?: number | undefined;
    isPreview?: boolean | undefined;
    youtubeUrl?: string | undefined;
    fileUrl?: string | undefined;
    resources?: {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }[] | undefined;
}>;
export declare const updateLessonSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    order: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isPreview: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    youtubeUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    fileUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    resources: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }, {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }>, "many">>>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    duration?: number | undefined;
    isPreview?: boolean | undefined;
    youtubeUrl?: string | undefined;
    fileUrl?: string | undefined;
    resources?: {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }[] | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    order?: number | undefined;
    duration?: number | undefined;
    isPreview?: boolean | undefined;
    youtubeUrl?: string | undefined;
    fileUrl?: string | undefined;
    resources?: {
        title: string;
        url: string;
        type?: string | undefined;
        size?: number | undefined;
    }[] | undefined;
}>;
export declare const createOrderSchema: z.ZodObject<{
    courseId: z.ZodString;
    couponCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    courseId: string;
    couponCode?: string | undefined;
}, {
    courseId: string;
    couponCode?: string | undefined;
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    razorpayOrderId: z.ZodString;
    razorpayPaymentId: z.ZodString;
    razorpaySignature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}, {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}>;
export declare const updateProgressSchema: z.ZodObject<{
    courseId: z.ZodString;
    lessonId: z.ZodString;
    watchedSeconds: z.ZodNumber;
    totalSeconds: z.ZodNumber;
    isCompleted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    courseId: string;
    lessonId: string;
    watchedSeconds: number;
    totalSeconds: number;
    isCompleted?: boolean | undefined;
}, {
    courseId: string;
    lessonId: string;
    watchedSeconds: number;
    totalSeconds: number;
    isCompleted?: boolean | undefined;
}>;
export declare const announcementSchema: z.ZodObject<{
    title: z.ZodString;
    message: z.ZodString;
    sendEmail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    title: string;
    sendEmail: boolean;
}, {
    message: string;
    title: string;
    sendEmail?: boolean | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
