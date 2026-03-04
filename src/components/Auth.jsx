import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccessMsg('Account created successfully! You can now log in.');
                setIsLogin(true);
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '20px'
        }}>
            <div className="card" style={{ maxWidth: 400, width: '100%', padding: '40px 32px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'pulse 3s infinite' }}>🎂</div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Sweet Delights</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Finance & Order Tracker</p>
                </div>

                <form onSubmit={handleAuth}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="baker@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMsg && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', marginBottom: 16, padding: '8px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 6 }}>
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginBottom: 16 }}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-accent)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        {isLogin ? 'Sign up here' : 'Log in here'}
                    </button>
                </div>
            </div>
        </div>
    );
}
