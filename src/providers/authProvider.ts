// import { AuthProvider } from "ra-core";
import { getDeviceId } from "./deviceId";

const API_URL = import.meta.env.VITE_API_URL as string

import type { Credentials, Token } from "./types";

interface StoredUser {
  id:    string;
  email: string;
  role:  string;
  guest: boolean;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const authProvider = { //: AuthProvider = {
  checkAuth: () => {
    const token: Token = localStorage.getItem("token");

    return token ? Promise.resolve() : Promise.reject();
  },
  checkError: (error: any) => {
    if (!error) return Promise.reject();

    /*
     * if (error instanceof Error) {
     *   const { message } = error;
     * }
     */
    const { message, status } = error;

    // Server took too long to complete
    if (message === "Failed to fetch") {
      return Promise.reject({
        logoutUser: false,
        message: "Request Failed.  Please try again.",
        redirectTo: "/server/busy",
      });
    }

    if (status === 401 || status === 403 || status === undefined) {
      // localStorage.removeItem('token');
      return Promise.reject({
        logoutUser: false,
        message: "Not Authorized.",
        redirectTo: "/server/unauthorized",
      });
    }

    return Promise.resolve();
  },
  getIdentity: () => {
    const user = getStoredUser();
    return user ? Promise.resolve(user) : Promise.reject();
  },
  getPermissions: () => {
    const user = getStoredUser();
    return user ? Promise.resolve((user as any).permissions ?? []) : Promise.reject();
  },
  getDecodedToken: () => {
    const user = getStoredUser();
    return user ? Promise.resolve(user) : Promise.reject();
  },
  login: ({ username, password }: Credentials) => {
    const request = new Request(`${API_URL}/sessions`, {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    return fetch(request)
      .then(async (response: any) => {
        const body = await response.json().catch(() => ({}));
        if (response.status < 200 || response.status >= 300) {
          throw new Error(body?.error ?? body?.message ?? response.statusText);
        }
        return body;
      })
      .then(({ token, user }: { token: string; user: StoredUser }) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      });
  },
  createGuestSession: async (): Promise<void> => {
    const deviceId = await getDeviceId()
    const request = new Request(`${API_URL}/guest`, {
      method: "POST",
      body:    JSON.stringify({ device_id: deviceId }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    const response = await fetch(request);
    const body = await response.json().catch(() => ({}));
    if (response.status < 200 || response.status >= 300) {
      throw new Error(body?.error ?? body?.message ?? response.statusText);
    }
    localStorage.setItem("token", body.token);
    if (body.user) localStorage.setItem("user", JSON.stringify(body.user));
  },

  register: async ({ email, password }: Credentials): Promise<void> => {
    const token: Token = localStorage.getItem("token");
    const headers = new Headers({ "Content-Type": "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const request = new Request(`${API_URL}/registration`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers,
    });
    const response = await fetch(request);
    const body = await response.json().catch(() => ({}));
    if (response.status < 200 || response.status >= 300) {
      throw new Error(body?.error ?? body?.message ?? response.statusText);
    }
    localStorage.setItem("token", body.token);
    if (body.user) localStorage.setItem("user", JSON.stringify(body.user));
  },

  isGuest: (): boolean => {
    const user = getStoredUser();
    if (!user) return true;
    return user.guest === true;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },
  async canAccess(_params: any) {
    return Promise.resolve();
  }
};

export default authProvider;
