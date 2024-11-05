import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import { apiFetchServer, getFullPath } from '@/app/lib/api';
import { decodeToken, TokenPayload } from './app/lib/token-decode';
import { LoginResponse } from './app/lib/responses';
 
async function getUser(username: string, password: string): Promise<User | undefined> {
  try {
    const data: FormData = new FormData()
    data.append('username', username);
    data.append('password', password);

    const responseTokens = await apiFetchServer({method: 'POST', path: 'auth/login', body: data, isForm: true});
    const tokens: LoginResponse = await responseTokens.json();

    const decodedToken: TokenPayload | null = decodeToken(tokens.access_token);

    if(!decodedToken) {
      throw('No se pudo decodificar el token');
    }

    console.log('TOKENS RESPONSE', responseTokens, "TOKENS", tokens);
    
    const responseUser = await fetchUser(tokens);
    console.log('SI ACA NO LLEGA SE ROMPIO EN EL FETCH USER');
    
    const user: User = {
      email: decodedToken.email,
      password: '',
      id: '1', //TODO refactorear esto con tiempo
      name: 'John Doe',
      premises: decodedToken.premises,
      tokens: tokens,
      user_data: await responseUser.json()
    }
    
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function fetchUser(tokens: any){
  var headers = new Headers({
    'Accept': 'application/json',
    'Content-type': 'application/json',
    'Authorization': tokens.token_type + " " + tokens.access_token
  });
  console.log("FETCH USER AUTH: ", tokens.token_type + " " + tokens.access_token);
  console.log("FETCH USER: ", getFullPath('user/users/me'));
  
  const response = await fetch(getFullPath('user/users/me'), 
    {
      method: "GET",
      headers: headers
    }
  );
  console.log("FETCH USER RESPONSE: ", response);

  return response
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string().min(6) })
          .safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          const user = await getUser(username, password);
          if (!user) return null;

          console.log('Valid credentials');
          return user;
        }
 
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});