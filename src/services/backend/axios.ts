import { validateCreateRequest } from "../../../shared/create-validation";
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import { apiEndpoint } from "../../config/runtime";

const api = axios.create({
  baseURL: apiEndpoint?.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  if (!apiEndpoint) throw new Error("The application API has not been configured.");
  validateCreateRequest(config.url ?? "", config.data, config.method);
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) config.headers.set("Authorization", `Bearer ${idToken}`);
  } catch {
    // Public endpoints remain available when there is no authenticated session.
  }

  return config;
});

export default api;
