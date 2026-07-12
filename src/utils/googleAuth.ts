export interface GoogleUserPayload {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserPayload> => {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      throw new Error('Failed to verify Google token with OAuth API.');
    }
    const payload = (await response.json()) as any;
    if (!payload.sub || !payload.email) {
      throw new Error('Invalid Google token payload.');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || 'Google User',
      avatarUrl: payload.picture || null,
    };
  } catch (error: any) {
    throw new Error(error?.message || 'Google verification failed.');
  }
};
