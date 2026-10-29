import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import {
  deletePost,
  formatPostDate,
  getPosts,
  getSubjectInfo,
  type Post,
} from "@/services/posts/posts-api";

const PAGE_SIZE = 10;

export default function AdminPostsScreen() {
  const { session } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const fetchPosts = useCallback(
    (currentPage: number, authToken?: string | null) => {
      let isMounted = true;

      getPosts(authToken, currentPage, PAGE_SIZE)
        .then((response) => {
          if (isMounted) {
            setPosts(response.post ?? []);
            setTotal(response.total ?? 0);
            setErrorMessage(null);
          }
        })
        .catch((error: unknown) => {
          if (isMounted) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Não foi possível carregar as publicações.",
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        });

      return () => {
        isMounted = false;
      };
    },
    [],
  );

  useEffect(() => {
    return fetchPosts(page, session);
  }, [fetchPosts, page, session]);

  function handleRefresh() {
    setIsRefreshing(true);
    fetchPosts(page, session);
  }

  function handleRetry() {
    setIsLoading(true);
    setErrorMessage(null);
    fetchPosts(page, session);
  }

  function handleEdit(postId: string) {
    router.push({
      pathname: "/admin/posts/[id]/edit",
      params: { id: postId },
    });
  }

  function confirmDelete(post: Post) {
    Alert.alert(
      "Excluir publicação",
      `Tem certeza que deseja excluir "${post.title}"? Essa ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => handleDelete(post.id),
        },
      ],
    );
  }

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    try {
      await deletePost(postId, session);
      fetchPosts(page, session);
    } catch (error) {
      Alert.alert(
        "Não foi possível excluir",
        error instanceof Error
          ? error.message
          : "Tente novamente em instantes.",
      );
    } finally {
      setDeletingId(null);
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
        <View style={styles.headerTitles}>
          <Text style={styles.eyebrow}>PAINEL ADMINISTRATIVO</Text>
          <Text style={styles.title}>Publicações</Text>
        </View>
        <Pressable
          accessibilityLabel="Nova publicação"
          accessibilityRole="button"
          onPress={() => router.push("/admin/posts/new")}
          style={({ pressed }) => [
            styles.newButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.newButtonText}>+ Nova</Text>
        </Pressable>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator color="#2F68F5" size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateSubtitle}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={posts}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma publicação cadastrada</Text>
              <Text style={styles.emptySubtitle}>
                Toque em &quot;+ Nova&quot; para criar a primeira publicação.
              </Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={page <= 1}
                  onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                  style={({ pressed }) => [
                    styles.paginationButton,
                    page <= 1 && styles.paginationButtonDisabled,
                    pressed && page > 1 && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationButtonText,
                      page <= 1 && styles.paginationButtonTextDisabled,
                    ]}
                  >
                    Anterior
                  </Text>
                </Pressable>

                <Text style={styles.paginationInfo}>
                  Página <Text style={styles.paginationBold}>{page}</Text> de{" "}
                  <Text style={styles.paginationBold}>{totalPages}</Text>
                </Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={page >= totalPages}
                  onPress={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  style={({ pressed }) => [
                    styles.paginationButton,
                    page >= totalPages && styles.paginationButtonDisabled,
                    pressed && page < totalPages && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationButtonText,
                      page >= totalPages && styles.paginationButtonTextDisabled,
                    ]}
                  >
                    Próxima
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              colors={["#2F68F5"]}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
            />
          }
          renderItem={({ item }) => {
            const subjectInfo = getSubjectInfo(item.subject);
            const dateStr = formatPostDate(item.createdAt, "short");
            const isDeletingRow = deletingId === item.id;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.subjectBadge,
                      { backgroundColor: subjectInfo.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subjectBadgeText,
                        { color: subjectInfo.color },
                      ]}
                    >
                      {subjectInfo.label}
                    </Text>
                  </View>
                  {dateStr ? (
                    <Text style={styles.postDate}>{dateStr}</Text>
                  ) : null}
                </View>

                <Text numberOfLines={2} style={styles.postTitle}>
                  {item.title}
                </Text>

                <Text numberOfLines={1} style={styles.postAuthor}>
                  ✍ {item.author?.name ?? "Professor(a) responsável"}
                </Text>

                <View style={styles.cardActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isDeletingRow}
                    onPress={() => handleEdit(item.id)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.editButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isDeletingRow}
                    onPress={() => confirmDelete(item)}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.deleteButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    {isDeletingRow ? (
                      <ActivityIndicator color="#DC2626" size="small" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
          style={styles.list}
        />
      )}
    </View>
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
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBF6",
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
  headerTitles: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#2F68F5",
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  newButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#2F68F5",
  },
  newButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2F68F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  postDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 21,
    marginBottom: 6,
  },
  postAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: "#EBF3FF",
    borderColor: "#BFDBFE",
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F68F5",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 20,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2F68F5",
  },
  paginationButtonTextDisabled: {
    color: "#94A3B8",
  },
  paginationInfo: {
    fontSize: 13,
    color: "#64748B",
  },
  paginationBold: {
    fontWeight: "700",
    color: "#1E293B",
  },
});
