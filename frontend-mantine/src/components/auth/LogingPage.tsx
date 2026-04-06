import { useState } from 'react';
import { Button, Container, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useActions } from '../../auth/auth-store';
import classes from './LogingPage.module.css';

export function LogingPage() {
  const actions = useActions();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await actions.login(email, password);
      navigate('/app', { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" className={classes.title}>
        WSIS
      </Title>
      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="you@mantine.dev"
            required
            radius="md"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            radius="md"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Button fullWidth mt="xl" radius="md" type="submit" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        {error ? (
          <Text c="red" mt="md">
            {error}
          </Text>
        ) : null}
      </Paper>
    </Container>
  );
}
