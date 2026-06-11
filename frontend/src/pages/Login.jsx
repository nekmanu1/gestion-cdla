import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('admin@cdla.com');
    const [password, setPassword] = useState('Admin12345');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));

            navigate('/dashboard');
        } catch (error) {
            setError(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h2 style={styles.title}>Ciudad de las Artes</h2>
                <p style={styles.subtitle}>Gestión de Espacios</p>

                {error && <div style={styles.error}>{error}</div>}

                <label style={styles.label}>Correo</label>
                <input
                    style={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label style={styles.label}>Contraseña</label>
                <input
                    style={styles.input}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button style={styles.button} disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#f4f4f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    card: {
        width: '360px',
        background: '#fff',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,.08)'
    },
    title: {
        margin: 0,
        fontSize: '22px',
        color: '#111'
    },
    subtitle: {
        marginTop: '4px',
        marginBottom: '24px',
        color: '#666'
    },
    label: {
        display: 'block',
        marginBottom: '6px',
        fontSize: '13px',
        fontWeight: '600'
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '14px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '14px'
    },
    button: {
        width: '100%',
        padding: '11px',
        background: '#111',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    error: {
        background: '#fee2e2',
        color: '#991b1b',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '14px',
        fontSize: '13px'
    }
};