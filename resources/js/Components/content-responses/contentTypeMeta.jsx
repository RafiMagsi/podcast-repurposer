import React from 'react';

export function contentTypeMeta(contentType, fallbackLabel = 'Content') {
    switch (contentType) {
        case 'summary':
            return {
                label: 'Summary',
                description: 'Core idea in 2–3 sentences.',
                badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
                iconWrapClass: 'bg-sky-100 text-sky-700',
                sectionClass: 'border-sky-200/80 bg-sky-50/50',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4.75A1.75 1.75 0 015.75 3h8.5A1.75 1.75 0 0116 4.75v10.5A1.75 1.75 0 0114.25 17h-8.5A1.75 1.75 0 014 15.25V4.75zm3 1.25a.75.75 0 000 1.5h6a.75.75 0 000-1.5H7zm0 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H7zm0 3a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5H7z" />
                    </svg>
                ),
            };

        case 'linkedin_post':
            return {
                label: 'LinkedIn Post',
                description: 'Professional draft.',
                badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
                iconWrapClass: 'bg-blue-100 text-blue-700',
                sectionClass: 'border-blue-200/80 bg-blue-50/50',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.94 8.5a1.56 1.56 0 110-3.12 1.56 1.56 0 010 3.12zM5.5 9.75h2.88V18H5.5V9.75zm4.69 0h2.76v1.13h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.92 3.45 4.42V18h-2.88v-3.72c0-.89-.02-2.03-1.24-2.03-1.24 0-1.43.97-1.43 1.97V18h-2.88V9.75z" />
                    </svg>
                ),
            };

        case 'x_post':
            return {
                label: 'X Post',
                description: 'Short post under 280 chars.',
                badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
                iconWrapClass: 'bg-slate-200 text-slate-800',
                sectionClass: 'border-slate-200/80 bg-slate-50',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2H21l-6.014 6.873L22 22h-5.49l-4.3-5.977L6.98 22H4.22l6.433-7.353L2 2h5.63l3.886 5.465L18.244 2zm-.968 18h1.526L6.8 3.895H5.163L17.276 20z" />
                    </svg>
                ),
            };

        case 'instagram_caption':
            return {
                label: 'Instagram Caption',
                description: 'Caption plus 5 hashtags.',
                badgeClass: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
                iconWrapClass: 'bg-fuchsia-100 text-fuchsia-700',
                sectionClass: 'border-fuchsia-200/80 bg-fuchsia-50/50',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.75 3h8.5A4.75 4.75 0 0121 7.75v8.5A4.75 4.75 0 0116.25 21h-8.5A4.75 4.75 0 013 16.25v-8.5A4.75 4.75 0 017.75 3zm0 1.5A3.25 3.25 0 004.5 7.75v8.5a3.25 3.25 0 003.25 3.25h8.5a3.25 3.25 0 003.25-3.25v-8.5a3.25 3.25 0 00-3.25-3.25h-8.5zm8.75 1.75a1 1 0 110 2 1 1 0 010-2zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
                    </svg>
                ),
            };

        case 'newsletter':
            return {
                label: 'Newsletter',
                description: 'Subject and email-ready body.',
                badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
                iconWrapClass: 'bg-amber-100 text-amber-700',
                sectionClass: 'border-amber-200/80 bg-amber-50/50',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.5 5.75A1.75 1.75 0 014.25 4h11.5a1.75 1.75 0 011.75 1.75v8.5A1.75 1.75 0 0115.75 16H4.25A1.75 1.75 0 012.5 14.25v-8.5zm1.5.31v.48l6 3.82 6-3.82v-.48a.25.25 0 00-.25-.25H4.25a.25.25 0 00-.25.25zm12 2.26-5.6 3.56a.75.75 0 01-.8 0L4 8.32v5.93c0 .138.112.25.25.25h11.5a.25.25 0 00.25-.25V8.32z" />
                    </svg>
                ),
            };

        default:
            return {
                label: fallbackLabel,
                description: 'Generated output.',
                badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
                iconWrapClass: 'bg-slate-100 text-slate-700',
                sectionClass: 'border-slate-200 bg-slate-50',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4.75A1.75 1.75 0 015.75 3h8.5A1.75 1.75 0 0116 4.75v10.5A1.75 1.75 0 0114.25 17h-8.5A1.75 1.75 0 014 15.25V4.75z" />
                    </svg>
                ),
            };
    }
}
