import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import {
  calculateReadingTime,
  formatPostDate,
  getPostById,
  getPostImageUrl,
  getSubjectInfo,
  type Post,
} from "@/services/posts/posts-api";

interface PostDetailScreenProps {
  id: string;
}

function getInitials(name?: string): string {
  if (!name) return "PR";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DetailSkeleton() {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.scrollContent}>
      <Animated.View style={[styles.skeletonBack, { opacity }]} />
      <View style={styles.metaRow}>
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
        <Animated.View style={[styles.skeletonTime, { opacity }]} />
      </View>
      <Animated.View style={[styles.skeletonDetailTitle, { opacity }]} />
      <Animated.View style={[styles.skeletonDetailTitle2, { opacity }]} />
      <Animated.View style={[styles.skeletonDetailAuthor, { opacity }]} />
      <Animated.View style={[styles.skeletonDetailImage, { opacity }]} />
      <View style={styles.contentCard}>
        <Animated.View style={[styles.skeletonLine, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, { opacity }]} />
        <Animated.View style={[styles.skeletonLineShort, { opacity }]} />
      </View>
    </View>
  );
}

export default function PostDetailScreen({ id }: PostDetailScreenProps) {
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasImageError, setHasImageError] = useState(false);

  const [contentOpacity] = useState(() => new Animated.Value(0));

  const fetchPost = useCallback((postId: string, authToken?: string | null) => {
    let isMounted = true;

    getPostById(postId, authToken)
      .then((data) => {
        if (isMounted) {
          setPost(data);
          setErrorMessage(null);
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }).start();
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
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
  }, [contentOpacity]);

  useEffect(() => {
    if (!id) return;
    return fetchPost(id, session);
  }, [id, session, fetchPost]);

  function handleRetry() {
    setIsLoading(true);
    setErrorMessage(null);
    setHasImageError(false);
    contentOpacity.setValue(0);
    fetchPost(id, session);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DetailSkeleton />
      </View>
    );
  }

  if (errorMessage || !post) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
          <Text style={styles.errorMessage}>
            {errorMessage ?? "Publicação não encontrada."}
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
              <Text style={styles.secondaryButtonText}>Voltar ao feed</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const subjectInfo = getSubjectInfo(post.subject);
  const imageUrl = getPostImageUrl(post);
  const readingTime = calculateReadingTime(post.content);
  const formattedDate = formatPostDate(post.createdAt, "long");
  const authorName = post.author?.name ?? "Professor(a) responsável";
  const authorInitials = getInitials(authorName);
  const authorRole =
    post.author?.role === "TEACHER"
      ? "Professor(a) • Corpo Docente"
      : post.author?.role === "STUDENT"
        ? "Aluno(a)"
        : "Corpo Docente • Escola X";

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <Animated.View style={{ opacity: contentOpacity }}>
        <Pressable
          accessibilityHint="Retorna para a listagem de publicações"
          accessibilityLabel="Voltar ao feed"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backButtonArrow}>←</Text>
          <Text style={styles.backButtonText}>Voltar ao feed</Text>
        </Pressable>

        <View style={styles.metaRow}>
          <View
            style={[styles.subjectBadge, { backgroundColor: subjectInfo.bg }]}
          >
            <Text
              style={[styles.subjectBadgeText, { color: subjectInfo.color }]}
            >
              {subjectInfo.label}
            </Text>
          </View>
          <Text style={styles.readingTimeText}>⏱ {readingTime} min de leitura</Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>

        {formattedDate ? (
          <Text style={styles.dateText}>Publicado em {formattedDate}</Text>
        ) : null}

        <View style={styles.authorCard}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>{authorInitials}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.authorRole}>{authorRole}</Text>
          </View>
        </View>

        {imageUrl && !hasImageError ? (
          <Image
            accessibilityLabel={`Capa da publicação: ${post.title}`}
            onError={() => setHasImageError(true)}
            resizeMode="cover"
            source={{ uri: imageUrl }}
            style={styles.coverImage}
          />
        ) : null}

        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{post.content}</Text>
        </View>

        <View style={styles.footerNotice}>
          <Text style={styles.footerNoticeTitle}>Espaço Seguro & Pedagógico</Text>
          <Text style={styles.footerNoticeText}>
            Todas as publicações são elaboradas pela equipe pedagógica para
            promover um ambiente seguro e de aprendizado contínuo.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F8FF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F4F8FF",
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    marginRight: 6,
    fontWeight: "600",
  },
  backButtonText: {
    fontSize: 14,
    color: "#2F68F5",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  readingTimeText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 32,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  authorAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4338CA",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  authorRole: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  coverImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: "#E2E8F0",
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#334155",
  },
  footerNotice: {
    backgroundColor: "#EBF3FF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2F68F5",
  },
  footerNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  footerNoticeText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#3B82F6",
  },
  // Detail Skeleton
  skeletonBack: {
    width: 120,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  skeletonBadge: {
    width: 90,
    height: 22,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  skeletonTime: {
    width: 110,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonDetailTitle: {
    width: "90%",
    height: 26,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  skeletonDetailTitle2: {
    width: "65%",
    height: 26,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    marginBottom: 18,
  },
  skeletonDetailAuthor: {
    width: "100%",
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    marginBottom: 20,
  },
  skeletonDetailImage: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    marginBottom: 24,
  },
  skeletonLine: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: "70%",
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
});
