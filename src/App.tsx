import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { fetchUserAttributes } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json";

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

    // Fetch user attributes when component mounts
  fetchUserAttributes().then(attributes => {
    setUserName(attributes.given_name || attributes.givenName || "User");
    }).catch(console.error);
  }, []);

  function createSession() {
    client.models.Sessions.create({ content: window.prompt("Todo content") });
  }
    
  function deleteSession(id: string) {
    client.models.Sessions.delete({ id })
  }

  return (
    <Authenticator signUpAttributes={['given_name', 'name', "email"]} socialProviders={['apple', 'google']} >
      {({ signOut, user }) => {
        return (
          <main>
            <h1>{userName}'s Meditation Sessions</h1>
            <button onClick={createSession}>+ new</button>
            <ul>
              {sessions.map((session) => (
                <li 
                  onClick={() => deleteSession(session.id)}
                  key={session.id}>{session.content}</li>
              ))}
            </ul>
            <button onClick={signOut}>Sign out</button>
          </main>
        );
      }}
    </Authenticator>
  );
}

export default App;