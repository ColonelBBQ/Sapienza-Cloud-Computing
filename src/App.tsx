import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json";
import NewSession from './pages/NewSession';
import { format } from 'date-fns';
import { Hub } from 'aws-amplify/utils';
import { fetchAuthSession, fetchUserAttributes } from '@aws-amplify/auth';

Amplify.configure(outputs);

const client = generateClient<Schema>({});

function Home() {
  const [sessions, setSessions] = useState<Array<Schema["Sessions"]["type"]>>([]);
  const [recentSessions, setRecentSessions] = useState<Array<Schema["Sessions"]["type"]>>([]);
  const [userName, setUserName] = useState<string>("");
  const [userData, setUserData] = useState<Schema["User"]["type"] | null>(null);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      await fetchAuthSession({ forceRefresh: true });
      const attributes = await fetchUserAttributes();
      const userSub = attributes.sub;
      setUserName(attributes.given_name || attributes.givenName || "User");

      if (userSub) {
        const { data, errors } = await client.models.User.get({ id: userSub });
        if (errors) {
          console.error('Error fetching user data:', errors);
        } else if (data) {
          setUserData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchSessions = () => {
    return client.models.Sessions.observeQuery().subscribe({
      next: (data) => setSessions([...data.items]),
    });
  };

  useEffect(() => {
    let sessionsSubscription: { unsubscribe: () => void } | null = null;

    const initializeData = async () => {
      await fetchUserData();
      sessionsSubscription = fetchSessions();
    };

    initializeData();

    const hubListener = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('user have been signedIn successfully.');
          await fetchUserData();
          if (sessionsSubscription) {
            sessionsSubscription.unsubscribe();
          }
          sessionsSubscription = fetchSessions();
          break;
        case 'signedOut':
          console.log('user have been signedOut successfully.');
          setUserName("");
          setUserData(null);
          setSessions([]);
          setRecentSessions([]);
          if (sessionsSubscription) {
            sessionsSubscription.unsubscribe();
          }
          break;
      }
    });

    return () => {
      hubListener();
      if (sessionsSubscription) {
        sessionsSubscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    setRecentSessions(sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6));
  }, [sessions]);

  const getStreakImage = (streak: number | null | undefined) => {
    if (streak === null || streak === undefined) return "src/assets/progression_streak/1.png";
    if (streak < 1) return "src/assets/progression_streak/1.png";
    if (streak < 5) return "src/assets/progression_streak/2.png";
    if (streak < 20) return "src/assets/progression_streak/3.png";
    if (streak < 50) return "src/assets/progression_streak/4.png";
    if (streak < 100) return "src/assets/progression_streak/5.png";
    return "src/assets/progression_streak/6.png";
  };
  
  return (
    <Authenticator signUpAttributes={['given_name', "email"]} socialProviders={['apple', 'google']}>
      {({ signOut }) => (
        <div className='app-container'>
          <nav className='nav-bar'>
            <a className="navbar-brand" href="/">
             <img className='logo-img' src="src/assets/logo.png" alt="" />
             meditdiary
            </a>
            <div className='nav-container'>
              <button className="button-sign-out" onClick={signOut}>Sign out</button>
            </div>
          </nav>

          <h1 className='main-title'>Hi {userName}! Welcome to Your Meditation Diary!</h1>
          
          <div className='container-home'>
            <div className='container-sessions-with-title'>
              {recentSessions.length === 0 ? (
                <div className='no-sessions-message'>
                  <h2>Start Your First Activity!</h2>
                  <button className='button-start-main' onClick={() => navigate('/new-session')}>Start New Session!</button>
                </div>
              ) : (
                <>
                  <h2>Here are Your Recent Activities:</h2>
                  <ul>
                    {recentSessions.map((recentSession) => (
                      <li key={recentSession.id}>
                        <div className='container-sessions'>
                          <div className='session'>
                            <div>Date: {format(new Date(recentSession.createdAt), 'yyyy-MM-dd')}, Score: {recentSession.total_score}, Duration: {recentSession.duration} min</div>
                            <div>Session Description: {recentSession.content}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button className='button-start-main' onClick={() => navigate('/new-session')}>Start New Session!</button>
                </>
              )}
            </div>
            <div className='streak-container'>
              <h2 className='streak-title'>Your Streak: {userData?.currentStreak ?? 'Loading...'} Days</h2>
              <img 
                src={getStreakImage(userData?.currentStreak)}
                alt=''
                className="streak-image"
              />
            </div>
          </div>
        </div>
      )}
    </Authenticator>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-session" element={<NewSession client={client}/>} />
      </Routes>
    </Router>
  );
}

export default App;