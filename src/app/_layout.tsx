import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthProvider, useAuth } from "@/context/auth-context";

function RootNavigator() {
  const { isLoading, session, initializationError, retrySessionRestore } =
    useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#176B5B" />
        <Text style={styles.statusText}>Carregando sua sessão...</Text>
      </View>
    );
  }

  if (initializationError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Não foi possível abrir sua sessão</Text>
        <Text style={styles.statusText}>{initializationError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={retrySessionRestore}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="post/[id]"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#EAF4FF",
  },
  statusText: {
    marginTop: 12,
    color: "#597393",
    textAlign: "center",
  },
  errorTitle: {
    color: "#263A33",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
  },
  retryButtonText: {
    color: "#2F68F5",
    fontWeight: "700",
  },
});
