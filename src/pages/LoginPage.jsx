import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useForm } from '@mantine/form';
import { Container, TextInput, PasswordInput, Button, Paper, Title, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length > 5 ? null : 'Password must be at least 5 characters long'),
        },
    });

    const handleLogin = async (values) => {
        const { email, password } = values;

        setLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Logged in successfully!');
            navigate('/');
        } catch (error) {
            setError('Failed to log in. Please check your credentials and try again.');
            console.error('Login Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="xs" my={40}>
            <Paper radius="md" p="xl" withBorder>
                <Title order={2} align="center" mb="lg">Login <Text>(Mentors Only)</Text></Title>

                <form onSubmit={form.onSubmit(handleLogin)}>
                    <TextInput
                        label="Email"
                        placeholder="Enter your email"
                        {...form.getInputProps('email')}
                        required
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Enter your password"
                        {...form.getInputProps('password')}
                        required
                        mt="md"
                    />
                    {error && <Text color="red" mt="sm">{error}</Text>}
                    <Button type="submit" fullWidth mt="xl" loading={loading}>
                        Login
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default LoginPage;
