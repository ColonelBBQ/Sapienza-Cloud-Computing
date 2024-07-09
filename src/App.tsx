import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json";
import Home from './pages/Home';

Amplify.configure(outputs);

const client = generateClient<Schema>({
  authMode: 'userPool',
});

function App() {
  const [sessions, setSessions] = useState<Array<Schema["Sessions"]["type"]>>([]);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    client.models.Sessions.observeQuery().subscribe({
      next: (data) => setSessions([...data.items]),
    });

  fetchUserAttributes().then(attributes => {
    setUserName(attributes.given_name || attributes.givenName || "User");
    }).catch(console.error);
  }, []);


  return (
    <Authenticator signUpAttributes={['given_name', "email"]} socialProviders={['apple', 'google']} >
      {({ signOut }) => {
        return (
          <div className='app-container'>
            <div className='nav-container'>
              <button onClick={signOut}>Sign out</button>
            </div>
            <Home client={client} userName={userName} sessions={sessions}/>
          </div>
        );
      }}
    </Authenticator>
  );
}

export default App;