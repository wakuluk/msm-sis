import { createStore } from "zustand/vanilla";
import { devtools } from "zustand/middleware";
import { z } from "zod";
import { jwtDecode } from "jwt-decode";
//TODO: for security improvements, storing it in local storage is bad.
// import CookieService from "./cookie-service";
// it's available here: https://github.com/doichev-kostia/zustand-auth-store
import {
	fetchCurrentUser,
	login as loginRequest,
} from "./auth-service";

import { useStore } from "zustand";

const ACCESS_TOKEN_KEY = "accessToken";
//TODO: for security improvements
// const REFRESH_TOKEN_KEY = "refreshToken";

const TokenDataSchema = z.object({
	userId: z.number(),
	roles: z.array(z.string()),
});

type TokenData = z.infer<typeof TokenDataSchema>;

type AuthStore = {
	accessToken: string | undefined;
	accessTokenData: TokenData | undefined;
	isInitializing: boolean;
	refreshToken: string | undefined;

	actions: {
		setAccessToken: (accessToken: string | undefined) => void;
		setRefreshToken: (refreshToken: string | undefined) => void;
		login: (email: string, password: string) => Promise<void>;
		// set tokens on the app start
		init: () => Promise<void>;
		clearTokens: () => void;
	};
};

export const decodeAccessToken = (accessToken: string) =>
	TokenDataSchema.parse(jwtDecode<TokenData>(accessToken));

const authStore = createStore<AuthStore>()(
	devtools(
		(set, get) => ({
			accessToken: undefined,
			accessTokenData: undefined,
			isInitializing: true,
			refreshToken: undefined,

			//TODO ok, we need to switch to this to avoid localstorage calls.
			// I should be using Zustand persit.
			// If you want to persist the store, omit the actions
			/**
			 * import { omit } from "remeda"
			 * {
			 * 		name: "auth-store",
			 * 		storage: createJSONStorage(() => sessionStorage),
			 * 		partialize: (state) => {
			 * 			return omit(state, ["actions"]);
			 * 		},
			 * 	}
			 */
				actions: {
					setAccessToken: (accessToken: string | undefined) => {
						const accessTokenData = (() => {
							try {
								return accessToken ? decodeAccessToken(accessToken) : undefined;
						} catch (error) {
							console.error(error);
							return undefined;
						}
						})();
						//TODO BAD, security updates, cookie-service
						if (accessToken) {
							localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
						} else {
							localStorage.removeItem(ACCESS_TOKEN_KEY);
						}
						set({
							accessToken,
							accessTokenData,
						});
					},
					//TODO we'll use this eventually
					setRefreshToken: (refreshToken: string | undefined) =>
						set({
							refreshToken,
						}),
					login: async (email: string, password: string) => {
						const loginResponse = await loginRequest(email, password);
						get().actions.setAccessToken(loginResponse.token);
					},
					init: async () => {
						set({ isInitializing: true });

						try {
							const { setAccessToken } = get().actions;
							const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
							setAccessToken(accessToken);

							if (accessToken) {
								try {
									await fetchCurrentUser(accessToken);
								} catch (error) {
									console.error("Failed to verify persisted auth state:", error);
									get().actions.clearTokens();
								}
							}
						} finally {
							set({ isInitializing: false });
						}
					},
					clearTokens: () => {
						localStorage.removeItem(ACCESS_TOKEN_KEY);
						set({
							accessToken: undefined,
							accessTokenData: undefined,
							isInitializing: false,
							refreshToken: undefined,
						});
					},
			},
		}),
		{
			name: "auth-store",
			enabled: !import.meta.env.PROD,
		}
	)
);

/**
 * Required for zustand stores, as the lib doesn't expose this type
 */
export type ExtractState<S> = S extends {
		getState: () => infer T;
	}
	? T
	: never;

type Params<U> = Parameters<typeof useStore<typeof authStore, U>>;

// Selectors
const accessTokenSelector = (state: ExtractState<typeof authStore>) =>
	state.accessToken;
const accessTokenDataSelector = (state: ExtractState<typeof authStore>) =>
	state.accessTokenData;
const isInitializingSelector = (state: ExtractState<typeof authStore>) =>
	state.isInitializing;
const refreshTokenSelector = (state: ExtractState<typeof authStore>) =>
	state.refreshToken;
const actionsSelector = (state: ExtractState<typeof authStore>) =>
	state.actions;

// getters
export const getAccessToken = () => accessTokenSelector(authStore.getState());
export const getAccessTokenData = () =>
	accessTokenDataSelector(authStore.getState());
export const getRefreshToken = () => refreshTokenSelector(authStore.getState());
export const getActions = () => actionsSelector(authStore.getState());

function useAuthStore<U>(
	selector: (state: ExtractState<typeof authStore>) => U,
) {
	return useStore(authStore, selector);
}

// Hooks
export const useAccessToken = () => useAuthStore(accessTokenSelector);
export const useAccessTokenData = () => useAuthStore(accessTokenDataSelector);
export const useIsInitializing = () => useAuthStore(isInitializingSelector);
export const useRefreshToken = () => useAuthStore(refreshTokenSelector);
export const useActions = () => useAuthStore(actionsSelector);
