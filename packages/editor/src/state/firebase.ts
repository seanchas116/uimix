import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAAU8n9af3qW7hiGEXsIvKlhj2GJX-TMGU",
  authDomain: "visual-site-editor.firebaseapp.com",
  databaseURL: "https://visual-site-editor-default-rtdb.firebaseio.com",
  projectId: "visual-site-editor",
  storageBucket: "visual-site-editor.appspot.com",
  messagingSenderId: "193034109011",
  appId: "1:193034109011:web:eff0f37f55ebe2581fc6a6",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export async function getIDToken(): Promise<string | undefined> {
  return await auth.currentUser?.getIdToken();
}
