import {useState, type FormEvent, useEffect} from 'react';
import { useAccessTokenData, useActions, useIsInitializing } from './auth-store';

const useToken = () => {
    const data = useAccessTokenData();

    return data;
};

export function App() {
    const actions = useActions();
    const data = useToken();
    const isInitializing = useIsInitializing();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isLoggedIn = Boolean(data);

    useEffect(() => {
        void actions.init();
    }, [actions]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await actions.login(email, password);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Login failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isInitializing) {
        return <p>Checking session...</p>;
    }

    return (
        <>
            <p>Zustand auth store </p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
                <button type="button" onClick={() => actions.clearTokens()} disabled={!isLoggedIn}>
                    Logout
                </button>
            </form>

            {error ? <p>{error}</p> : null}
            <p> Token data </p>
            <pre>{JSON.stringify(data, null, 4)}</pre>
        </>
    );
}
