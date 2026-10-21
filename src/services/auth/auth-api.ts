type SignInResponse = {
  token: string;
};

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configuredUrl) {
    //trocar por um erro amigável ao usuário final
    throw new Error(
      "Configure EXPO_PUBLIC_API_URL no arquivo .env com o endereço acessível da API.",
    );
  }

  try {
    const parsedUrl = new URL(configuredUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(
      "EXPO_PUBLIC_API_URL precisa ser um endereço HTTP ou HTTPS válido.",
    );
  }

  return configuredUrl.replace(/\/+$/, "");
}

function isSignInResponse(value: unknown): value is SignInResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string" &&
    value.token.length > 0
  );
}

function getApiErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return null;
}

export async function signInWithApi(email: string, password: string) {
  const apiBaseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira a rede e o endereço configurado.",
    );
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("A API retornou uma resposta inválida.");
  }

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(responseBody) ??
        `Não foi possível entrar. A API retornou o erro ${response.status}.`,
    );
  }

  if (!isSignInResponse(responseBody)) {
    throw new Error("A resposta de login da API não contém um token válido.");
  }

  return responseBody.token;
}
