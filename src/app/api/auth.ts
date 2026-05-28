import { API_BASE_URL } from '../../config/env';

export async function userLogin({ username, password }: { username: string; password: string }) {
    const BASE_URL = API_BASE_URL;
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    };

    const response = await fetch(
        BASE_URL + '/api/login',
        options,
    );

    let data;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.ok) {
        console.log('Login success response:', data);
        return data;
    } else {
        const message =
            (data && (data.errors?.password || data.errors?.detail || data.detail)) ||
            'Login failed';
        throw new Error(message);
    }
}