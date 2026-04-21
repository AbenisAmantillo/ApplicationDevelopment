export async function userLogin({ username, password }: { username: string; password: string }) {
    const BASE_URL = "http://192.168.5.201:8000";
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
    } catch (e) {
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
