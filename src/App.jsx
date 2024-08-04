import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AppShell, Container, Flex, NavLink, Button, LoadingOverlay, Burger } from '@mantine/core';
import { collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from './firebaseConfig';
import Home from './pages/Home';
import Submissions from './pages/Submissions';
import GuestDetail from './pages/GuestDetail';
import LoginPage from './pages/LoginPage';
import { signOut } from 'firebase/auth';
import { useDisclosure } from '@mantine/hooks';

const App = () => {
  const [value, loading, error] = useCollection(collection(db, 'guests'));
  const [user] = useAuthState(auth);
  const [opened, { toggle }] = useDisclosure();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Router>
      <AppShell
        aside={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        layout='default'
      >
        <AppShell.Header>
          <Flex justify={'center'} direction={'row'} align={'center'} p={'lg'} gap={'lg'}>
            <NavLink component={Link} to="/" label="Home" w={'auto'}/>
            <NavLink component={Link} to="/submissions" label="Submissions" w={'auto'}/>
            {user ? (
              <Button onClick={handleLogout} variant='subtle'>
                Logout
              </Button>
            ) : (
              <NavLink component={Link} to="/login" label="Login" w={'auto'}/>
            )}
            {
              (user) && (
                <Burger
                  opened={opened}
                  onClick={toggle}
                  hiddenFrom="sm"
                  size="sm"
                />
              )
            }
          </Flex>
        </AppShell.Header>
        <Container p={'xl'} mt={'xl'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path='*' element={<Container>Page not found</Container>} />
            <Route
              path="/submissions"
              element={!loading && user ? <Submissions guests={value?.docs.map(doc => ({ ...doc.data(), id: doc.id })) || []}
                loading={loading} error={error} /> : loading ? <LoadingOverlay visible /> : <Navigate to="/login" />}
            />
            <Route path="/submissions/:id" element={!loading && user ? <GuestDetail toggle={toggle} /> : loading ? <LoadingOverlay visible /> : <Navigate to="/login" />} />
          </Routes>
        </Container>
      </AppShell>
    </Router>
  );
};

export default App;
