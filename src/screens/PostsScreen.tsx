import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/context/auth-context";

type Post = {
  id: string;
  title: string;
};

const posts: Post[] = [];

export default function PostsScreen() {
  const { signOut } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setErrorMessage(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar a sessão.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PORTAL ESCOLAR</Text>
          <Text style={styles.title}>Publicações</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#2F68F5" />
          ) : (
            <Text style={styles.signOutButtonText}>Sair</Text>
          )}
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(post) => post.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>▤</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhuma publicação ainda</Text>
            <Text style={styles.emptyMessage}>
              As publicações da escola aparecerão aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{item.title}</Text>
          </View>
        )}
      />

      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.errorMessage}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    backgroundColor: "#F4F8FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  eyebrow: {
    color: "#5277AD",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 5,
    color: "#17233B",
    fontSize: 28,
    fontWeight: "700",
  },
  signOutButton: {
    minWidth: 64,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFD6F5",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  signOutButtonText: {
    color: "#2F68F5",
    fontSize: 14,
    fontWeight: "700",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderRadius: 32,
    backgroundColor: "#E3EFFF",
  },
  emptyIconText: {
    color: "#2F68F5",
    fontSize: 28,
  },
  emptyTitle: {
    color: "#17233B",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyMessage: {
    marginTop: 8,
    color: "#71819A",
    fontSize: 14,
    textAlign: "center",
  },
  postCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  postTitle: {
    color: "#17233B",
    fontSize: 16,
    fontWeight: "600",
  },
  errorMessage: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    color: "#B42318",
    fontSize: 13,
  },
});
