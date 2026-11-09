import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { createPost, getPostAuthor } from "@/services/posts/posts-api";
import PostForm, { type PostFormValues } from "@/screens/post-form/PostForm";

export default function CreatePostScreen() {
  const { session, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);

  // O token não traz o nome do usuário, então ele é buscado na API.
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getPostAuthor(String(user.id), session).then((author) => {
      if (isMounted && author?.name) {
        setAuthorName(author.name);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, session]);

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
          imageFile: values.imageFile,
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
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
        authorName={authorName ?? user?.email ?? "Professor(a) responsável"}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitLabel="Publicar"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBF6",
    zIndex: 10,
    elevation: 3,
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
