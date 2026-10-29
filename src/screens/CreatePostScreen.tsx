import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { createPost } from "@/services/posts/posts-api";
import PostForm, { type PostFormValues } from "@/screens/post-form/PostForm";

export default function CreatePostScreen() {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(values: PostFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createPost(
        {
          title: values.title,
          content: values.content,
          subject: values.subject,
          summary: values.summary || undefined,
          imageUrl: values.imageUrl || undefined,
          link: values.link || undefined,
        },
        session,
      );

      router.replace({
        pathname: "/post/[id]",
        params: { id: created.id },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a publicação.",
      );
      setIsSubmitting(false);
    }
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
        <Text style={styles.title}>Nova publicação</Text>
      </View>

      <PostForm
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitLabel="Publicar"
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
});
