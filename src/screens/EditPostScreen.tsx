import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { getPostById, updatePost, type Post } from "@/services/posts/posts-api";
import PostForm, { type PostFormValues } from "@/screens/post-form/PostForm";

interface EditPostScreenProps {
  id: string;
}

export default function EditPostScreen({ id }: EditPostScreenProps) {
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchPost = useCallback((postId: string, authToken?: string | null) => {
    let isMounted = true;

    getPostById(postId, authToken)
      .then((data) => {
        if (isMounted) {
          setPost(data);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar a publicação.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    return fetchPost(id, session);
  }, [id, session, fetchPost]);

  function handleRetry() {
    setIsLoading(true);
    setLoadError(null);
    fetchPost(id, session);
  }

  async function handleSubmit(values: PostFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Sempre envia summary/imageUrl/link (mesmo vazios): o backend sobrescreve
      // com undefined quando a chave não vem no corpo da requisição.
      await updatePost(
        id,
        {
          title: values.title,
          content: values.content,
          subject: values.subject,
          summary: values.summary,
          imageUrl: values.imageUrl,
          link: values.link,
        },
        session,
      );

      router.back();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as alterações.",
      );
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color="#2F68F5" size="large" />
      </View>
    );
  }

  if (loadError || !post) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
          <Text style={styles.errorMessage}>
            {loadError ?? "Publicação não encontrada."}
          </Text>
          <View style={styles.errorActions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Tentar novamente</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Voltar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backButtonArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Editar publicação</Text>
      </View>

      <PostForm
        errorMessage={submitError}
        initialValues={{
          title: post.title,
          content: post.content,
          summary: post.summary ?? "",
          subject: typeof post.subject === "string" ? post.subject : "",
          imageUrl: post.imageUrl ?? "",
          link: post.link ?? "",
        }}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FF",
    paddingTop: 48,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F4F8FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.82,
  },
  backButtonArrow: {
    fontSize: 16,
    color: "#2F68F5",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  errorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#2F68F5",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
});
