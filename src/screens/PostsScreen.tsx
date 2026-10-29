import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/auth-context";
import {
  formatPostDate,
  getPosts,
  getSubjectInfo,
  SUBJECT_MAP,
  type Post,
} from "@/services/posts/posts-api";

const PAGE_SIZE = 6;

function SkeletonCard() {
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Animated.View style={[styles.skeletonBadge, { opacity }]} />
        <Animated.View style={[styles.skeletonDate, { opacity }]} />
      </View>
      <Animated.View style={[styles.skeletonTitle, { opacity }]} />
      <Animated.View style={[styles.skeletonLine, { opacity }]} />
      <Animated.View style={[styles.skeletonLineShort, { opacity }]} />
      <View style={styles.cardFooter}>
        <Animated.View style={[styles.skeletonAuthor, { opacity }]} />
        <Animated.View style={[styles.skeletonAction, { opacity }]} />
      </View>
    </View>
  );
}

export default function PostsScreen() {
  const { session, signOut, isTeacher } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("ALL");

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

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch {
      // Fallback
    } finally {
      setIsSigningOut(false);
    }
  }

  // Filtragem local por matéria e termo de busca (título, resumo/conteúdo ou autor)
  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return posts
      .filter((post) => !post.isDeleted)
      .filter((post) => {
        const matchesSubject =
          selectedSubject === "ALL" || post.subject === selectedSubject;

        const matchesSearch =
          term === "" ||
          post.title.toLowerCase().includes(term) ||
          post.content.toLowerCase().includes(term) ||
          (post.summary?.toLowerCase().includes(term) ?? false) ||
          (post.author?.name?.toLowerCase().includes(term) ?? false);

        return matchesSubject && matchesSearch;
      });
  }, [posts, selectedSubject, searchTerm]);

  function handleOpenPost(postId: string) {
    router.push({
      pathname: "/post/[id]",
      params: { id: postId },
    });
  }

  return (
    <View style={styles.container}>
      {/* Top Header & Filters (Fixos com fundo sólido) */}
      <View style={styles.topContainer}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.eyebrow}>PORTAL ESCOLAR</Text>
            <Text style={styles.title}>Feed de Publicações</Text>
          </View>
          <View style={styles.headerActions}>
            {isTeacher ? (
              <Pressable
                accessibilityHint="Abre o painel administrativo de publicações"
                accessibilityLabel="Painel Admin"
                accessibilityRole="button"
                onPress={() => router.push("/admin/posts")}
                style={({ pressed }) => [
                  styles.adminButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.adminButtonText}>Painel Admin</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityHint="Encerra a sessão atual"
              accessibilityLabel="Sair da conta"
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isSigningOut ? (
                <ActivityIndicator color="#DC2626" size="small" />
              ) : (
                <Text style={styles.signOutButtonText}>Sair</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Barra de Busca */}
        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            accessibilityLabel="Buscar publicações"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => setIsSearchFocused(false)}
            onChangeText={setSearchTerm}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Buscar posts por palavra-chave ou autor..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchTerm}
          />
          {searchTerm.length > 0 ? (
            <Pressable
              accessibilityLabel="Limpar busca"
              accessibilityRole="button"
              onPress={() => setSearchTerm("")}
              style={({ pressed }) => [
                styles.clearSearchButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Filtros Horizontais por Disciplina */}
        <View style={styles.filterSection}>
          <ScrollView
            contentContainerStyle={styles.filterScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSelectedSubject("ALL");
                setPage(1);
              }}
              style={({ pressed }) => [
                styles.filterPill,
                selectedSubject === "ALL" && styles.filterPillActive,
                pressed && styles.pillPressed,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedSubject === "ALL" && styles.filterPillTextActive,
                ]}
              >
                Todos
              </Text>
            </Pressable>

            {Object.entries(SUBJECT_MAP).map(([key, info]) => {
              const isSelected = selectedSubject === key;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={key}
                  onPress={() => {
                    setSelectedSubject(key);
                    setPage(1);
                  }}
                  style={({ pressed }) => [
                    styles.filterPill,
                    isSelected && {
                      backgroundColor: info.color,
                      borderColor: info.color,
                    },
                    pressed && styles.pillPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextActive,
                    ]}
                  >
                    {info.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Lista de Publicações ou Skeleton */}
      {isLoading && !isRefreshing ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
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
          data={filteredPosts}
          keyboardShouldPersistTaps="always"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>▤</Text>
              <Text style={styles.emptyTitle}>Nenhuma publicação encontrada</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm || selectedSubject !== "ALL"
                  ? "Tente ajustar os filtros ou o termo de busca."
                  : "Ainda não há postagens publicadas pelos professores."}
              </Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 && !searchTerm ? (
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
            const authorName = item.author?.name ?? "Professor(a) responsável";
            const summaryText =
              item.summary ||
              (item.content ? item.content.slice(0, 120) + "..." : "");

            return (
              <Pressable
                accessibilityHint="Toque para ler a publicação completa"
                accessibilityLabel={`Publicação: ${item.title}`}
                accessibilityRole="button"
                onPress={() => handleOpenPost(item.id)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
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

                <Text style={styles.postTitle}>{item.title}</Text>

                <Text numberOfLines={3} style={styles.postSummary}>
                  {summaryText}
                </Text>

                <View style={styles.cardFooter}>
                  <Text numberOfLines={1} style={styles.postAuthor}>
                    ✍ {authorName}
                  </Text>

                  <View style={styles.readMoreWrapper}>
                    <Text style={styles.readMoreText}>Ler post completo →</Text>
                  </View>
                </View>
              </Pressable>
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
  topContainer: {
    paddingTop: 44,
    backgroundColor: "#F4F8FF",
    zIndex: 10,
    elevation: 3,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBF6",
  },
  list: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
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
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2F68F5",
  },
  adminButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  signOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    height: 46,
    marginBottom: 12,
  },
  searchContainerFocused: {
    borderColor: "#2F68F5",
    backgroundColor: "#FAFCFF",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    height: "100%",
    ...Platform.select({
      web: {
        outlineStyle: "none" as never,
      },
    }),
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "700",
  },
  filterSection: {
    marginBottom: 6,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterPillActive: {
    backgroundColor: "#2F68F5",
    borderColor: "#2F68F5",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  pillPressed: {
    transform: [{ scale: 0.94 }],
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
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
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 32,
    color: "#94A3B8",
    marginBottom: 12,
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
    shadowColor: "#2F68F5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
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
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
    marginBottom: 6,
  },
  postSummary: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  postAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    flex: 1,
    marginRight: 8,
  },
  readMoreWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F68F5",
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
  // Skeleton Styles
  skeletonBadge: {
    width: 80,
    height: 18,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  skeletonDate: {
    width: 60,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonTitle: {
    width: "75%",
    height: 20,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    marginBottom: 10,
  },
  skeletonLine: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    marginBottom: 6,
  },
  skeletonLineShort: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    marginBottom: 14,
  },
  skeletonAuthor: {
    width: 100,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonAction: {
    width: 120,
    height: 16,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
});
