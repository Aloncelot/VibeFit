'use server';

import { cookies } from 'next/headers';

export async function validarAcceso(password: string) {
    const passwordCorrecto = process.env.ADMIN_PASSWORD;

    if (password === passwordCorrecto) {
        const cookieStore = await cookies();
        cookieStore.set('vibefit_admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/',
        });
        return { success: true };
    }

    return { success: false };
}